using System.Net;
using System.Net.Mail;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

// ═══════════════════════════════════════════════════════════════
//  SMTP EMAIL SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

public enum NotificationChannel
{
    Email,
    SMS,
    WhatsApp,
    InApp
}

/// <summary>
/// Configuration settings for email reminders, bound from appsettings.json.
/// </summary>
public class EmailReminderSettings
{
    public const string SectionName = "EmailReminderSettings";

    /// <summary>
    /// Array of days-before-due-date to send reminders (e.g., [30, 15, 7, 1]).
    /// </summary>
    public int[] ReminderDaysBeforeDue { get; set; } = { 30, 15, 7, 1 };

    /// <summary>
    /// How often (in hours) the scheduler runs to check for upcoming policies.
    /// </summary>
    public int SchedulerIntervalHours { get; set; } = 24;

    /// <summary>
    /// Maximum retry attempts for failed emails.
    /// </summary>
    public int MaxRetryAttempts { get; set; } = 3;

    // ── SMTP settings ────────────────────────────────────────
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public bool SmtpEnableSsl { get; set; } = true;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@policymanager.com";
    public string FromDisplayName { get; set; } = "Policy Manager";

    /// <summary>
    /// Enable or disable the scheduler entirely.
    /// </summary>
    public bool Enabled { get; set; } = true;
}

