using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Helpers;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

// ═══════════════════════════════════════════════════════════════
//  INVESTMENT FORECAST SERVICE
//  Projects installments forward based on InstallmentType
//  to give accurate monthly/yearly forecast
// ═══════════════════════════════════════════════════════════════

public interface IInvestmentForecastService
{
    Task<InvestmentForecastDto> GetFullForecastAsync(int? fiscalYear, string[] selectedMembers);
    Task<ForecastImpactDto> GetForecastImpactAsync(PolicyDto newPolicy, string[] selectedMembers);
}

public class InvestmentForecastService : IInvestmentForecastService
{
    private readonly AppDbContext _context;
    private readonly IDistributedCache _cache;

    public InvestmentForecastService(AppDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<InvestmentForecastDto> GetFullForecastAsync(int? fiscalYear, string[] selectedMembers)
    {
        var fyYear = fiscalYear ?? FYHelper.GetCurrentFYStartYear();
        
        // Cache implementation
        var membersKey = selectedMembers != null && selectedMembers.Length > 0 
            ? string.Join("-", selectedMembers.OrderBy(m => m)) 
            : "all";
        var cacheKey = $"forecast_{fyYear}_{membersKey}";

        var cachedData = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cachedData))
        {
            return System.Text.Json.JsonSerializer.Deserialize<InvestmentForecastDto>(cachedData)!;
        }

        var fyStart = new DateTime(fyYear, 4, 1);
        var fyEnd = new DateTime(fyYear + 1, 3, 31, 23, 59, 59);

        // Fetch relevant members
        if (selectedMembers == null || selectedMembers.Length == 0)
        {
            selectedMembers = await _context.FamilyMembers.Select(m => m.Name).ToArrayAsync();
        }

        // Fetch all active policies for selected members
        var policies = await _context.Policies
            .Include(p => p.FamilyMember)
            .Include(p => p.PolicyType)
            .Include(p => p.Payments)
            .Where(p => !p.IsDeleted && p.Status == "Active")
            .Where(p => p.FamilyMember != null && selectedMembers.Contains(p.FamilyMember.Name))
            .ToListAsync();

        // Also include unassigned policies if "All" selected
        if (selectedMembers.Length == await _context.FamilyMembers.CountAsync())
        {
            var unassigned = await _context.Policies
                .Include(p => p.PolicyType)
                .Include(p => p.Payments)
                .Where(p => !p.IsDeleted && p.Status == "Active" && p.FamilyMemberId == null)
                .ToListAsync();
            policies.AddRange(unassigned);
        }

        // Fetch all active mutual funds for selected members
        var mutualFunds = await _context.Set<MutualFund>()
            .Include(m => m.FamilyMember)
            .Where(m => m.Status == "Active")
            .Where(m => m.FamilyMember != null && selectedMembers.Contains(m.FamilyMember.Name))
            .ToListAsync();

        // Initialize monthly breakdown
        var monthlyBreakdown = new List<MonthlyForecastDetailDto>();
        for (var dt = fyStart; dt <= fyEnd; dt = dt.AddMonths(1))
        {
            monthlyBreakdown.Add(new MonthlyForecastDetailDto
            {
                Month = dt.ToString("MMM yyyy"),
                MonthNumber = dt.Month,
                Year = dt.Year,
                Installments = new List<PolicyInstallmentDetailDto>()
            });
        }

        // Project installments for each policy
        foreach (var policy in policies)
        {
            var projectedDates = ProjectInstallments(policy, fyStart, fyEnd);

            foreach (var (dueDate, amount) in projectedDates)
            {
                // Find the matching month
                var monthEntry = monthlyBreakdown.FirstOrDefault(m =>
                    m.MonthNumber == dueDate.Month && m.Year == dueDate.Year);

                if (monthEntry != null)
                {
                    // Check if this installment was already paid
                    var isPaid = policy.Payments?.Any(pay =>
                        pay.PaymentDate.Year == dueDate.Year &&
                        pay.PaymentDate.Month == dueDate.Month) ?? false;

                    monthEntry.Installments.Add(new PolicyInstallmentDetailDto
                    {
                        PolicyId = policy.Id,
                        MutualFundId = null,
                        PolicyNumber = policy.PolicyNumber,
                        MemberName = policy.FamilyMember?.Name ?? policy.PolicyHolderName,
                        PolicyTypeName = policy.PolicyType?.Name ?? "General",
                        CompanyName = policy.CompanyName,
                        ProductName = policy.ProductName,
                        Amount = amount,
                        DueDate = dueDate,
                        InstallmentType = policy.InstallmentType ?? "Yearly",
                        IsPaid = isPaid,
                        Status = isPaid ? "Paid" : (dueDate < DateTime.UtcNow ? "Overdue" : "Upcoming")
                    });

                    monthEntry.TotalOutflow += amount;
                }
            }

            // Check maturity within FY
            if (policy.MaturityDate.HasValue &&
                policy.MaturityDate.Value >= fyStart &&
                policy.MaturityDate.Value <= fyEnd)
            {
                var matMonth = monthlyBreakdown.FirstOrDefault(m =>
                    m.MonthNumber == policy.MaturityDate.Value.Month &&
                    m.Year == policy.MaturityDate.Value.Year);

                if (matMonth != null)
                {
                    matMonth.TotalMaturityIncome += policy.TotalMaturityAmount ?? policy.CoverageAmount ?? 0;
                }
            }
        }

