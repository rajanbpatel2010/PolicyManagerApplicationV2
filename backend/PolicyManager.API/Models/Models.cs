using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManager.API.Models;

/// <summary>
/// Represents an insurance policy.
/// </summary>
public class Policy
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(50)]
    public string PolicyNumber { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string PolicyHolderName { get; set; } = string.Empty;

    [Required, StringLength(1000)]
    public string Email { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? TotalPaidAmount { get; set; }

    [Phone, StringLength(20)]
    public string? PhoneNumber { get; set; }

    [Required]
    public int PolicyTypeId { get; set; }

    [ForeignKey(nameof(PolicyTypeId))]
    public PolicyType? PolicyType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PremiumAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CoverageAmount { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required, StringLength(50)]
    public string Status { get; set; } = "Active";

    [StringLength(200)]
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

    [Column(TypeName = "decimal(18,2)")]
    public decimal? TaxAmount { get; set; }

    [StringLength(10)]
    public string? GstApplicable { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? InstallmentAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
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

    [Column(TypeName = "decimal(18,2)")]
    public decimal? TotalMaturityAmount { get; set; }

    [StringLength(2000)]
    public string? AdditionalDetails { get; set; }

    [StringLength(500)]
    public string? NomineeName { get; set; }

    [StringLength(200)]
    public string? NomineeRelation { get; set; }

    public string? InstallmentType { get; set; } // Monthly, Quarterly, Yearly
    public DateTime? NextInstallmentDate { get; set; }

    public DateTime? AnnuityDate { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? AnnuityAmount { get; set; }

    [StringLength(50)]
    public string? AutoDebit { get; set; }

    [StringLength(100)]
    public string? TermYears { get; set; }

    [StringLength(100)]
    public string? PayingTerm { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public int? FamilyMemberId { get; set; }

    [ForeignKey(nameof(FamilyMemberId))]
    public FamilyMember? FamilyMember { get; set; }

    [NotMapped]
    public int AgeAtInception
    {
        get
        {
            if (FamilyMember == null) return 0;
            var age = StartDate.Year - FamilyMember.DateOfBirth.Year;
            if (DateOnly.FromDateTime(StartDate) < FamilyMember.DateOfBirth.AddYears(age)) age--;
            return age;
        }
    }

    public int? CreatedByUserId { get; set; }

    [ForeignKey(nameof(CreatedByUserId))]
    public User? CreatedBy { get; set; }

    public bool IsDeleted { get; set; } = false;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<PolicyDocument> Documents { get; set; } = new List<PolicyDocument>();
}

/// <summary>
/// Represents a document (PDF, Image, etc.) linked to a policy.
/// </summary>
public class PolicyDocument
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PolicyId { get; set; }

    [ForeignKey(nameof(PolicyId))]
    public Policy? Policy { get; set; }

    [Required, StringLength(50)]
    public string DocumentType { get; set; } = "Policy"; // Policy, Receipt

    [Required, StringLength(200)]
    public string FileName { get; set; } = string.Empty;

    [Required, StringLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [Required, StringLength(10)]
    public string FileExtension { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? UploadedByUserId { get; set; }

    [ForeignKey(nameof(UploadedByUserId))]
    public User? UploadedBy { get; set; }
}

/// <summary>
/// Represents a payment record for a policy installment.
/// </summary>
public class Payment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PolicyId { get; set; }

    [ForeignKey(nameof(PolicyId))]
    public Policy? Policy { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required, StringLength(50)]
    public string PaymentMethod { get; set; } = "Cash"; // Online, Cheque, Cash

    [StringLength(100)]
    public string? TransactionId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? ProcessedByUserId { get; set; }

    [ForeignKey(nameof(ProcessedByUserId))]
    public User? ProcessedBy { get; set; }
}

/// <summary>
/// Lookup table for policy types (Life, Health, Auto, Property, etc.)
/// </summary>
public class PolicyType
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Policy> Policies { get; set; } = new List<Policy>();
}

/// <summary>
/// Application user with authentication details.
/// </summary>
public class User
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, StringLength(1000)]
    public string Email { get; set; } = string.Empty;


    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, StringLength(20)]
    public string Role { get; set; } = "User"; // Admin, User

    [Phone, StringLength(20)]
    public string? PhoneNumber { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<Policy> Policies { get; set; } = new List<Policy>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}

/// <summary>
/// Tracks all significant actions for compliance and debugging.
/// </summary>
public class AuditLog
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string EntityName { get; set; } = string.Empty;

    public int? EntityId { get; set; }

    [StringLength(2000)]
    public string? OldValues { get; set; }

    [StringLength(2000)]
    public string? NewValues { get; set; }

    public int? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [StringLength(50)]
    public string? IpAddress { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Configuration for policy-specific reminders.
/// </summary>
public class PolicyReminderSetting
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PolicyTypeId { get; set; }

    [ForeignKey(nameof(PolicyTypeId))]
    public PolicyType? PolicyType { get; set; }

    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Days before policy end date to trigger a reminder.
    /// </summary>
    public int DaysBeforeDue { get; set; } = 30;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Tracks all incoming login requests.
/// </summary>
public class RequestLoginHistory
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(1000)]
    public string Email { get; set; } = string.Empty;

    public DateTime LoginTime { get; set; } = DateTime.UtcNow;

    [StringLength(50)]
    public string? IpAddress { get; set; }

    public bool IsSuccess { get; set; }
    
    [StringLength(500)]
    public string? FailureReason { get; set; }
}
