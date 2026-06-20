using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services
{
    public interface IAuditLogService
    {
        Task LogAsync(string action, string entityName, int? entityId,
            string? oldValues, string? newValues, int? userId, string? ipAddress = null);
        Task<PagedResult<AuditLogDto>> GetLogsAsync(int page = 1, int pageSize = 20);
        Task<List<AuditLogDto>> GetPolicyAuditHistoryAsync(int policyId);
        Task<Dictionary<string, int>> GetAuditSummaryAsync();
    }

    public class AuditLogService : IAuditLogService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public AuditLogService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task LogAsync(string action, string entityName, int? entityId,
            string? oldValues, string? newValues, int? userId, string? ipAddress = null)
        {
            // Prevent DB truncation exceptions for large serialized payloads
            if (oldValues?.Length > 2000) oldValues = oldValues.Substring(0, 1997) + "...";
            if (newValues?.Length > 2000) newValues = newValues.Substring(0, 1997) + "...";

            var log = new AuditLog
            {
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                OldValues = oldValues,
                NewValues = newValues,
                UserId = userId,
                IpAddress = ipAddress,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task<PagedResult<AuditLogDto>> GetLogsAsync(int page = 1, int pageSize = 20)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.Timestamp);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<AuditLogDto>
            {
                Items = _mapper.Map<List<AuditLogDto>>(items),
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };
        }

        public async Task<List<AuditLogDto>> GetPolicyAuditHistoryAsync(int policyId)
        {
            var logs = await _context.AuditLogs
                .Include(a => a.User)
                .Where(a => a.EntityName == "Policy" && a.EntityId == policyId)
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();

            return _mapper.Map<List<AuditLogDto>>(logs);
        }

        public async Task<Dictionary<string, int>> GetAuditSummaryAsync()
        {
            return await _context.AuditLogs
                .GroupBy(l => l.Action)
                .Select(g => new { Action = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Action, x => x.Count);
        }
    }
}
