using System;

namespace PolicyManager.API.DTOs;

public class IrrAnalysisDto
{
    public int PolicyId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public decimal IrrPercentage { get; set; }
    public decimal TotalInvested { get; set; }
    public decimal TotalExpectedReturn { get; set; }
    public string Recommendation { get; set; } = string.Empty; // e.g. "Excellent", "Average", "Below Inflation"
    public List<CashFlowDto> CashFlows { get; set; } = new();
}

public class CashFlowDto
{
    public DateTime Date { get; set; }
    public decimal Amount { get; set; } // Negative for investment, positive for returns
    public string Description { get; set; } = string.Empty;
}
