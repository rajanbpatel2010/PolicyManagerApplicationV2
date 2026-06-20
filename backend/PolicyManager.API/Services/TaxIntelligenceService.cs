using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

public class TaxIntelligenceService : ITaxIntelligenceService
{
    private readonly AppDbContext _context;
    private const decimal Max80CLimit = 150000m;
    private const decimal Standard80DLimit = 25000m;
    private const decimal SeniorCitizen80DLimit = 50000m;

    public TaxIntelligenceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<TaxIntelligenceDto>> GetTaxPlanningAsync(int userId)
    {
        var result = new TaxIntelligenceDto();

        // Get all active policies for the user with their family members and types
        var policies = await _context.Policies
            .Include(p => p.PolicyType)
            .Include(p => p.FamilyMember)
            .Where(p => p.CreatedByUserId == userId && p.Status == "Active" && !p.IsDeleted)
            .ToListAsync();

        var today = DateTime.Today;
        
        // Categorize deductions
        foreach (var policy in policies)
        {
            var typeName = policy.PolicyType?.Name.ToLower() ?? "";
            
            if (typeName.Contains("life") || typeName.Contains("term") || typeName.Contains("lic"))
            {
                result.Total80CDeduction += policy.PremiumAmount;
                result.Deductions.Add(new TaxDeductionBreakdownDto
                {
                    Section = "80C",
                    Category = "Life Insurance",
                    HolderName = policy.FamilyMember?.Name ?? policy.PolicyHolderName,
                    Amount = policy.PremiumAmount,
                    PolicyNumber = policy.PolicyNumber
                });
            }
            else if (typeName.Contains("health") || typeName.Contains("medical") || typeName.Contains("mediclaim"))
            {
                result.Total80DDeduction += policy.PremiumAmount;
                result.Deductions.Add(new TaxDeductionBreakdownDto
                {
                    Section = "80D",
                    Category = "Health Insurance",
                    HolderName = policy.FamilyMember?.Name ?? policy.PolicyHolderName,
                    Amount = policy.PremiumAmount,
                    PolicyNumber = policy.PolicyNumber
                });
            }
        }

        // Cap 80C at 1.5L
        var actual80CDeduction = Math.Min(result.Total80CDeduction, Max80CLimit);
        result.Remaining80CLimit = Math.Max(0, Max80CLimit - result.Total80CDeduction);

        // Calculate 80D limits based on family structure
        // Simplified logic: Check if any family member is a senior citizen (60+)
        var hasSeniorCitizenSelfFamily = policies
            .Where(p => p.PolicyType?.Name.ToLower().Contains("health") == true && p.FamilyMember != null)
            .Any(p => p.FamilyMember!.Relationship != "Parent" && CalculateAge(p.FamilyMember!.DateOfBirth) >= 60);

        var hasSeniorCitizenParents = policies
            .Where(p => p.PolicyType?.Name.ToLower().Contains("health") == true && p.FamilyMember != null)
            .Any(p => p.FamilyMember!.Relationship == "Parent" && CalculateAge(p.FamilyMember!.DateOfBirth) >= 60);

        decimal limitSelfFamily = hasSeniorCitizenSelfFamily ? SeniorCitizen80DLimit : Standard80DLimit;
        decimal limitParents = hasSeniorCitizenParents ? SeniorCitizen80DLimit : Standard80DLimit;
        decimal total80DLimit = limitSelfFamily + limitParents;

        result.Remaining80DLimit = Math.Max(0, total80DLimit - result.Total80DDeduction);

        // Generate Opportunities
        if (result.Remaining80CLimit > 10000)
        {
            result.Opportunities.Add(new TaxSavingOpportunityDto
            {
                Title = "Maximize 80C Benefits",
                Description = $"You have ₹{result.Remaining80CLimit:N0} remaining in your 80C limit. Consider Life Insurance or ELSS to save up to ₹{(result.Remaining80CLimit * 0.3m):N0} in taxes.",
                Section = "80C",
                PotentialSavings = result.Remaining80CLimit * 0.3m // Assuming 30% slab for "Potential"
            });
        }

        if (result.Remaining80DLimit > 5000)
        {
            result.Opportunities.Add(new TaxSavingOpportunityDto
            {
                Title = "Health Cover Gap",
                Description = $"You can claim an additional ₹{result.Remaining80DLimit:N0} under section 80D. Consider a top-up health plan for your parents or family.",
                Section = "80D",
                PotentialSavings = result.Remaining80DLimit * 0.3m
            });
        }

        return ApiResponse<TaxIntelligenceDto>.SuccessResponse(result);
    }

    private int CalculateAge(DateOnly dob)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var age = today.Year - dob.Year;
        if (today < dob.AddYears(age)) age--;
        return age;
    }
}
