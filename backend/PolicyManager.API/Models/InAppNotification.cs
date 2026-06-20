using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManager.API.Models;

/// <summary>
/// In-app notification for upcoming installments, expiry alerts, and system events.
/// </summary>
public class InAppNotification
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Target user. NULL = broadcast to all users.
    /// </summary>
    public int? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required, StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Notification type: Installment, Expiry, Payment, System
    /// </summary>
    [Required, StringLength(50)]
    public string Type { get; set; } = "Installment";

    /// <summary>
    /// Related policy (nullable for system-level notifications).
    /// </summary>
    public int? PolicyId { get; set; }

    [ForeignKey(nameof(PolicyId))]
    public Policy? Policy { get; set; }

    public bool IsRead { get; set; } = false;

    public bool IsDismissed { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReadAt { get; set; }
}
