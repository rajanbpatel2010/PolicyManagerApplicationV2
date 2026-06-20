using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManager.API.Models;

/// <summary>
/// Represents a member of the family (Self, Spouse, Child, etc.)
/// </summary>
public class FamilyMember
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DateOnly DateOfBirth { get; set; }

    [Required, StringLength(50)]
    public string Relationship { get; set; } = "Self"; // Self, Spouse, Child, Parent

    public int? ParentId { get; set; }

    [ForeignKey(nameof(ParentId))]
    public FamilyMember? Parent { get; set; }

    public ICollection<FamilyMember> Children { get; set; } = new List<FamilyMember>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Policy> Policies { get; set; } = new List<Policy>();
}
