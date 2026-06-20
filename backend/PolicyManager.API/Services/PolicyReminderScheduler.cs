using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PolicyManager.API.Data;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

// ═══════════════════════════════════════════════════════════════
//  POLICY REMINDER SCHEDULER (Background Service)
//  
//  Runs periodically to:
//  1. Scan active policies whose EndDate falls within the
//     configured reminder windows (e.g. 30, 15, 7, 1 days).
//  2. Create PolicyReminderEvent records (if not already created).
//  3. Attempt to send pending reminder emails.
//  4. Retry previously failed emails (up to max retries).
// ═══════════════════════════════════════════════════════════════

public class PolicyReminderScheduler : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly EmailReminderSettings _settings;
    private readonly ILogger<PolicyReminderScheduler> _logger;

    public PolicyReminderScheduler(
        IServiceProvider serviceProvider,
        EmailReminderSettings settings,
        ILogger<PolicyReminderScheduler> logger)
    {
        _serviceProvider = serviceProvider;
        _settings = settings;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("Policy reminder scheduler is DISABLED via configuration.");
            return;
        }

        _logger.LogInformation(
            "Policy reminder scheduler started. Interval: {Hours}h | Reminder days: [{Days}]",
            _settings.SchedulerIntervalHours,
            string.Join(", ", _settings.ReminderDaysBeforeDue));

        // Small initial delay to let the application fully start
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("Reminder scheduler cycle started at {Time}", DateTime.UtcNow);

                using (var scope = _serviceProvider.CreateScope())
                {
                    var reminderService = scope.ServiceProvider.GetRequiredService<IReminderService>();
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    
                    var scanCount = await reminderService.RunReminderScanAsync();
                    _logger.LogInformation("Scan completed: {Count} new reminders created.", scanCount);
                    
                    var processCount = await reminderService.ProcessPendingRemindersAsync();
                    _logger.LogInformation("Processing completed: {Count} reminders sent.", processCount);

                    // Generate in-app notifications for upcoming installments/expiry
                    await notificationService.CreateInstallmentNotificationsAsync();
                    
                    var policyService = scope.ServiceProvider.GetRequiredService<IPolicyService>();
                    var completedCount = await policyService.UpdateCompletedPoliciesAsync();
                    if (completedCount > 0)
                    {
                        _logger.LogInformation("Auto-completed {Count} expired policies.", completedCount);
                    }
                    
                    // Cleanup notifications older than 30 days
                    await notificationService.CleanupOldNotificationsAsync(30);
                }

                _logger.LogInformation("Reminder scheduler cycle completed at {Time}", DateTime.UtcNow);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Unhandled error in reminder scheduler cycle");
            }

            // Wait for the configured interval before the next run
            await Task.Delay(
                TimeSpan.FromHours(_settings.SchedulerIntervalHours),
                stoppingToken);
        }

        _logger.LogInformation("Policy reminder scheduler is stopping.");
    }
}
