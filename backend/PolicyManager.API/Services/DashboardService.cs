using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Helpers;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services
{
    public interface IDashboardService
    {
        Task<DashboardDto> GetDashboardAsync(string? holderName = null);
        Task<DashboardStatsDto> GetStatsAsync(string[] selectedMembers);
    }

    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IDistributedCache _cache;

        public DashboardService(AppDbContext context, IMapper mapper, IDistributedCache cache)
        {
            _context = context;
            _mapper = mapper;
            _cache = cache;
        }

        public async Task<DashboardDto> GetDashboardAsync(string? holderName = null)
        {
            // If filtering by holderName, we still use the optimized EF query for now
            // Future optimization: Update SP to accept parameters
            if (!string.IsNullOrEmpty(holderName))
            {
                return await GetDashboardWithFilterAsync(holderName);
            }

            // Using Stored Procedure for the main dashboard stats
            var stats = await _context.Database
                .SqlQueryRaw<DashboardStatsSpDto>("EXEC sp_GetDashboardStats")
                .ToListAsync();
            
            var s = stats.FirstOrDefault() ?? new DashboardStatsSpDto();

            var dashboard = new DashboardDto
            {
                TotalPolicies = s.TotalPolicies,
                ActivePolicies = s.ActivePolicies,
                ExpiredPolicies = s.ExpiredPolicies,
                PendingPolicies = s.PendingPolicies,
                CancelledPolicies = s.CancelledPolicies,
                TotalPremiumAmount = s.TotalPremiumAmount,
                TotalCoverageAmount = s.TotalCoverageAmount,
                TotalPendingInstallments = s.OverdueCount,
                TotalPendingAmount = s.OverdueAmount,
                OverdueCount = s.OverdueCount,
                OverdueAmount = s.OverdueAmount
            };

            // These parts still use EF for now (complex groupings)
            var baseQuery = _context.Policies.Where(p => !p.IsDeleted);

            dashboard.PolicyTypeCounts = await baseQuery
                .GroupBy(p => p.PolicyType!.Name)
                .Select(g => new PolicyTypeCountDto
                {
                    PolicyTypeName = g.Key,
                    Count = g.Count(),
                    TotalPremium = g.Sum(p => p.PremiumAmount)
                })
                .OrderByDescending(x => x.Count)
                .ToListAsync();

            dashboard.MonthlyPolicies = (await baseQuery
                .Where(p => p.CreatedAt >= DateTime.UtcNow.AddMonths(-12))
                .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
                .ToListAsync())
                .Select(x => new MonthlyPolicyDto { Month = $"{x.Year}-{x.Month:D2}", Count = x.Count })
                .OrderBy(x => x.Month)
                .ToList();

            dashboard.RecentPolicies = _mapper.Map<List<PolicyDto>>(
                await baseQuery.OrderByDescending(p => p.CreatedAt).Take(5).ToListAsync());

            return dashboard;
        }

        private async Task<DashboardDto> GetDashboardWithFilterAsync(string holderName)
        {
            var query = _context.Policies.Include(p => p.PolicyType).Where(p => !p.IsDeleted && p.PolicyHolderName.Contains(holderName));
            var today = DateTime.UtcNow.Date;

            return new DashboardDto
            {
                TotalPolicies = await query.CountAsync(),
                ActivePolicies = await query.CountAsync(p => p.Status == PolicyConstants.StatusActive),
                ExpiredPolicies = await query.CountAsync(p => p.Status == PolicyConstants.StatusExpired),
                TotalPremiumAmount = await query.SumAsync(p => p.PremiumAmount),
                TotalCoverageAmount = await query.SumAsync(p => p.CoverageAmount ?? 0),
                OverdueCount = await query.CountAsync(p => p.Status == PolicyConstants.StatusActive && p.NextInstallmentDate != null && p.NextInstallmentDate < today),
                OverdueAmount = await query.Where(p => p.Status == PolicyConstants.StatusActive && p.NextInstallmentDate != null && p.NextInstallmentDate < today).SumAsync(p => p.PremiumAmount),
                // ... other fields omitted for brevity in filter mode
            };
        }

        public async Task<DashboardStatsDto> GetStatsAsync(string[] selectedMembers)
        {
            if (selectedMembers == null || selectedMembers.Length == 0)
            {
                selectedMembers = await _context.FamilyMembers.Select(m => m.Name).ToArrayAsync();
            }

            var oneTimeInvestments = await _context.Policies
                .Include(p => p.FamilyMember)
                .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
                .Where(p => !p.IsDeleted && p.Status == PolicyConstants.StatusActive && p.InstallmentType == PolicyConstants.InstallmentOneTime)
                .ToListAsync();

            var today = DateTime.UtcNow.Date;
            var fyEnd = FYHelper.GetCurrentFYEnd();

            var upcomingQuery = await _context.Policies
                .Include(p => p.FamilyMember)
                .Where(p => !p.IsDeleted
                    && p.Status == PolicyConstants.StatusActive
                    && p.NextInstallmentDate != null
                    && p.NextInstallmentDate >= today
                    && p.NextInstallmentDate <= fyEnd)
                .ToListAsync();

            // Filter by selected members if specified
            var upcomingFiltered = selectedMembers.Length > 0
                ? upcomingQuery.Where(p => p.FamilyMember == null || selectedMembers.Contains(p.FamilyMember.Name)).ToList()
                : upcomingQuery;

            decimal upcomingPremiumAmount = 0;
            int upcomingPremiumCount = 0;

            foreach (var p in upcomingFiltered)
            {
                var (amount, count) = CalculateUpcomingPremiumForRange(p, today, fyEnd);
                upcomingPremiumAmount += amount;
                upcomingPremiumCount += count;
            }

            var stats = new DashboardStatsDto
            {
                SelectedMembers = selectedMembers,
                CurrentMonthBudget = await GetCurrentMonthBudgetAsync(selectedMembers),
                NextMonthBudget = await GetNextMonthBudgetAsync(selectedMembers),
                CurrentFYBudget = await GetCurrentFYBudgetAsync(selectedMembers),
                CurrentFYIncome = await GetCurrentFYIncomeAsync(selectedMembers),
                NextYearForecast = await GetNextYearForecastAsync(selectedMembers),
                OneTimeInvestmentTotal = oneTimeInvestments.Sum(p => p.PremiumAmount),
                OneTimeInvestmentCount = oneTimeInvestments.Count,
                UpcomingPremiumAmount = upcomingPremiumAmount,
                UpcomingPremiumCount = upcomingPremiumCount,
                ForecastList = await GetFullFYForecastListAsync(selectedMembers),
                MonthlyForecasts = await GetMonthlyForecastsAsync(selectedMembers)
            };
            return stats;
        }

        private (decimal Amount, int Count) CalculateUpcomingPremiumForRange(Policy p, DateTime rangeStart, DateTime rangeEnd)
        {
            if (p.NextInstallmentDate == null || string.IsNullOrEmpty(p.InstallmentType))
            {
                if (p.NextInstallmentDate >= rangeStart && p.NextInstallmentDate <= rangeEnd)
                    return (p.InstallmentAmount ?? p.PremiumAmount, 1);
                return (0, 0);
            }

            decimal totalAmount = 0;
            int count = 0;
            DateTime currentDue = p.NextInstallmentDate.Value;
            string type = p.InstallmentType.ToLower();

            int iterations = 0;
            while (currentDue <= rangeEnd && currentDue <= p.EndDate && iterations < 1000)
            {
                iterations++;
                if (currentDue >= rangeStart)
                {
                    totalAmount += p.InstallmentAmount ?? p.PremiumAmount;
                    count++;
                }

                currentDue = type switch
                {
                    "monthly" => currentDue.AddMonths(1),
                    "quarterly" => currentDue.AddMonths(3),
                    "half-yearly" => currentDue.AddMonths(6),
                    "yearly" => currentDue.AddYears(1),
                    _ => currentDue.AddYears(100)
                };
                
                if (type == PolicyConstants.InstallmentOneTime.ToLower() || type == "single") break;
            }

            return (totalAmount, count);
        }

        private async Task<decimal> GetNextMonthBudgetAsync(string[] selectedMembers)
        {
            var nextMonthDate = DateTime.UtcNow.AddMonths(1);
            var monthStart = new DateTime(nextMonthDate.Year, nextMonthDate.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var policies = await _context.Policies
                .Include(p => p.FamilyMember)
                .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
                .Where(p => p.Status == PolicyConstants.StatusActive && !p.IsDeleted)
                .ToListAsync();

            decimal total = 0;
            foreach (var p in policies)
            {
                total += CalculateBudgetForRange(p, monthStart, monthEnd);
            }
            return total;
        }

        private async Task<decimal> GetCurrentFYIncomeAsync(string[] selectedMembers)
        {
            var (fyStart, fyEnd) = FYHelper.GetCurrentFYRange();

            return await _context.Policies
                .Include(p => p.FamilyMember)
                .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
                .Where(p => !p.IsDeleted && p.MaturityDate >= fyStart && p.MaturityDate <= fyEnd)
                .SumAsync(p => p.TotalMaturityAmount ?? p.CoverageAmount ?? 0);
        }

        private async Task<decimal> GetCurrentMonthBudgetAsync(string[] selectedMembers)
        {
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var policies = await _context.Policies
                .Include(p => p.FamilyMember)
                .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
                .Where(p => p.Status == PolicyConstants.StatusActive && !p.IsDeleted)
                .ToListAsync();

            decimal total = 0;
            foreach (var p in policies)
            {
                total += CalculateBudgetForRange(p, monthStart, monthEnd);
            }
            return total;
        }

        private async Task<decimal> GetCurrentFYBudgetAsync(string[] selectedMembers)
        {
            var (fyStart, fyEnd) = FYHelper.GetCurrentFYRange();

            var policies = await _context.Policies
                .Include(p => p.FamilyMember)
                .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
                .Where(p => p.Status == PolicyConstants.StatusActive && !p.IsDeleted)
                .ToListAsync();

            decimal total = 0;
            foreach (var p in policies)
            {
                total += CalculateYearlyPremiumForFY(p, fyStart, fyEnd);
            }
            return total;
        }

        private async Task<decimal> GetNextYearForecastAsync(string[] selectedMembers)
        {
            var currentFYEnd = FYHelper.GetCurrentFYEnd();
            var nextFYStart = currentFYEnd.AddDays(1);
            var nextFYEnd = nextFYStart.AddYears(1).AddDays(-1);

            var policies = await _context.Policies
                .Include(p => p.FamilyMember)
                .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
                .Where(p => p.Status == PolicyConstants.StatusActive && !p.IsDeleted && p.EndDate >= nextFYStart)
                .ToListAsync();

            decimal total = 0;
            foreach (var p in policies)
            {
                total += CalculateBudgetForRange(p, nextFYStart, nextFYEnd);
            }
            return total;
        }

        private decimal CalculateBudgetForRange(Policy p, DateTime rangeStart, DateTime rangeEnd)
        {
            if (p.NextInstallmentDate == null || string.IsNullOrEmpty(p.InstallmentType))
            {
                if (p.NextInstallmentDate >= rangeStart && p.NextInstallmentDate <= rangeEnd)
                    return p.InstallmentAmount ?? p.PremiumAmount;
                return 0;
            }

            decimal total = 0;
            DateTime currentDue = p.NextInstallmentDate.Value;
            string type = p.InstallmentType.ToLower();

            int iterations = 0;
            while (currentDue <= rangeEnd && currentDue <= p.EndDate && iterations < 1000)
            {
                iterations++;
                if (currentDue >= rangeStart)
                {
                    total += p.InstallmentAmount ?? p.PremiumAmount;
                }

                currentDue = type switch
                {
                    "monthly" => currentDue.AddMonths(1),
                    "quarterly" => currentDue.AddMonths(3),
                    "half-yearly" => currentDue.AddMonths(6),
                    "yearly" => currentDue.AddYears(1),
                    _ => currentDue.AddYears(100)
                };
                
                if (type == PolicyConstants.InstallmentOneTime.ToLower() || type == "single") break;
            }

            return total;
        }

        private decimal CalculateYearlyPremiumForFY(Policy p, DateTime fyStart, DateTime fyEnd)
        {
            if (p.Status != PolicyConstants.StatusActive)
            {
                return 0;
            }

            decimal premium = p.PremiumAmount;
            if (premium <= 0) return 0;

            string instType = (p.InstallmentType ?? "").ToLower();
            DateTime? start = p.StartDate;
            DateTime? end = p.EndDate;
            DateTime? nextInst = p.NextInstallmentDate;

            if (start.HasValue && start.Value.Year < 1900) return 0;
            if (end.HasValue && end.Value.Year < 1900) return 0;
            if (nextInst.HasValue && nextInst.Value.Year < 1900) return 0;

            if (instType == PolicyConstants.InstallmentOneTime.ToLower() || instType == "single" || string.IsNullOrEmpty(p.InstallmentType))
            {
                if (start.HasValue && start.Value >= fyStart && start.Value <= fyEnd)
                {
                    return premium;
                }
                return 0;
            }

            DateTime firstInstallmentDate;
            if (nextInst.HasValue)
            {
                firstInstallmentDate = nextInst.Value;
            }
            else if (start.HasValue)
            {
                firstInstallmentDate = start.Value;
            }
            else
            {
                return 0;
            }

            decimal total = 0;
            DateTime currentDue = firstInstallmentDate;
            
            if (start.HasValue && start.Value < currentDue)
            {
                currentDue = start.Value;
            }

            int iterations = 0;
            while (currentDue <= fyEnd && (!end.HasValue || currentDue <= end.Value) && iterations < 1000)
            {
                iterations++;
                if (currentDue >= fyStart)
                {
                    total += premium;
                }

                currentDue = instType switch
                {
                    "monthly" => currentDue.AddMonths(1),
                    "quarterly" => currentDue.AddMonths(3),
                    "half-yearly" => currentDue.AddMonths(6),
                    "yearly" => currentDue.AddYears(1),
                    _ => currentDue.AddYears(100)
                };
                
                if (instType == PolicyConstants.InstallmentOneTime.ToLower() || instType == "single") break;
            }

            return total;
        }
        
        private async Task<List<MonthlyForecastDto>> GetMonthlyForecastsAsync(string[] selectedMembers)
        {
            var (fyStart, fyEnd) = FYHelper.GetCurrentFYRange();
            
            var policies = await _context.Policies
                .Include(p => p.FamilyMember)
                .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
                .Where(p => p.Status == PolicyConstants.StatusActive && !p.IsDeleted)
                .ToListAsync();

            var forecasts = new List<MonthlyForecastDto>();
            
            for (var date = fyStart; date <= fyEnd; date = date.AddMonths(1))
            {
                var monthStart = new DateTime(date.Year, date.Month, 1);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);
                
                decimal monthlyTotal = 0;
                foreach (var policy in policies)
                {
                    monthlyTotal += CalculateBudgetForRange(policy, monthStart, monthEnd);
                }

                forecasts.Add(new MonthlyForecastDto
                {
                    Month = monthStart.ToString("MMM yyyy"),
                    TotalAmount = monthlyTotal
                });
            }

            return forecasts;
        }

        private async Task<List<PolicyForecastDto>> GetFullFYForecastListAsync(string[] selectedMembers)
        {
            var (fyStart, fyEnd) = FYHelper.GetCurrentFYRange();
            var policies = await _context.Policies
                .Include(p => p.FamilyMember)
                .Include(p => p.PolicyType)
                .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
                .Where(p => p.Status == PolicyConstants.StatusActive && !p.IsDeleted && p.NextInstallmentDate != null && 
                            p.NextInstallmentDate <= fyEnd)
                .OrderBy(p => p.NextInstallmentDate)
                .ToListAsync();

            return policies.Select(p => new PolicyForecastDto
            {
                PolicyName = p.PolicyHolderName,
                PolicyNumber = p.PolicyNumber,
                MemberName = p.FamilyMember!.Name,
                AgeAtInception = p.AgeAtInception,
                InstallmentAmount = p.InstallmentAmount ?? p.PremiumAmount,
                NextInstallmentDate = p.NextInstallmentDate,
                PolicyType = p.PolicyType?.Name ?? "General",
                CompanyName = p.CompanyName,
                ProductName = p.ProductName,
                Status = p.Status,
                PremiumAmount = p.PremiumAmount,
                CoverageAmount = p.CoverageAmount,
                AgentName = p.AgentName
            }).ToList();
        }
    }
}
