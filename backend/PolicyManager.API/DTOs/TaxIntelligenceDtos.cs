using System;
using System.Collections.Generic;

namespace PolicyManager.API.DTOs;

public class TaxIntelligenceDto
{
    public decimal Total80CDeduction { get; set; }
    public decimal Total80DDeduction { get; set; }
    public decimal Remaining80CLimit { get; set; }
    public decimal Remaining80DLimit { get; set; }
    public List<TaxSavingOpportunityDto> Opportunities { get; set; } = new();
    public List<TaxDeductionBreakdownDto> Deductions { get; set; } = new();
}

public class TaxDeductionBreakdownDto
{
    public string Section { get; set; } = string.Empty; // 80C, 80D
    public string Category { get; set; } = string.Empty; // Life Insurance, Health Insurance
    public string HolderName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
}

public class TaxSavingOpportunityDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public decimal PotentialSavings { get; set; }
}
