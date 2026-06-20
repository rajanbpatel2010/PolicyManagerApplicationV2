using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManager.API.Models;

/// <summary>
/// Represents a scheduled email reminder event for an upcoming policy due date.
/// Created by the background scheduler and processed by the email service.
/// </summary>
public class PolicyReminderEvent
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// The policy this reminder is for.
    /// </summary>
    [Required]
    public int PolicyId { get; set; }

    [ForeignKey(nameof(PolicyId))]
    public Policy? Policy { get; set; }

    /// <summary>
    /// The recipient email address (copied from policy at creation time).
    /// </summary>
    [Required, StringLength(1000)]
    public string RecipientEmail { get; set; } = string.Empty;

    /// <summary>
    /// The recipient name (copied from policy at creation time).
    /// </summary>
    [Required, StringLength(200)]
    public string RecipientName { get; set; } = string.Empty;

    /// <summary>
    /// The policy number (copied for quick reference).
    /// </summary>
    [Required, StringLength(50)]
    public string PolicyNumber { get; set; } = string.Empty;

    /// <summary>
    /// The policy due/end date that triggered this reminder.
    /// </summary>
    [Required]
    public DateTime PolicyDueDate { get; set; }

    /// <summary>
    /// How many days before the due date this reminder was scheduled for.
    /// </summary>
    public int DaysBeforeDue { get; set; }

    /// <summary>
    /// When this reminder event was created by the scheduler.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the email was actually sent (null if not yet sent).
    /// </summary>
    public DateTime? SentAt { get; set; }

    /// <summary>
    /// Current status: Pending, Sent, Failed, Cancelled.
    /// </summary>
    [Required, StringLength(20)]
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// Number of send attempts made.
    /// </summary>
    public int RetryCount { get; set; } = 0;

    /// <summary>
    /// Error message if the last send attempt failed.
    /// </summary>
    [StringLength(2000)]
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Optional personal note to include in the email.
    /// </summary>
    [StringLength(1000)]
    public string? CustomNote { get; set; }

    /// <summary>
    /// Email subject line used.
    /// </summary>
    [StringLength(500)]
    public string? EmailSubject { get; set; }
}