        // Project installments for each mutual fund
        foreach (var fund in mutualFunds)
        {
            var projectedDates = ProjectMutualFundInstallments(fund, fyStart, fyEnd);

            foreach (var (dueDate, amount) in projectedDates)
            {
                // Find the matching month
                var monthEntry = monthlyBreakdown.FirstOrDefault(m =>
                    m.MonthNumber == dueDate.Month && m.Year == dueDate.Year);

                if (monthEntry != null)
                {
                    monthEntry.Installments.Add(new PolicyInstallmentDetailDto
                    {
                        PolicyId = 0,
                        MutualFundId = fund.Id,
                        PolicyNumber = fund.FolioNumber,
                        MemberName = fund.FamilyMember?.Name ?? "General",
                        PolicyTypeName = "Mutual Fund",
                        CompanyName = fund.FundHouse,
                        ProductName = fund.SchemeName,
                        Amount = amount,
                        DueDate = dueDate,
                        InstallmentType = fund.InvestmentType == "SIP" ? "Monthly" : "LumpSum",
                        IsPaid = false,
                        Status = dueDate < DateTime.UtcNow ? "Overdue" : "Upcoming"
                    });

                    monthEntry.TotalOutflow += amount;
                }
            }

            // Check redemption within FY
            if (fund.RedemptionDate.HasValue &&
                fund.RedemptionDate.Value >= fyStart &&
                fund.RedemptionDate.Value <= fyEnd)
            {
                var matMonth = monthlyBreakdown.FirstOrDefault(m =>
                    m.MonthNumber == fund.RedemptionDate.Value.Month &&
                    m.Year == fund.RedemptionDate.Value.Year);

                if (matMonth != null)
                {
                    matMonth.TotalMaturityIncome += fund.CurrentValuation ?? fund.InvestedAmount;
                }
            }
        }

        // Build member-wise summary combining Policies & Mutual Funds
        var allMembers = policies.Select(p => p.FamilyMember)
            .Concat(mutualFunds.Select(m => m.FamilyMember))
            .Where(fm => fm != null)
            .GroupBy(fm => fm!.Id)
            .Select(g =>
            {
                var member = g.First()!;
                var memberPolicies = policies.Where(p => p.FamilyMemberId == member.Id).ToList();
                var memberFunds = mutualFunds.Where(f => f.FamilyMemberId == member.Id).ToList();

                var memberOutflow = memberPolicies.Sum(p =>
                {
                    var projections = ProjectInstallments(p, fyStart, fyEnd);
                    return projections.Sum(pr => pr.amount);
                }) + memberFunds.Sum(f =>
                {
                    var projections = ProjectMutualFundInstallments(f, fyStart, fyEnd);
                    return projections.Sum(pr => pr.amount);
                });

                var memberMaturity = memberPolicies
                    .Where(p => p.MaturityDate.HasValue && p.MaturityDate.Value >= fyStart && p.MaturityDate.Value <= fyEnd)
                    .Sum(p => p.TotalMaturityAmount ?? p.CoverageAmount ?? 0) +
                    memberFunds
                    .Where(f => f.RedemptionDate.HasValue && f.RedemptionDate.Value >= fyStart && f.RedemptionDate.Value <= fyEnd)
                    .Sum(f => f.CurrentValuation ?? f.InvestedAmount);

                return new MemberForecastSummaryDto
                {
                    MemberId = member.Id,
                    MemberName = member.Name,
                    Relationship = member.Relationship,
                    PolicyCount = memberPolicies.Count,
                    MutualFundCount = memberFunds.Count,
                    YearlyOutflow = memberOutflow,
                    YearlyMaturity = memberMaturity
                };
            })
            .OrderByDescending(m => m.YearlyOutflow)
            .ToList();

        var totalOutflow = monthlyBreakdown.Sum(m => m.TotalOutflow);
        var totalMaturity = monthlyBreakdown.Sum(m => m.TotalMaturityIncome);

        var result = new InvestmentForecastDto
        {
            FiscalYear = fyYear,
            TotalYearlyOutflow = totalOutflow,
            TotalExpectedMaturity = totalMaturity,
            NetPosition = totalMaturity - totalOutflow,
            TotalPolicies = policies.Count,
            TotalMutualFunds = mutualFunds.Count,
            MonthlyBreakdown = monthlyBreakdown,
            MemberWiseSummary = allMembers
        };

