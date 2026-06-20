using System;
using System.ComponentModel.DataAnnotations;

namespace PolicyManager.API.DTOs;

public class MutualFundDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Folio Number is required")]
    [StringLength(100)]
    public string FolioNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Fund House is required")]
    [StringLength(200)]
    public string FundHouse { get; set; } = string.Empty;

    [Required(ErrorMessage = "Scheme Name is required")]
    [StringLength(200)]
    public string SchemeName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Option { get; set; } = "Growth";

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = "Equity";

    [Required]
    [StringLength(50)]
    public string InvestmentType { get; set; } = "SIP";

    public decimal InvestedAmount { get; set; }

    public decimal? CurrentNav { get; set; }

    public decimal? TotalUnits { get; set; }

    public decimal? CurrentValuation { get; set; }

    [Required(ErrorMessage = "Start Date is required")]
    public DateTime StartDate { get; set; }

    public DateTime? RedemptionDate { get; set; }

    public DateTime? NextSipDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Active";

    [StringLength(200)]
    public string? NomineeName { get; set; }

    [StringLength(100)]
    public string? NomineeRelationship { get; set; }

    [StringLength(500)]
    public string? BankAccountDetails { get; set; }

    [StringLength(1000)]
    public string? SpecialRemarks { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int FamilyMemberId { get; set; }
    public string? FamilyMemberName { get; set; }
    public string? FamilyMemberRelationship { get; set; }

    public int? CreatedByUserId { get; set; }
    public string? CreatedByName { get; set; }
}

public class CreateMutualFundDto
{
    [Required(ErrorMessage = "Folio Number is required")]
    [StringLength(100)]
    public string FolioNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Fund House is required")]
    [StringLength(200)]
    public string FundHouse { get; set; } = string.Empty;

    [Required(ErrorMessage = "Scheme Name is required")]
    [StringLength(200)]
    public string SchemeName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Option { get; set; } = "Growth";

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = "Equity";

    [Required]
    [StringLength(50)]
    public string InvestmentType { get; set; } = "SIP";

    public decimal InvestedAmount { get; set; }

    public decimal? CurrentNav { get; set; }

    public decimal? TotalUnits { get; set; }

    public decimal? CurrentValuation { get; set; }

    [Required(ErrorMessage = "Start Date is required")]
    public DateTime StartDate { get; set; }

    public DateTime? RedemptionDate { get; set; }

    public DateTime? NextSipDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Active";

    [StringLength(200)]
    public string? NomineeName { get; set; }

    [StringLength(100)]
    public string? NomineeRelationship { get; set; }

    [StringLength(500)]
    public string? BankAccountDetails { get; set; }

    [StringLength(1000)]
    public string? SpecialRemarks { get; set; }

    public int FamilyMemberId { get; set; }
}

public class UpdateMutualFundDto
{
    [Required(ErrorMessage = "Folio Number is required")]
    [StringLength(100)]
    public string FolioNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Fund House is required")]
    [StringLength(200)]
    public string FundHouse { get; set; } = string.Empty;

    [Required(ErrorMessage = "Scheme Name is required")]
    [StringLength(200)]
    public string SchemeName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Option { get; set; } = "Growth";

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = "Equity";

    [Required]
    [StringLength(50)]
    public string InvestmentType { get; set; } = "SIP";

    public decimal InvestedAmount { get; set; }

    public decimal? CurrentNav { get; set; }

    public decimal? TotalUnits { get; set; }

    public decimal? CurrentValuation { get; set; }

    [Required(ErrorMessage = "Start Date is required")]
    public DateTime StartDate { get; set; }

    public DateTime? RedemptionDate { get; set; }

    public DateTime? NextSipDate { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "Active";

    [StringLength(200)]
    public string? NomineeName { get; set; }

    [StringLength(100)]
    public string? NomineeRelationship { get; set; }

    [StringLength(500)]
    public string? BankAccountDetails { get; set; }

    [StringLength(1000)]
    public string? SpecialRemarks { get; set; }

    public int FamilyMemberId { get; set; }
}

public class MutualFundFilterDto
{
    public int? FamilyMemberId { get; set; }
    public string? FundHouse { get; set; }
    public string? SchemeName { get; set; }
    public string? Category { get; set; }
    public string? InvestmentType { get; set; }
    public string? Status { get; set; }
    public string? SearchTerm { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SortBy { get; set; } = "CreatedAt";
    public string SortDirection { get; set; } = "desc";
}
