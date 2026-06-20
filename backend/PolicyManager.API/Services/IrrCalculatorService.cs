using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

public class IrrCalculatorService : IIrrCalculatorService
{
    private readonly AppDbContext _context;
    private const double Precision = 1e-6;
    private const int MaxIterations = 100;

    public IrrCalculatorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IrrAnalysisDto> GetPolicyIrrAsync(int policyId)
    {
        var policy = await _context.Policies
            .Include(p => p.Payments)
            .FirstOrDefaultAsync(p => p.Id == policyId)
            ?? throw new KeyNotFoundException("Policy not found.");

        var result = new IrrAnalysisDto
        {
            PolicyId = policy.Id,
            PolicyNumber = policy.PolicyNumber,
            CashFlows = new List<CashFlowDto>()
        };

        // 1. Gather historical payments (Negative Cash Flows)
        foreach (var payment in policy.Payments)
        {
            result.CashFlows.Add(new CashFlowDto 
            { 
                Date = payment.PaymentDate, 
                Amount = -payment.Amount, 
                Description = "Payment" 
            });
            result.TotalInvested += payment.Amount;
        }

        // 2. Add future projected payments if active
        // (For simplicity, we'll assume the policy is evaluated as of today's maturity/coverage)
        
        // 3. Add Maturity / Current Value (Positive Cash Flow)
        var returnAmount = policy.TotalMaturityAmount ?? policy.CoverageAmount ?? 0;
        var returnDate = policy.MaturityDate ?? policy.EndDate;
        
        result.CashFlows.Add(new CashFlowDto 
        { 
            Date = returnDate, 
            Amount = returnAmount, 
            Description = "Expected Maturity" 
        });
        result.TotalExpectedReturn = returnAmount;

        // 4. Calculate XIRR
        try
        {
            double xirr = CalculateXirr(result.CashFlows);
            result.IrrPercentage = (decimal)Math.Round(xirr * 100, 2);
        }
        catch
        {
            result.IrrPercentage = 0;
        }

        // 5. Generate Recommendation
        result.Recommendation = result.IrrPercentage switch
        {
            > 12 => "Excellent (Outperforms most indices)",
            > 8 => "Good (Stable wealth creator)",
            > 6 => "Average (Matches inflation)",
            _ => "Below Average (Consider alternatives)"
        };

        return result;
    }

    public async Task<List<IrrAnalysisDto>> GetPortfolioIrrSummaryAsync(int userId)
    {
        var policies = await _context.Policies
            .Where(p => p.CreatedByUserId == userId && !p.IsDeleted)
            .Select(p => p.Id)
            .ToListAsync();

        var summary = new List<IrrAnalysisDto>();
        foreach (var id in policies)
        {
            try { summary.Add(await GetPolicyIrrAsync(id)); } catch { }
        }
        return summary;
    }

    private double CalculateXirr(List<CashFlowDto> cashFlows)
    {
        if (cashFlows.Count < 2) return 0;
        
        // Newton-Raphson
        double rate = 0.1; // Initial guess 10%
        for (int i = 0; i < MaxIterations; i++)
        {
            double f = 0;
            double df = 0;
            DateTime d0 = cashFlows[0].Date;

            foreach (var cf in cashFlows)
            {
                double t = (cf.Date - d0).TotalDays / 365.0;
                double denominator = Math.Pow(1 + rate, t);
                f += (double)cf.Amount / denominator;
                df += -t * (double)cf.Amount / (denominator * (1 + rate));
            }

            if (Math.Abs(f) < Precision) return rate;
            if (Math.Abs(df) < 1e-10) break; // Avoid division by zero

            double nextRate = rate - f / df;
            if (Math.Abs(nextRate - rate) < Precision) return nextRate;
            rate = nextRate;
        }

        return rate;
    }
}
