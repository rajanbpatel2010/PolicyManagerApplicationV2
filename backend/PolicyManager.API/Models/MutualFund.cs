using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManager.API.Models;

/// <summary>
/// Represents a Mutual Fund investment portfolio record.
/// </summary>
public class MutualFund
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(100)]
    public string FolioNumber { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string FundHouse { get; set; } = string.Empty; // AMC Name (e.g. HDFC Mutual Fund)

    [Required, StringLength(200)]
    public string SchemeName { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Option { get; set; } = "Growth"; // Growth, IDCW (Dividend)

    [Required, StringLength(50)]
    public string Category { get; set; } = "Equity"; // Equity, Debt, Hybrid, ELSS, Gold, etc.

    [Required, StringLength(50)]
    public string InvestmentType { get; set; } = "SIP"; // SIP or LumpSum

    [Column(TypeName = "decimal(18,4)")]
    public decimal InvestedAmount { get; set; } // Monthly SIP amount or Lump Sum principal

    [Column(TypeName = "decimal(18,4)")]
    public decimal? CurrentNav { get; set; } // Net Asset Value

    [Column(TypeName = "decimal(18,4)")]
    public decimal? TotalUnits { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CurrentValuation { get; set; } // (TotalUnits * CurrentNav) or custom input

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? RedemptionDate { get; set; } // End / Redeem date if target achieved

    public DateTime? NextSipDate { get; set; } // Due date of next systematic installment

    [Required, StringLength(50)]
    public string Status { get; set; } = "Active"; // Active, Redeemed, Paused

    [StringLength(200)]
    public string? NomineeName { get; set; }

    [StringLength(100)]
    public string? NomineeRelationship { get; set; }

    [StringLength(500)]
    public string? BankAccountDetails { get; set; }

    [StringLength(1000)]
    public string? SpecialRemarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Relationship with FamilyMember
    public int FamilyMemberId { get; set; }

    [ForeignKey(nameof(FamilyMemberId))]
    public FamilyMember? FamilyMember { get; set; }

    // Audit Info
    public int? CreatedByUserId { get; set; }

    [ForeignKey(nameof(CreatedByUserId))]
    public User? CreatedByUser { get; set; }
}