        // Cache the result for 60 minutes
        await _cache.SetStringAsync(cacheKey, 
            System.Text.Json.JsonSerializer.Serialize(result),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(60) });

        return result;
    }

    /// <summary>
    /// Preview the forecast impact of a new policy before saving.
    /// </summary>
    public async Task<ForecastImpactDto> GetForecastImpactAsync(PolicyDto newPolicy, string[] selectedMembers)
    {
        // Get current FY forecast
        var currentForecast = await GetFullForecastAsync(null, selectedMembers);
        var currentYearly = currentForecast.TotalYearlyOutflow;
        var currentMonthlyAvg = currentYearly / 12;

        // Simulate the new policy installments in the current FY
        var fyYear = FYHelper.GetCurrentFYStartYear();
        var fyStart = new DateTime(fyYear, 4, 1);
        var fyEnd = new DateTime(fyYear + 1, 3, 31, 23, 59, 59);

        var simulatedPolicy = new Policy
        {
            StartDate = newPolicy.StartDate,
            EndDate = newPolicy.EndDate,
            NextInstallmentDate = newPolicy.NextInstallmentDate,
            InstallmentAmount = newPolicy.InstallmentAmount,
            PremiumAmount = newPolicy.PremiumAmount,
            InstallmentType = newPolicy.InstallmentType
        };

        var newInstallments = ProjectInstallments(simulatedPolicy, fyStart, fyEnd);
        var additionalYearly = newInstallments.Sum(i => i.amount);

        var newYearly = currentYearly + additionalYearly;
        var newMonthlyAvg = newYearly / 12;
        var change = newMonthlyAvg - currentMonthlyAvg;

        return new ForecastImpactDto
        {
            CurrentMonthlyAvg = currentMonthlyAvg,
            NewMonthlyAvg = newMonthlyAvg,
            MonthlyChange = change,
            CurrentYearlyTotal = currentYearly,
            NewYearlyTotal = newYearly,
            ImpactSummary = change > 0
                ? $"This policy adds ₹{additionalYearly:N0}/year (₹{change:N0}/month avg increase) to your forecast."
                : "No additional FY impact (policy dates fall outside current FY)."
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  CORE PROJECTION ALGORITHMS
    // ═══════════════════════════════════════════════════════════

    private static List<(DateTime dueDate, decimal amount)> ProjectMutualFundInstallments(
        MutualFund fund, DateTime fyStart, DateTime fyEnd)
    {
        var result = new List<(DateTime dueDate, decimal amount)>();

        // LumpSum is a one-time outlay at StartDate
        if (fund.InvestmentType.Equals("LumpSum", StringComparison.OrdinalIgnoreCase))
        {
            if (fund.StartDate >= fyStart && fund.StartDate <= fyEnd)
            {
                result.Add((fund.StartDate, fund.InvestedAmount));
            }
            return result;
        }

        // SIP operates as a monthly outlay
        var amount = fund.InvestedAmount;
        if (amount <= 0) return result;

        var baseDate = fund.NextSipDate ?? fund.StartDate;

        var current = baseDate;
        while (current > fyStart)
            current = current.AddMonths(-1);

        while (current < fyStart)
            current = current.AddMonths(1);

        var endDate = fund.RedemptionDate ?? fyEnd;
        while (current <= fyEnd)
        {
            if (current >= fund.StartDate && current <= endDate)
            {
                result.Add((current, amount));
            }
            current = current.AddMonths(1);
        }

        return result;
    }

    private static List<(DateTime dueDate, decimal amount)> ProjectInstallments(
        Policy policy, DateTime fyStart, DateTime fyEnd)
    {
        var result = new List<(DateTime dueDate, decimal amount)>();
        var amount = policy.InstallmentAmount ?? policy.PremiumAmount;
        var type = (policy.InstallmentType ?? "yearly").ToLower().Trim();

        if (amount <= 0) return result;

        // Use NextInstallmentDate as the anchor, fallback to StartDate
        var baseDate = policy.NextInstallmentDate ?? policy.StartDate;

        // Rewind the base date to find the first occurrence at or before fyStart
        var current = baseDate;
        while (current > fyStart)
            current = StepBack(current, type);

        // Advance to the first occurrence at or after fyStart
        while (current < fyStart)
            current = StepForward(current, type);

        // Generate all installments within the FY window, bounded by policy end date
        while (current <= fyEnd)
        {
            // Only include if the policy is active during this period
            if (current >= policy.StartDate && current <= policy.EndDate)
            {
                result.Add((current, amount));
            }
            current = StepForward(current, type);
        }

        return result;
    }

    private static DateTime StepForward(DateTime date, string type) => type switch
    {
        var t when t.Contains("monthly") => date.AddMonths(1),
        var t when t.Contains("quarterly") => date.AddMonths(3),
        var t when t.Contains("half") || t.Contains("semi") => date.AddMonths(6),
        _ => date.AddYears(1)  // yearly / annual / default
    };

    private static DateTime StepBack(DateTime date, string type) => type switch
    {
        var t when t.Contains("monthly") => date.AddMonths(-1),
        var t when t.Contains("quarterly") => date.AddMonths(-3),
        var t when t.Contains("half") || t.Contains("semi") => date.AddMonths(-6),
        _ => date.AddYears(-1)
    };
}
