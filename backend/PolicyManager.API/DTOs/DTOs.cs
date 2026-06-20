using System.ComponentModel.DataAnnotations;

namespace PolicyManager.API.DTOs;

// ═══════════════════════════════════════════════════════════════
//  POLICY DTOs
// ═══════════════════════════════════════════════════════════════

public class PolicyDto
{
    public int Id { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string PolicyHolderName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public decimal? TotalPaidAmount { get; set; }
    public string? PhoneNumber { get; set; }
    public int PolicyTypeId { get; set; }
    public string PolicyTypeName { get; set; } = string.Empty;
    public decimal PremiumAmount { get; set; }
    public decimal CoverageAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? SchemeName { get; set; }
    public string? CompanyName { get; set; }
    public string? ProductName { get; set; }
    public string? LocationUnit { get; set; }
    public string? Duration { get; set; }
    public string? CoverageDescription { get; set; }
    public decimal? TaxAmount { get; set; }
    public string? GstApplicable { get; set; }
    public decimal? InstallmentAmount { get; set; }
    public decimal? NetPremium { get; set; }
    public string? BankAccountDetails { get; set; }
    public string? AgentName { get; set; }
    public string? AlternateContactNumber { get; set; }
    public string? SpecialRemarks { get; set; }
    public DateTime? MaturityDate { get; set; }
    public decimal? TotalMaturityAmount { get; set; }
    public string? AdditionalDetails { get; set; }
    public string? NomineeName { get; set; }
    public string? NomineeRelation { get; set; }
    public string? InstallmentType { get; set; }
    public DateTime? NextInstallmentDate { get; set; }

    public DateTime? AnnuityDate { get; set; }
    public decimal? AnnuityAmount { get; set; }
    public string? AutoDebit { get; set; }
    public string? TermYears { get; set; }
    public string? PayingTerm { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public int? FamilyMemberId { get; set; }
    public string? FamilyMemberName { get; set; }
    public int? AgeAtInception { get; set; }
    public List<PaymentDto> Payments { get; set; } = new();
    public List<PolicyDocumentDto> Documents { get; set; } = new();
}

public class PolicyDocumentDto
{
    public int Id { get; set; }
    public int PolicyId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UploadedByName { get; set; }
}

public class PaymentDto
{
    public int Id { get; set; }
    public int PolicyId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ProcessedByName { get; set; }
}

public class CreatePaymentDto
{
    [Required]
    public int PolicyId { get; set; }

    [Required, Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required, StringLength(50)]
    public string PaymentMethod { get; set; } = "Cash";

    [StringLength(100)]
    public string? TransactionId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

public class CreatePolicyDto
{
    [Required, StringLength(50)]
    public string PolicyNumber { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string PolicyHolderName { get; set; } = string.Empty;

    [Required, StringLength(1000)]
    public string Email { get; set; } = string.Empty;

    public decimal? TotalPaidAmount { get; set; }

    public string? PhoneNumber { get; set; }

    [Required]
    public int PolicyTypeId { get; set; }

    [Required, Range(0.01, double.MaxValue, ErrorMessage = "Premium must be greater than 0")]
    public decimal PremiumAmount { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Coverage must be 0 or greater")]
    public decimal? CoverageAmount { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(200)]
    public string? SchemeName { get; set; }

    [StringLength(200)]
    public string? CompanyName { get; set; }

    [StringLength(200)]
    public string? ProductName { get; set; }

    [StringLength(200)]
    public string? LocationUnit { get; set; }

    [StringLength(100)]
    public string? Duration { get; set; }

    [StringLength(1000)]
    public string? CoverageDescription { get; set; }

    public decimal? TaxAmount { get; set; }

    [StringLength(10)]
    public string? GstApplicable { get; set; }

    public decimal? InstallmentAmount { get; set; }

    public decimal? NetPremium { get; set; }

    [StringLength(500)]
    public string? BankAccountDetails { get; set; }

    [StringLength(200)]
    public string? AgentName { get; set; }

    [StringLength(50)]
    public string? AlternateContactNumber { get; set; }

    [StringLength(1000)]
    public string? SpecialRemarks { get; set; }

    public DateTime? MaturityDate { get; set; }

    public decimal? TotalMaturityAmount { get; set; }

    [StringLength(2000)]
    public string? AdditionalDetails { get; set; }

    public string? NomineeName { get; set; }
    public string? NomineeRelation { get; set; }
    public string? InstallmentType { get; set; }
    public DateTime? NextInstallmentDate { get; set; }

    public DateTime? AnnuityDate { get; set; }
    public decimal? AnnuityAmount { get; set; }
    public string? AutoDebit { get; set; }
    public string? TermYears { get; set; }
    public string? PayingTerm { get; set; }

    public int? FamilyMemberId { get; set; }
}

public class UpdatePolicyDto
{
    [Required, StringLength(50)]
    public string PolicyNumber { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string PolicyHolderName { get; set; } = string.Empty;

    [Required, StringLength(1000)]
    public string Email { get; set; } = string.Empty;

    public decimal? TotalPaidAmount { get; set; }

    public string? PhoneNumber { get; set; }

    [Required]
    public int PolicyTypeId { get; set; }

    [Required]
    public decimal PremiumAmount { get; set; }

    public decimal? CoverageAmount { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required, StringLength(20)]
    public string Status { get; set; } = "Active";

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(200)]
    public string? SchemeName { get; set; }

    [StringLength(200)]
    public string? CompanyName { get; set; }

    [StringLength(200)]
    public string? ProductName { get; set; }

    [StringLength(200)]
    public string? LocationUnit { get; set; }

    [StringLength(100)]
    public string? Duration { get; set; }

    [StringLength(1000)]
    public string? CoverageDescription { get; set; }

    public decimal? TaxAmount { get; set; }

    [StringLength(10)]
    public string? GstApplicable { get; set; }

    public decimal? InstallmentAmount { get; set; }

    public decimal? NetPremium { get; set; }

    [StringLength(500)]
    public string? BankAccountDetails { get; set; }

    [StringLength(200)]
    public string? AgentName { get; set; }

    [StringLength(50)]
    public string? AlternateContactNumber { get; set; }

    [StringLength(1000)]
    public string? SpecialRemarks { get; set; }

    public DateTime? MaturityDate { get; set; }

    public decimal? TotalMaturityAmount { get; set; }

    [StringLength(2000)]
    public string? AdditionalDetails { get; set; }

    public string? NomineeName { get; set; }
    public string? NomineeRelation { get; set; }
    public string? InstallmentType { get; set; }
    public DateTime? NextInstallmentDate { get; set; }
    public int? FamilyMemberId { get; set; }
}

// ═══════════════════════════════════════════════════════════════
//  AUTH DTOs
// ═══════════════════════════════════════════════════════════════

public class LoginDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}

public class RegisterDto
{
    [Required, StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD DTOs
// ═══════════════════════════════════════════════════════════════

public class DashboardDto
{
    public int TotalPolicies { get; set; }
    public int ActivePolicies { get; set; }
    public int ExpiredPolicies { get; set; }
    public int PendingPolicies { get; set; }
    public int CancelledPolicies { get; set; }
    public decimal TotalPremiumAmount { get; set; }
    public decimal TotalCoverageAmount { get; set; }
    public int TotalPendingInstallments { get; set; }
    public decimal TotalPendingAmount { get; set; }
    public List<PolicyTypeCountDto> PolicyTypeCounts { get; set; } = new();
    public List<MonthlyPolicyDto> MonthlyPolicies { get; set; } = new();
    public List<PolicyDto> RecentPolicies { get; set; } = new();
    public List<UpcomingInstallmentDto> UpcomingInstallments { get; set; } = new();
    public int OverdueCount { get; set; }
    public decimal OverdueAmount { get; set; }
}

public class PolicyTypeCountDto
{
    public string PolicyTypeName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalPremium { get; set; }
}

public class MonthlyPolicyDto
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DashboardStatsDto
{
    public decimal CurrentMonthBudget { get; set; }
    public decimal NextMonthBudget { get; set; }
    public decimal CurrentFYBudget { get; set; }
    public decimal CurrentFYIncome { get; set; }
    public decimal NextYearForecast { get; set; }
    public decimal OneTimeInvestmentTotal { get; set; }
    public int OneTimeInvestmentCount { get; set; }
    public decimal UpcomingPremiumAmount { get; set; }
    public int UpcomingPremiumCount { get; set; }
    public List<PolicyForecastDto> ForecastList { get; set; } = new();
    public List<MonthlyForecastDto> MonthlyForecasts { get; set; } = new();
    public string[] SelectedMembers { get; set; } = Array.Empty<string>();
}

public class MonthlyForecastDto
{
    public string Month { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
}

public class PolicyForecastDto
{
    public string PolicyName { get; set; } = string.Empty;
    public string PolicyNumber { get; set; } = string.Empty;
    public string MemberName { get; set; } = string.Empty;
    public int AgeAtInception { get; set; }
    public decimal InstallmentAmount { get; set; }
    public DateTime? NextInstallmentDate { get; set; }
    public string PolicyType { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? ProductName { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal PremiumAmount { get; set; }
    public decimal? CoverageAmount { get; set; }
    public string? AgentName { get; set; }
}

public class FamilyMemberDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string Relationship { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public string? ParentName { get; set; }
    public List<FamilyMemberDto> Children { get; set; } = new();

    // ── Policy Summary (aggregated at query time) ──
    public int PolicyCount { get; set; }
    public int ActivePolicyCount { get; set; }
    public decimal TotalPremium { get; set; }
    public decimal TotalCoverage { get; set; }
    public List<FamilyMemberPolicySummaryDto> Policies { get; set; } = new();
}

public class FamilyMemberPolicySummaryDto
{
    public int Id { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string PolicyTypeName { get; set; } = string.Empty;
    public decimal PremiumAmount { get; set; }
    public decimal? CoverageAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? NextInstallmentDate { get; set; }
    public string? InstallmentType { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? CompanyName { get; set; }
}

public class CreateFamilyMemberDto
{
    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DateOnly DateOfBirth { get; set; }

    [Required, StringLength(50)]
    public string Relationship { get; set; } = "Self";

    public int? ParentId { get; set; }
}

// ═══════════════════════════════════════════════════════════════
//  GENERIC API RESPONSE WRAPPER
// ═══════════════════════════════════════════════════════════════

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> FailResponse(string message, List<string>? errors = null)
        => new() { Success = false, Message = message, Errors = errors };
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}

public class PolicyFilterDto
{
    public string? SearchTerm { get; set; }
    public List<int>? PolicyTypeIds { get; set; }
    public List<string>? Statuses { get; set; }
    public string? CompanyName { get; set; }
    public DateTime? StartDateFrom { get; set; }
    public DateTime? StartDateTo { get; set; }
    // ── Advanced Filters ──
    public DateTime? EndDateFrom { get; set; }
    public DateTime? EndDateTo { get; set; }
    public List<string>? InstallmentTypes { get; set; }
    public DateTime? NextInstallmentFrom { get; set; }
    public DateTime? NextInstallmentTo { get; set; }
    public decimal? PremiumMin { get; set; }
    public decimal? PremiumMax { get; set; }
    public bool? HasOverdueInstallment { get; set; }
    public List<int>? FamilyMemberIds { get; set; }
    public string? CreatedByName { get; set; }
    public string SortBy { get; set; } = "CreatedAt";
    public string SortDirection { get; set; } = "desc";
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PolicyTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class AuditLogDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? UserName { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; }
}

public class ExcelUploadResultDto
{
    public int TotalRowsProcessed { get; set; }
    public int ImportedCount { get; set; }
    public int SkippedCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> ImportedPolicyNumbers { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

public class PolicyReminderSettingDto
{
    public int Id { get; set; }
    public int PolicyTypeId { get; set; }
    public string PolicyTypeName { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public int DaysBeforeDue { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateReminderSettingDto
{
    public bool IsEnabled { get; set; }
    public int DaysBeforeDue { get; set; }
}

// ═══════════════════════════════════════════════════════════════
//  UPCOMING INSTALLMENT DTO
// ═══════════════════════════════════════════════════════════════

public class UpcomingInstallmentDto
{
    public int PolicyId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string PolicyHolderName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string PolicyTypeName { get; set; } = string.Empty;
    public decimal PremiumAmount { get; set; }
    public decimal? CoverageAmount { get; set; }
    public string? InstallmentType { get; set; }
    public DateTime? NextInstallmentDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DaysUntilDue { get; set; }
    public bool IsOverdue { get; set; }
    public string Status { get; set; } = string.Empty;
    public string UrgencyLevel { get; set; } = string.Empty; // critical, warning, info
}

// ═══════════════════════════════════════════════════════════════
//  TEST EMAIL DTO
// ═══════════════════════════════════════════════════════════════

public class SendTestEmailDto
{
    public int PolicyId { get; set; }
    public string? RecipientEmail { get; set; }
}

// ═══════════════════════════════════════════════════════════════
//  POLICY REMINDER EVENT DTO
// ═══════════════════════════════════════════════════════════════

public class PolicyReminderEventDto
{
    public int Id { get; set; }
    public int PolicyId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public DateTime PolicyDueDate { get; set; }
    public int DaysBeforeDue { get; set; }
    public string Status { get; set; } = string.Empty; // Pending, Sent, Failed
    public DateTime? SentAt { get; set; }
    public int RetryCount { get; set; }
    public string? ErrorMessage { get; set; }
    public string? EmailSubject { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ManualReminderDto
{
    public int PolicyId { get; set; }
    public string TemplateType { get; set; } = "Standard"; // Standard, Critical, Installment
    public string? CustomNote { get; set; }
    public string? RecipientEmail { get; set; }
}

// ═══════════════════════════════════════════════════════════════
//  POLICY ANALYSIS DTO
// ═══════════════════════════════════════════════════════════════

public class PolicyAnalysisResultDto
{
    public bool IsBeneficial { get; set; }
    public string BeneficialFor { get; set; } = string.Empty; // Policy Holder, Company, Balanced
    public decimal TotalYield { get; set; }
    public decimal YieldPercentage { get; set; }
    public double DurationYears { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal NetBenefit { get; set; }
    public string AnalysisSummary { get; set; } = string.Empty;
    public decimal TotalInvestment { get; set; }
    public decimal TotalReturns { get; set; }
}

// ═══════════════════════════════════════════════════════════════
//  INVESTMENT FORECAST DTOs
// ═══════════════════════════════════════════════════════════════

public class InvestmentForecastDto
{
    public int FiscalYear { get; set; }                 // e.g. 2026 for FY 2026-27
    public decimal TotalYearlyOutflow { get; set; }
    public decimal TotalExpectedMaturity { get; set; }
    public decimal NetPosition { get; set; }            // Maturity - Outflow
    public int TotalPolicies { get; set; }
    public int TotalMutualFunds { get; set; }
    public List<MonthlyForecastDetailDto> MonthlyBreakdown { get; set; } = new();
    public List<MemberForecastSummaryDto> MemberWiseSummary { get; set; } = new();
}

public class MonthlyForecastDetailDto
{
    public string Month { get; set; } = string.Empty;   // "Apr 2026"
    public int MonthNumber { get; set; }                 // 4 for April
    public int Year { get; set; }
    public decimal TotalOutflow { get; set; }
    public decimal TotalMaturityIncome { get; set; }
    public List<PolicyInstallmentDetailDto> Installments { get; set; } = new();
}

public class PolicyInstallmentDetailDto
{
    public int PolicyId { get; set; }
    public int? MutualFundId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string MemberName { get; set; } = string.Empty;
    public string PolicyTypeName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? ProductName { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public string InstallmentType { get; set; } = string.Empty;
    public bool IsPaid { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class MemberForecastSummaryDto
{
    public int MemberId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public int PolicyCount { get; set; }
    public int MutualFundCount { get; set; }
    public decimal YearlyOutflow { get; set; }
    public decimal YearlyMaturity { get; set; }
}

/// <summary>
/// Lightweight DTO shown on the policy form when adding/editing a policy
/// to preview the forecast impact of the new installment schedule.
/// </summary>
public class ForecastImpactDto
{
    public decimal CurrentMonthlyAvg { get; set; }
    public decimal NewMonthlyAvg { get; set; }
    public decimal MonthlyChange { get; set; }
    public decimal CurrentYearlyTotal { get; set; }
    public decimal NewYearlyTotal { get; set; }
    public string ImpactSummary { get; set; } = string.Empty;
}

// ═══════════════════════════════════════════════════════════════
//  IN-APP NOTIFICATION DTOs
// ═══════════════════════════════════════════════════════════════

public class NotificationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;    // Installment, Expiry, Payment, System
    public int? PolicyId { get; set; }
    public string? PolicyNumber { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string TimeAgo { get; set; } = string.Empty;
}

public class NotificationSummaryDto
{
    public int UnreadCount { get; set; }
    public List<NotificationDto> Recent { get; set; } = new();
}

public class SyncPreviewDto
{
    public int PolicyId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public string PolicyHolderName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? CurrentNextInstallmentDate { get; set; }
    public DateTime? NewNextInstallmentDate { get; set; }
    public string InstallmentType { get; set; } = string.Empty;
}