public class EmailService : IEmailService
{
    private readonly EmailReminderSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(EmailReminderSettings settings, ILogger<EmailService> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public async Task<bool> SendPolicyReminderEmailAsync(PolicyReminderEvent reminder)
    {
        return await SendOmnichannelNotificationAsync(reminder, NotificationChannel.Email);
    }

    public async Task<bool> SendOmnichannelNotificationAsync(PolicyReminderEvent reminder, NotificationChannel channel)
    {
        try
        {
            if (channel == NotificationChannel.Email)
            {
                using var smtpClient = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
                {
                    UseDefaultCredentials = false, // Must be false before setting Credentials
                    Credentials = new NetworkCredential(_settings.SmtpUsername, _settings.SmtpPassword),
                    EnableSsl = _settings.SmtpEnableSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 30000 // 30 seconds
                };

                var fromAddress = new MailAddress(_settings.FromEmail, _settings.FromDisplayName);
                var subject = BuildSubject(reminder);
                var body = BuildHtmlBody(reminder);

                using var message = new MailMessage
                {
                    From = fromAddress,
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                // Split multiple emails (command or semicolon) and add them
                var recipients = reminder.RecipientEmail.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var email in recipients.Select(e => e.Trim()))
                {
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        message.To.Add(new MailAddress(email, reminder.RecipientName));
                    }
                }

                await smtpClient.SendMailAsync(message);

                _logger.LogInformation(
                    "Reminder {Channel} sent to {Email} for policy {PolicyNumber} (due: {DueDate})",
                    channel, reminder.RecipientEmail, reminder.PolicyNumber, reminder.PolicyDueDate.ToShortDateString());
            }
            else
            {
                // Simulated SMS/WhatsApp/InApp delivery
                _logger.LogInformation(
                    "SIMULATED: Reminder {Channel} sent to {Email} for policy {PolicyNumber}. Message: \"Your policy renewal is {Days} days away.\"",
                    channel, reminder.RecipientEmail, reminder.PolicyNumber, reminder.DaysBeforeDue);
            }

            return true;
        }
        catch (SmtpException smtpEx)
        {
            _logger.LogError(smtpEx,
                "SMTP error sending reminder to {Email} for policy {PolicyNumber}. Error: {Message}",
                reminder.RecipientEmail, reminder.PolicyNumber, smtpEx.Message);
            
            if (smtpEx.Message.Contains("authenticated") || smtpEx.StatusCode == SmtpStatusCode.MustIssueStartTlsFirst)
            {
                _logger.LogWarning("Authentication failed. If using Gmail, please ensure you have 2FA enabled and are using an 'App Password' instead of your regular password.");
            }
            
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send reminder {Channel} to {Email} for policy {PolicyNumber}",
                channel, reminder.RecipientEmail, reminder.PolicyNumber);

            return false;
        }
    }

    // ── Build email subject ──────────────────────────────────
    private static string BuildSubject(PolicyReminderEvent reminder)
    {
        return reminder.DaysBeforeDue switch
        {
            0 => $"⚠️ Policy {reminder.PolicyNumber} expires TODAY",
            1 => $"⚠️ Policy {reminder.PolicyNumber} expires TOMORROW",
            _ => $"📋 Policy {reminder.PolicyNumber} expires in {reminder.DaysBeforeDue} days"
        };
    }

    // ── Build HTML email body ────────────────────────────────
    private static string BuildHtmlBody(PolicyReminderEvent reminder)
    {
        var urgencyColor = reminder.DaysBeforeDue <= 3 ? "#e74c3c" : "#f39c12";
        var urgencyText = reminder.DaysBeforeDue switch
        {
            0 => "TODAY",
            1 => "TOMORROW",
            _ => $"in <strong>{reminder.DaysBeforeDue} days</strong>"
        };

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin:0; padding:0; font-family: ""Segoe UI"", Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='max-width: 600px; margin: 20px auto;'>
        <tr>
            <td style='background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;'>
                <h1 style='color: #ffffff; margin: 0; font-size: 24px;'>🛡️ Policy Manager</h1>
                <p style='color: #a0aec0; margin: 5px 0 0;'>Policy Renewal Reminder</p>
            </td>
        </tr>
        <tr>
            <td style='background: #ffffff; padding: 30px; border: 1px solid #e2e8f0;'>
                <p style='font-size: 16px; color: #2d3748;'>
                    Dear <strong>{reminder.RecipientName}</strong>,
                </p>
                <p style='font-size: 16px; color: #2d3748;'>
                    This is a friendly reminder that your policy is due for renewal {urgencyText}.
                </p>
                
                {(!string.IsNullOrEmpty(reminder.CustomNote) ? $@"
                <div style='background: #fffaf0; border-left: 4px solid #f6ad55; padding: 15px; margin: 20px 0; border: 1px solid #feebc8; border-radius: 4px;'>
                    <p style='margin: 0; color: #744210; font-style: italic; font-size: 15px;'>
                        <strong>Personal Note:</strong><br>
                        ""{reminder.CustomNote}""
                    </p>
                </div>" : "")}
                
                <table width='100%' style='background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;'>
                    <tr>
                        <td style='padding: 8px 15px; color: #718096; font-size: 14px;'>Policy Number</td>
                        <td style='padding: 8px 15px; color: #2d3748; font-weight: 600; font-size: 14px;'>{reminder.PolicyNumber}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px 15px; color: #718096; font-size: 14px;'>Due Date</td>
                        <td style='padding: 8px 15px; color: {urgencyColor}; font-weight: 600; font-size: 14px;'>{reminder.PolicyDueDate:dd MMM yyyy}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px 15px; color: #718096; font-size: 14px;'>Days Remaining</td>
                        <td style='padding: 8px 15px; color: {urgencyColor}; font-weight: 600; font-size: 14px;'>{reminder.DaysBeforeDue} day(s)</td>
                    </tr>
                </table>

                <p style='font-size: 14px; color: #4a5568;'>
                    Please ensure timely renewal to maintain uninterrupted coverage. 
                    Contact us if you need any assistance with the renewal process.
                </p>

                <div style='text-align: center; margin: 30px 0 10px;'>
                    <a href='#' style='background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 14px 35px; 
                       text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;'>
                        Review Your Policy
                    </a>
                </div>
            </td>
        </tr>
        <tr>
            <td style='background: #1a1a2e; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;'>
                <p style='color: #a0aec0; font-size: 12px; margin: 0;'>
                    This is an automated reminder from Policy Manager.<br>
                    Please do not reply to this email.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>";
    }
}
