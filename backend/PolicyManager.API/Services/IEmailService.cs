using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

// ═══════════════════════════════════════════════════════════════
//  EMAIL SERVICE – Sends SMTP emails for policy reminders
// ═══════════════════════════════════════════════════════════════

public interface IEmailService
{
    /// <summary>
    /// Sends a policy due-date reminder email and returns true on success.
    /// </summary>
    Task<bool> SendPolicyReminderEmailAsync(PolicyReminderEvent reminder);
    Task<bool> SendOmnichannelNotificationAsync(PolicyReminderEvent reminder, NotificationChannel channel);
}
