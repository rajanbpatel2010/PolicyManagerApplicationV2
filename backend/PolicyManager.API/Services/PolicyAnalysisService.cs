using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

public class PolicyAnalysisService : IPolicyAnalysisService
{
    public PolicyAnalysisResultDto CalculateBenefit(Policy policy)
    {
        return PerformCalculation(
            policy.StartDate,
            policy.EndDate,
            policy.MaturityDate,
            policy.PremiumAmount,
            policy.InstallmentAmount,
            policy.InstallmentType,
            policy.TotalPaidAmount,
            policy.TotalMaturityAmount,
            policy.CoverageAmount,
            policy.PolicyType?.Name
        );
    }

    public PolicyAnalysisResultDto CalculateBenefit(PolicyDto dto)
    {
        return PerformCalculation(
            dto.StartDate,
            dto.EndDate,
            dto.MaturityDate,
            dto.PremiumAmount,
            dto.InstallmentAmount,
            dto.InstallmentType,
            dto.TotalPaidAmount,
            dto.TotalMaturityAmount,
            dto.CoverageAmount,
            dto.PolicyTypeName
        );
    }

    private PolicyAnalysisResultDto PerformCalculation(
        DateTime startDate,
        DateTime endDate,
        DateTime? maturityDate,
        decimal premiumAmount,
        decimal? installmentAmount,
        string? installmentType,
        decimal? totalPaidAmount,
        decimal? totalMaturityAmount,
        decimal? coverageAmount,
        string? policyType)
    {
        var result = new PolicyAnalysisResultDto();

        // 1. Calculate Duration
        var targetEndDate = maturityDate ?? endDate;
        var durationSpan = targetEndDate - startDate;
        result.DurationYears = Math.Round(durationSpan.TotalDays / 365.25, 2);

        // 2. Calculate Total Investment (Estimate if totalPaidAmount is null)
        decimal totalInvestment = totalPaidAmount ?? 0;
        if (!totalPaidAmount.HasValue || totalPaidAmount == 0)
        {
            // Estimate based on installments
            int multiplier = (installmentType?.ToLower()) switch
            {
                "monthly" => 12,
                "quarterly" => 4,
                "half-yearly" => 2,
                "yearly" => 1,
                _ => 1
            };

            var years = (decimal)result.DurationYears;
            var installments = Math.Ceiling(years * multiplier);
            totalInvestment = (installmentAmount ?? premiumAmount) * installments;
        }
        result.TotalInvestment = totalInvestment;

        // 3. Calculate Total Returns
        result.TotalReturns = totalMaturityAmount ?? coverageAmount ?? 0;

        // 4. Calculate Yield and Net Benefit
        result.TotalYield = result.TotalReturns - result.TotalInvestment;
        result.NetBenefit = result.TotalYield;
        
        if (result.TotalInvestment > 0)
        {
            result.YieldPercentage = Math.Round((result.TotalYield / result.TotalInvestment) * 100, 2);
        }

        // 5. Determine if Beneficial and for Who
        result.IsBeneficial = result.TotalYield > 0;
        if (result.TotalYield > 100) // Small threshold to avoid floating point '0'
        {
            result.BeneficialFor = "Policy Holder";
        }
        else if (result.TotalYield < -100)
        {
            result.BeneficialFor = "Company";
        }
        else
        {
            result.BeneficialFor = "Balanced";
        }

        // 6. Taxable Amount Prediction (Standard Assumption: Section 10(10D) logic for Insurance)
        // Rule: If annual premium exceeds 10% of sum assured (CoverageAmount), maturity is taxable.
        bool isTaxExempt = false;
        if (coverageAmount.HasValue && coverageAmount.Value > 0)
        {
            decimal annualPremium = installmentType?.ToLower() switch
            {
                "monthly" => premiumAmount * 12,
                "quarterly" => premiumAmount * 4,
                "half-yearly" => premiumAmount * 2,
                "yearly" => premiumAmount,
                _ => premiumAmount
            };

            if (annualPremium <= coverageAmount.Value * 0.1m)
            {
                isTaxExempt = true;
            }
        }

        if (result.TotalYield > 0)
        {
            result.TaxableAmount = isTaxExempt ? 0 : result.TotalYield;
        }
        else
        {
            result.TaxableAmount = 0;
        }

        // 7. Analysis Summary
        string status = result.IsBeneficial ? "profitable" : "not profitable";
        string taxStatus = result.TaxableAmount == 0 ? "Tax-Exempt" : "Taxable";
        
        decimal annualYield = 0;
        if (result.TotalInvestment > 0 && result.DurationYears > 0)
        {
            // Simple Annualized Return
            annualYield = Math.Round(result.TotalYield / (decimal)result.DurationYears / result.TotalInvestment * 100, 2);
        }

        result.AnalysisSummary = $"{policyType ?? "Policy"} is {status} for the {result.BeneficialFor}. " +
                                $"Total yield is {result.TotalYield:C} over {result.DurationYears} years. " +
                                $"Estimated Annual Yield: {annualYield}%. Status: {taxStatus}.";

        return result;
    }
}
