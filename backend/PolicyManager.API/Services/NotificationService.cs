using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

// ═══════════════════════════════════════════════════════════════
//  IN-APP NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════

public interface INotificationService
{
    Task<NotificationSummaryDto> GetSummaryAsync(int? userId);
    Task MarkAsReadAsync(int id);
    Task MarkAllReadAsync(int? userId);
    Task DismissAsync(int id);
    Task CreateInstallmentNotificationsAsync();
    Task CreateNotificationAsync(string title, string message, string type, int? policyId = null, int? userId = null);
    Task CleanupOldNotificationsAsync(int retentionDays = 30);
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<NotificationSummaryDto> GetSummaryAsync(int? userId)
    {
        var query = _context.InAppNotifications
            .Where(n => !n.IsDismissed)
            .Where(n => n.UserId == null || n.UserId == userId);

        var unreadCount = await query.CountAsync(n => !n.IsRead);

        var recent = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(15)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                PolicyId = n.PolicyId,
                PolicyNumber = n.Policy != null ? n.Policy.PolicyNumber : null,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                TimeAgo = "" // Computed client-side
            })
            .ToListAsync();

        // Compute TimeAgo server-side as well for convenience
        foreach (var n in recent)
        {
            var diff = DateTime.UtcNow - n.CreatedAt;
            n.TimeAgo = diff.TotalMinutes < 1 ? "Just now" :
                         diff.TotalMinutes < 60 ? $"{(int)diff.TotalMinutes}m ago" :
                         diff.TotalHours < 24 ? $"{(int)diff.TotalHours}h ago" :
                         diff.TotalDays < 7 ? $"{(int)diff.TotalDays}d ago" :
                         n.CreatedAt.ToString("dd MMM");
        }

        return new NotificationSummaryDto
        {
            UnreadCount = unreadCount,
            Recent = recent
        };
    }

    public async Task MarkAsReadAsync(int id)
    {
        var notif = await _context.InAppNotifications.FindAsync(id);
        if (notif != null)
        {
            notif.IsRead = true;
            notif.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(int? userId)
    {
        var unread = await _context.InAppNotifications
            .Where(n => !n.IsRead && !n.IsDismissed)
            .Where(n => n.UserId == null || n.UserId == userId)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
    }

    public async Task DismissAsync(int id)
    {
        var notif = await _context.InAppNotifications.FindAsync(id);
        if (notif != null)
        {
            notif.IsDismissed = true;
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Called by the scheduler to create in-app notifications for upcoming installments/expiry.
    /// Uses the same PolicyReminderSettings config for lead days.
    /// </summary>
    public async Task CreateInstallmentNotificationsAsync()
    {
        var today = DateTime.UtcNow.Date;

        var activeSettings = await _context.PolicyReminderSettings
            .Where(s => s.IsEnabled)
            .ToListAsync();

        var count = 0;

        foreach (var setting in activeSettings)
        {
            var targetDate = today.AddDays(setting.DaysBeforeDue);

            // 1. Installment notifications
            var instPolicies = await _context.Policies
                .Include(p => p.FamilyMember)
                .Include(p => p.PolicyType)
                .Where(p => p.PolicyTypeId == setting.PolicyTypeId
                    && p.Status == "Active" && !p.IsDeleted
                    && p.NextInstallmentDate != null
                    && p.NextInstallmentDate.Value.Date == targetDate.Date)
                .ToListAsync();

            foreach (var p in instPolicies)
            {
                var dupKey = $"Installment|{p.Id}|{p.NextInstallmentDate:yyyyMMdd}|{setting.DaysBeforeDue}";
                var exists = await _context.InAppNotifications
                    .AnyAsync(n => n.PolicyId == p.Id && n.Type == "Installment"
                        && n.Title.Contains($"{setting.DaysBeforeDue} day"));
                if (exists) continue;

                var amount = p.InstallmentAmount ?? p.PremiumAmount;
                _context.InAppNotifications.Add(new InAppNotification
                {
                    Title = $"💳 {p.PolicyNumber} installment due in {setting.DaysBeforeDue} day(s)",
                    Message = $"{p.FamilyMember?.Name ?? p.PolicyHolderName} · {p.PolicyType?.Name} · ₹{amount:N0} · Due {p.NextInstallmentDate:dd MMM yyyy}",
                    Type = "Installment",
                    PolicyId = p.Id
                });
                count++;
            }

            // 2. Expiry notifications
            var expPolicies = await _context.Policies
                .Include(p => p.FamilyMember)
                .Include(p => p.PolicyType)
                .Where(p => p.PolicyTypeId == setting.PolicyTypeId
                    && p.Status == "Active" && !p.IsDeleted
                    && p.EndDate.Date == targetDate.Date)
                .ToListAsync();

            foreach (var p in expPolicies)
            {
                var exists = await _context.InAppNotifications
                    .AnyAsync(n => n.PolicyId == p.Id && n.Type == "Expiry"
                        && n.Title.Contains($"{setting.DaysBeforeDue} day"));
                if (exists) continue;

                _context.InAppNotifications.Add(new InAppNotification
                {
                    Title = $"⚠️ {p.PolicyNumber} expires in {setting.DaysBeforeDue} day(s)",
                    Message = $"{p.FamilyMember?.Name ?? p.PolicyHolderName} · {p.PolicyType?.Name} · Expiry {p.EndDate:dd MMM yyyy}",
                    Type = "Expiry",
                    PolicyId = p.Id
                });
                count++;
            }
        }

        if (count > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created {Count} in-app notifications for upcoming installments/expiry.", count);
        }
    }

    /// <summary>
    /// Create a one-off notification (for payment recorded, import complete, etc.)
    /// </summary>
    public async Task CreateNotificationAsync(string title, string message, string type, int? policyId = null, int? userId = null)
    {
        _context.InAppNotifications.Add(new InAppNotification
        {
            Title = title,
            Message = message,
            Type = type,
            PolicyId = policyId,
            UserId = userId
        });
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Cleanup notifications older than retention period.
    /// </summary>
    public async Task CleanupOldNotificationsAsync(int retentionDays = 30)
    {
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);
        var old = await _context.InAppNotifications
            .Where(n => n.CreatedAt < cutoff)
            .ToListAsync();

        if (old.Any())
        {
            _context.InAppNotifications.RemoveRange(old);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Cleaned up {Count} notifications older than {Days} days.", old.Count, retentionDays);
        }
    }
}
