using System;
using System.Collections.Generic;

namespace PolicyManager.API.DTOs;

public class ExtractedFieldDto<T>
{
    public T Value { get; set; } = default!;
    public float Confidence { get; set; } // 0.0 to 1.0
}

public class PolicyExtractionResultDto
{
    public ExtractedFieldDto<string> PolicyNumber { get; set; } = new();
    public ExtractedFieldDto<string> PolicyHolderName { get; set; } = new();
    public ExtractedFieldDto<string> CompanyName { get; set; } = new();
    public ExtractedFieldDto<string> PolicyTypeName { get; set; } = new();
    public ExtractedFieldDto<decimal> PremiumAmount { get; set; } = new();
    public ExtractedFieldDto<DateTime> StartDate { get; set; } = new();
    public ExtractedFieldDto<DateTime> EndDate { get; set; } = new();
    public ExtractedFieldDto<string> InstallmentType { get; set; } = new();
    public ExtractedFieldDto<decimal?> CoverageAmount { get; set; } = new();
    
    public string RawJson { get; set; } = string.Empty;
    public float OverallConfidence { get; set; }
}
