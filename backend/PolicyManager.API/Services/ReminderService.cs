using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Helpers;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services
{
    public interface IReminderService
    {
        Task<List<PolicyReminderSettingDto>> GetSettingsAsync();
        Task<PolicyReminderSettingDto> UpdateSettingAsync(int id, UpdateReminderSettingDto dto);
        Task<int> RunReminderScanAsync();
        Task<int> ProcessPendingRemindersAsync();
        Task<List<PolicyReminderEventDto>> GetRecentEventsAsync(int count = 20);
        Task<bool> SendManualReminderAsync(ManualReminderDto dto);
    }

    public class ReminderService : IReminderService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;
        private readonly EmailReminderSettings _settings;
        private readonly ILogger<ReminderService> _logger;

        public ReminderService(
            AppDbContext context, 
            IMapper mapper,
            IEmailService emailService,
            EmailReminderSettings settings,
            ILogger<ReminderService> logger)
        {
            _context = context;
            _mapper = mapper;
            _emailService = emailService;
            _settings = settings;
            _logger = logger;
        }

        public async Task<List<PolicyReminderSettingDto>> GetSettingsAsync()
        {
            var settings = await _context.PolicyReminderSettings
                .Include(s => s.PolicyType)
                .OrderBy(s => s.PolicyType!.Name)
                .ToListAsync();

            return _mapper.Map<List<PolicyReminderSettingDto>>(settings);
        }

        public async Task<PolicyReminderSettingDto> UpdateSettingAsync(int id, UpdateReminderSettingDto dto)
        {
            var setting = await _context.PolicyReminderSettings
                .Include(s => s.PolicyType)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (setting == null) throw new KeyNotFoundException("Reminder setting not found.");

            setting.IsEnabled = dto.IsEnabled;
            setting.DaysBeforeDue = dto.DaysBeforeDue;
            setting.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return _mapper.Map<PolicyReminderSettingDto>(setting);
        }

        public async Task<int> RunReminderScanAsync()
        {
            var count = 0;
            var today = DateTime.UtcNow.Date;

            var activeSettings = await _context.PolicyReminderSettings
                .Where(s => s.IsEnabled)
                .ToListAsync();

            foreach (var setting in activeSettings)
            {
                var targetDate = today.AddDays(setting.DaysBeforeDue);

                // 1. Expiry Scan
                var expPolicies = await _context.Policies
                    .Where(p => p.PolicyTypeId == setting.PolicyTypeId && p.Status == PolicyConstants.StatusActive && !p.IsDeleted && p.EndDate.Date == targetDate.Date)
                    .ToListAsync();

                foreach (var p in expPolicies)
                {
                    if (!await _context.PolicyReminderEvents.AnyAsync(r => r.PolicyId == p.Id && r.DaysBeforeDue == setting.DaysBeforeDue && r.PolicyDueDate.Date == p.EndDate.Date))
                    {
                        _context.PolicyReminderEvents.Add(new PolicyReminderEvent
                        {
                            PolicyId = p.Id, RecipientEmail = p.Email, RecipientName = p.PolicyHolderName,
                            PolicyNumber = p.PolicyNumber, PolicyDueDate = p.EndDate, DaysBeforeDue = setting.DaysBeforeDue,
                            Status = "Pending", EmailSubject = $"\ud83d\udccb Expiry Reminder: {p.PolicyNumber} in {setting.DaysBeforeDue} days",
                            CreatedAt = DateTime.UtcNow
                        });
                        count++;
                    }
                }

                // 2. Installment Scan
                var instPolicies = await _context.Policies
                    .Where(p => p.PolicyTypeId == setting.PolicyTypeId && p.Status == PolicyConstants.StatusActive && !p.IsDeleted && p.NextInstallmentDate != null && p.NextInstallmentDate.Value.Date == targetDate.Date)
                    .ToListAsync();

                foreach (var p in instPolicies)
                {
                    if (!await _context.PolicyReminderEvents.AnyAsync(r => r.PolicyId == p.Id && r.DaysBeforeDue == setting.DaysBeforeDue && r.PolicyDueDate.Date == p.NextInstallmentDate.Value.Date))
                    {
                        _context.PolicyReminderEvents.Add(new PolicyReminderEvent
                        {
                            PolicyId = p.Id, RecipientEmail = p.Email, RecipientName = p.PolicyHolderName,
                            PolicyNumber = p.PolicyNumber, PolicyDueDate = p.NextInstallmentDate.Value, DaysBeforeDue = setting.DaysBeforeDue,
                            Status = "Pending", EmailSubject = $"\ud83d\udd14 Installment Reminder: {p.PolicyNumber} is due in {setting.DaysBeforeDue} days",
                            CreatedAt = DateTime.UtcNow
                        });
                        count++;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return count;
        }

        public async Task<int> ProcessPendingRemindersAsync()
        {
            var reminders = await _context.PolicyReminderEvents
                .Where(r => r.Status == "Pending" || (r.Status == "Failed" && r.RetryCount < _settings.MaxRetryAttempts))
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();

            var sentCount = 0;
            foreach (var reminder in reminders)
            {
                var success = await _emailService.SendPolicyReminderEmailAsync(reminder);
                if (success) {
                    reminder.Status = "Sent";
                    reminder.SentAt = DateTime.UtcNow;
                    sentCount++;
                } else {
                    reminder.RetryCount++;
                    reminder.Status = reminder.RetryCount >= _settings.MaxRetryAttempts ? "Failed" : "Pending";
                }
            }

            await _context.SaveChangesAsync();
            return sentCount;
        }

        public async Task<List<PolicyReminderEventDto>> GetRecentEventsAsync(int count = 20)
        {
            var events = await _context.PolicyReminderEvents
                .OrderByDescending(e => e.CreatedAt)
                .Take(count)
                .ToListAsync();

            return _mapper.Map<List<PolicyReminderEventDto>>(events);
        }

        public async Task<bool> SendManualReminderAsync(ManualReminderDto dto)
        {
            var policy = await _context.Policies
                .Include(p => p.PolicyType)
                .FirstOrDefaultAsync(p => p.Id == dto.PolicyId);

            if (policy == null) return false;

            var targetEmail = !string.IsNullOrEmpty(dto.RecipientEmail) ? dto.RecipientEmail : policy.Email;
            var urgencyText = dto.TemplateType == "Critical" ? "\u26a0\ufe0f CRITICAL" : (dto.TemplateType == "Installment" ? "\ud83d\udcb3" : "\ud83d\udccb");
            
            var reminder = new PolicyReminderEvent
            {
                PolicyId = policy.Id,
                RecipientEmail = targetEmail,
                RecipientName = policy.PolicyHolderName,
                PolicyNumber = policy.PolicyNumber,
                PolicyDueDate = policy.NextInstallmentDate ?? policy.EndDate,
                DaysBeforeDue = policy.NextInstallmentDate.HasValue 
                    ? (policy.NextInstallmentDate.Value.Date - DateTime.UtcNow.Date).Days
                    : (policy.EndDate.Date - DateTime.UtcNow.Date).Days,
                Status = "Pending",
                EmailSubject = $"{urgencyText} Reminder: Policy {policy.PolicyNumber}",
                CustomNote = dto.CustomNote,
                CreatedAt = DateTime.UtcNow
            };

            _context.PolicyReminderEvents.Add(reminder);
            await _context.SaveChangesAsync();

            return await _emailService.SendPolicyReminderEmailAsync(reminder);
        }
    }
}
