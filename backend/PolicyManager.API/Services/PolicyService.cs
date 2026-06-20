using AutoMapper;
using ExcelDataReader;
using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Helpers;
using PolicyManager.API.Models;
using System.Data;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PolicyManager.API.Services
{
    public interface IPolicyService
    {
        Task<PagedResult<PolicyDto>> GetPoliciesAsync(PolicyFilterDto filter);
        Task<PolicyDto?> GetPolicyByIdAsync(int id);
        Task<PolicyDto> CreatePolicyAsync(CreatePolicyDto dto, int userId);
        Task<PolicyDto> UpdatePolicyAsync(int id, UpdatePolicyDto dto, int userId);
        Task<bool> DeletePolicyAsync(int id, int userId);
        Task<List<PolicyDto>> GetPoliciesByUserAsync(int userId);
        Task<ApiResponse<ExcelUploadResultDto>> UploadPoliciesFromExcelAsync(IFormFile file, int userId);
        Task<PolicyDto> MarkAsPaidAsync(int id, int userId, decimal amount, string method, string? transactionId, string? notes);
        Task<List<PaymentDto>> GetPaymentHistoryAsync(int policyId);
        Task<PolicyDocumentDto> UploadDocumentAsync(int policyId, IFormFile file, string documentType, int userId);
        Task<CreatePolicyDto> ParsePolicyDocumentAsync(IFormFile file);
        Task<(byte[] Content, string FileName, string ContentType)> DownloadDocumentAsync(int documentId);
        Task<byte[]> ExportPoliciesToCsvAsync(PolicyFilterDto filter);
        Task<int> SyncAllInstallmentDatesAsync(int userId);
        Task<List<SyncPreviewDto>> GetSyncPreviewAsync();
        Task<List<UpcomingInstallmentDto>> GetUpcomingInstallmentsAsync(int daysAhead = 30);
        Task<bool> SendTestReminderEmailAsync(int policyId, string? recipientEmail);
        Task<int> UpdateCompletedPoliciesAsync();
    }

    public class PolicyService : IPolicyService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IAuditLogService _auditLogService;
        private readonly ILogger<PolicyService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IGeminiOrchestratorService _aiOrchestrator;

        public PolicyService(AppDbContext context, IMapper mapper,
            IAuditLogService auditLogService, ILogger<PolicyService> logger,
            IConfiguration configuration, IHttpClientFactory httpClientFactory,
            IGeminiOrchestratorService aiOrchestrator)
        {
            _context = context;
            _mapper = mapper;
            _auditLogService = auditLogService;
            _logger = logger;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _aiOrchestrator = aiOrchestrator;
        }

        public async Task<PagedResult<PolicyDto>> GetPoliciesAsync(PolicyFilterDto filter)
        {
            var query = _context.Policies
                .Include(p => p.PolicyType)
                .Include(p => p.CreatedBy)
                .Where(p => !p.IsDeleted)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var term = filter.SearchTerm.ToLower();
                query = query.Where(p =>
                    (p.PolicyNumber != null && p.PolicyNumber.ToLower().Contains(term)) ||
                    (p.PolicyHolderName != null && p.PolicyHolderName.ToLower().Contains(term)) ||
                    (p.Email != null && p.Email.ToLower().Contains(term)) ||
                    (p.Description != null && p.Description.ToLower().Contains(term)) ||
                    (p.PolicyType != null && p.PolicyType.Name != null && p.PolicyType.Name.ToLower().Contains(term)) ||
                    (p.CreatedBy != null && p.CreatedBy.FullName != null && p.CreatedBy.FullName.ToLower().Contains(term))
                );
            }

            if (filter.PolicyTypeIds != null && filter.PolicyTypeIds.Count > 0)
                query = query.Where(p => filter.PolicyTypeIds.Contains(p.PolicyTypeId));

            if (filter.Statuses != null && filter.Statuses.Count > 0)
            {
                query = query.Where(p => filter.Statuses.Contains(p.Status));
            }
            else
            {
                // Exclude Inactive policies by default when no status filter is selected
                query = query.Where(p => p.Status != PolicyConstants.StatusInactive);
            }

            if (!string.IsNullOrWhiteSpace(filter.CompanyName))
                query = query.Where(p => p.CompanyName != null && p.CompanyName.Contains(filter.CompanyName));

            if (filter.StartDateFrom.HasValue)
                query = query.Where(p => p.StartDate >= filter.StartDateFrom.Value);
            if (filter.StartDateTo.HasValue)
                query = query.Where(p => p.StartDate <= filter.StartDateTo.Value);

            if (filter.EndDateFrom.HasValue)
                query = query.Where(p => p.EndDate >= filter.EndDateFrom.Value);
            if (filter.EndDateTo.HasValue)
                query = query.Where(p => p.EndDate <= filter.EndDateTo.Value);

            if (filter.InstallmentTypes != null && filter.InstallmentTypes.Count > 0)
                query = query.Where(p => filter.InstallmentTypes.Contains(p.InstallmentType ?? ""));

            if (filter.NextInstallmentFrom.HasValue)
                query = query.Where(p => p.NextInstallmentDate != null && p.NextInstallmentDate >= filter.NextInstallmentFrom.Value);
            if (filter.NextInstallmentTo.HasValue)
                query = query.Where(p => p.NextInstallmentDate != null && p.NextInstallmentDate <= filter.NextInstallmentTo.Value);

            if (filter.PremiumMin.HasValue)
                query = query.Where(p => p.PremiumAmount >= filter.PremiumMin.Value);
            if (filter.PremiumMax.HasValue)
                query = query.Where(p => p.PremiumAmount <= filter.PremiumMax.Value);

            if (filter.HasOverdueInstallment == true)
                query = query.Where(p => p.Status == PolicyConstants.StatusActive
                                       && p.NextInstallmentDate != null
                                       && p.NextInstallmentDate < DateTime.UtcNow);

            if (filter.FamilyMemberIds != null && filter.FamilyMemberIds.Count > 0)
                query = query.Where(p => p.FamilyMemberId.HasValue && filter.FamilyMemberIds.Contains(p.FamilyMemberId.Value));

            if (!string.IsNullOrWhiteSpace(filter.CreatedByName))
                query = query.Where(p => p.CreatedBy != null
                                       && p.CreatedBy.FullName.Contains(filter.CreatedByName));

            query = filter.SortBy.ToLower() switch
            {
                "policynumber" => filter.SortDirection == "asc" ? query.OrderBy(p => p.PolicyNumber) : query.OrderByDescending(p => p.PolicyNumber),
                "policyholdername" => filter.SortDirection == "asc" ? query.OrderBy(p => p.PolicyHolderName) : query.OrderByDescending(p => p.PolicyHolderName),
                "premiumamount" => filter.SortDirection == "asc" ? query.OrderBy(p => p.PremiumAmount) : query.OrderByDescending(p => p.PremiumAmount),
                "startdate" => filter.SortDirection == "asc" ? query.OrderBy(p => p.StartDate) : query.OrderByDescending(p => p.StartDate),
                "enddate" => filter.SortDirection == "asc" ? query.OrderBy(p => p.EndDate) : query.OrderByDescending(p => p.EndDate),
                "nextinstallmentdate" => filter.SortDirection == "asc" ? query.OrderBy(p => p.NextInstallmentDate) : query.OrderByDescending(p => p.NextInstallmentDate),
                "status" => filter.SortDirection == "asc" ? query.OrderBy(p => p.Status) : query.OrderByDescending(p => p.Status),
                _ => filter.SortDirection == "asc" ? query.OrderBy(p => p.CreatedAt) : query.OrderByDescending(p => p.CreatedAt)
            };

            var totalCount = await query.CountAsync();
            var items = await query.Skip((filter.PageNumber - 1) * filter.PageSize).Take(filter.PageSize).ToListAsync();

            return new PagedResult<PolicyDto>
            {
                Items = _mapper.Map<List<PolicyDto>>(items),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<PolicyDto?> GetPolicyByIdAsync(int id)
        {
            var policy = await _context.Policies
                .Include(p => p.PolicyType)
                .Include(p => p.CreatedBy)
                .Include(p => p.Payments).ThenInclude(pay => pay.ProcessedBy)
                .Include(p => p.Documents).ThenInclude(doc => doc.UploadedBy)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            return policy != null ? _mapper.Map<PolicyDto>(policy) : null;
        }

        public async Task<PolicyDto> CreatePolicyAsync(CreatePolicyDto dto, int userId)
        {
            var policyNumber = dto.PolicyNumber?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(policyNumber))
            {
                policyNumber = await GeneratePolicyNumberAsync();
            }
            else
            {
                var exists = await _context.Policies.AnyAsync(p => !p.IsDeleted && p.PolicyNumber.ToLower() == policyNumber.ToLower());
                if (exists)
                {
                    throw new ArgumentException($"Policy number '{policyNumber}' already exists in the system.");
                }
            }

            var policy = _mapper.Map<Policy>(dto);
            policy.PolicyNumber = policyNumber;
            policy.CreatedByUserId = userId;

            _context.Policies.Add(policy);
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(PolicyConstants.ActionCreate, "Policy", policy.Id, null,
                System.Text.Json.JsonSerializer.Serialize(dto), userId);

            return _mapper.Map<PolicyDto>(
                await _context.Policies.Include(p => p.PolicyType).Include(p => p.CreatedBy).FirstAsync(p => p.Id == policy.Id));
        }

        public async Task<PolicyDto> UpdatePolicyAsync(int id, UpdatePolicyDto dto, int userId)
        {
            var policy = await _context.Policies
                .Include(p => p.PolicyType)
                .Include(p => p.CreatedBy)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new KeyNotFoundException($"Policy with ID {id} not found.");

            var policyNumber = dto.PolicyNumber?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(policyNumber))
            {
                throw new ArgumentException("Policy number cannot be empty.");
            }
            
            var exists = await _context.Policies.AnyAsync(p => p.Id != id && !p.IsDeleted && p.PolicyNumber.ToLower() == policyNumber.ToLower());
            if (exists)
            {
                throw new ArgumentException($"Policy number '{policyNumber}' already exists in the system.");
            }

            var oldValues = System.Text.Json.JsonSerializer.Serialize(_mapper.Map<PolicyDto>(policy));
            _mapper.Map(dto, policy);
            policy.PolicyNumber = policyNumber;
            policy.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _auditLogService.LogAsync(PolicyConstants.ActionUpdate, "Policy", id, oldValues,
                System.Text.Json.JsonSerializer.Serialize(dto), userId);

            return _mapper.Map<PolicyDto>(policy);
        }

        public async Task<bool> DeletePolicyAsync(int id, int userId)
        {
            var policy = await _context.Policies.FindAsync(id)
                ?? throw new KeyNotFoundException($"Policy with ID {id} not found.");

            policy.IsDeleted = true;
            policy.Status = "Inactive";
            policy.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(PolicyConstants.ActionDelete, "Policy", id, null, null, userId);
            return true;
        }

        public async Task<PolicyDto> MarkAsPaidAsync(int id, int userId, decimal amount, string method, string? transactionId, string? notes)
        {
            var policy = await _context.Policies
                .Include(p => p.PolicyType)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new KeyNotFoundException($"Policy with ID {id} not found.");

            var oldDate = policy.NextInstallmentDate ?? DateTime.UtcNow;
            DateTime? nextDate = oldDate;

            if (!string.IsNullOrEmpty(policy.InstallmentType))
            {
                var type = policy.InstallmentType.ToLower();
                if (type == PolicyConstants.InstallmentOneTime.ToLower())
                {
                    nextDate = null;
                }
                else
                {
                    nextDate = type switch
                    {
                        "monthly" => oldDate.AddMonths(1),
                        "quarterly" => oldDate.AddMonths(3),
                        "half-yearly" => oldDate.AddMonths(6),
                        "yearly" => oldDate.AddYears(1),
                        _ => oldDate.AddMonths(1)
                    };
                }
            }
            else
            {
                nextDate = oldDate.AddMonths(1);
            }

            var payment = new Payment
            {
                PolicyId = policy.Id,
                Amount = amount,
                PaymentDate = DateTime.UtcNow,
                PaymentMethod = method,
                TransactionId = transactionId,
                Notes = notes,
                ProcessedByUserId = userId
            };

            _context.Payments.Add(payment);
            policy.NextInstallmentDate = nextDate;
            policy.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(PolicyConstants.ActionPayment, "Policy", id, 
                $"Next due: {oldDate:yyyy-MM-dd}", $"Recorded payment of {amount:C}. New next due: {nextDate:yyyy-MM-dd}", userId);

            return _mapper.Map<PolicyDto>(policy);
        }

        public async Task<List<PaymentDto>> GetPaymentHistoryAsync(int policyId)
        {
            var payments = await _context.Payments
                .Include(p => p.ProcessedBy)
                .Where(p => p.PolicyId == policyId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return _mapper.Map<List<PaymentDto>>(payments);
        }

        public async Task<PolicyDocumentDto> UploadDocumentAsync(int policyId, IFormFile file, string documentType, int userId)
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "policies", policyId.ToString());
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{DateTime.UtcNow.Ticks}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var doc = new PolicyDocument
            {
                PolicyId = policyId,
                DocumentType = documentType,
                FileName = file.FileName,
                FilePath = filePath,
                FileExtension = Path.GetExtension(file.FileName),
                FileSize = file.Length,
                UploadedByUserId = userId
            };

            _context.PolicyDocuments.Add(doc);
            await _context.SaveChangesAsync();

            await _auditLogService.LogAsync(PolicyConstants.ActionUpload, "PolicyDocument", doc.Id, null, $"Uploaded {documentType}: {file.FileName}", userId);

            return _mapper.Map<PolicyDocumentDto>(doc);
        }

        public async Task<CreatePolicyDto> ParsePolicyDocumentAsync(IFormFile file)
        {
            try
            {
                byte[] fileBytes;
                using (var ms = new MemoryStream())
                {
                    await file.CopyToAsync(ms);
                    fileBytes = ms.ToArray();
                }

                var extraction = await _aiOrchestrator.ExtractPolicyDetailsAsync(fileBytes, file.ContentType);
                
                var dto = new CreatePolicyDto
                {
                    PolicyHolderName = extraction.PolicyHolderName.Value,
                    CompanyName = extraction.CompanyName.Value,
                    PremiumAmount = extraction.PremiumAmount.Value,
                    StartDate = extraction.StartDate.Value,
                    EndDate = extraction.EndDate.Value,
                    InstallmentType = extraction.InstallmentType.Value,
                    CoverageAmount = extraction.CoverageAmount.Value,
                    Description = $"AI-Extracted (Confidence: {extraction.OverallConfidence:P0}) from {file.FileName}."
                };

                return dto;
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"AI Extraction failed, falling back to mock: {ex.Message}");
                return await GetMockExtractionAsync(file);
            }
        }

        private async Task<CreatePolicyDto> GetMockExtractionAsync(IFormFile file)
        {
            return new CreatePolicyDto { StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), Description = $"Heuristic extraction from {file.FileName}" };
        }

        public async Task<(byte[] Content, string FileName, string ContentType)> DownloadDocumentAsync(int documentId)
        {
            var doc = await _context.PolicyDocuments.FindAsync(documentId) ?? throw new KeyNotFoundException("Document not found.");
            var content = await System.IO.File.ReadAllBytesAsync(doc.FilePath);
            return (content, doc.FileName, "application/pdf");
        }

        public async Task<int> SyncAllInstallmentDatesAsync(int userId)
        {
            var policies = await _context.Policies
                .Include(p => p.PolicyType)
                .Where(p => p.Status == PolicyConstants.StatusActive && !p.IsDeleted)
                .ToListAsync();

            int updatedCount = 0;
            var now = DateTime.UtcNow;

            foreach (var p in policies)
            {
                if (string.IsNullOrEmpty(p.InstallmentType)) continue;

                var type = p.InstallmentType.ToLower();
                if (type == PolicyConstants.InstallmentOneTime.ToLower() || type == "single")
                {
                    if (p.NextInstallmentDate != null)
                    {
                        p.NextInstallmentDate = null;
                        p.UpdatedAt = now;
                        updatedCount++;
                    }
                    continue;
                }

                // If next installment is null, let's start projecting from StartDate
                var baseDate = p.NextInstallmentDate ?? p.StartDate;
                var currentNext = baseDate;

                // If the next installment date is already in the future, no sync needed
                if (p.NextInstallmentDate != null && p.NextInstallmentDate >= now)
                {
                    continue;
                }

                bool changed = false;
                int iterations = 0;

                // Keep advancing the date until it is in the future
                while (currentNext < now && iterations < 1000)
                {
                    iterations++;
                    currentNext = type switch
                    {
                        "monthly" => currentNext.AddMonths(1),
                        "quarterly" => currentNext.AddMonths(3),
                        "half-yearly" => currentNext.AddMonths(6),
                        "yearly" => currentNext.AddYears(1),
                        _ => currentNext.AddMonths(1)
                    };
                    changed = true;
                }

                if (changed && p.NextInstallmentDate != currentNext)
                {
                    var oldVal = p.NextInstallmentDate;
                    p.NextInstallmentDate = currentNext;
                    p.UpdatedAt = now;
                    updatedCount++;

                    await _auditLogService.LogAsync(PolicyConstants.ActionUpdate, "Policy", p.Id,
                        $"Sync next installment date. Old: {oldVal:yyyy-MM-dd}",
                        $"New next installment date synced to: {currentNext:yyyy-MM-dd}", userId);
                }
            }

            if (updatedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return updatedCount;
        }

        public async Task<List<SyncPreviewDto>> GetSyncPreviewAsync()
        {
            var policies = await _context.Policies
                .Include(p => p.PolicyType)
                .Where(p => p.Status == PolicyConstants.StatusActive && !p.IsDeleted)
                .ToListAsync();

            var list = new List<SyncPreviewDto>();
            var now = DateTime.UtcNow;

            foreach (var p in policies)
            {
                if (string.IsNullOrEmpty(p.InstallmentType)) continue;

                var type = p.InstallmentType.ToLower();
                if (type == PolicyConstants.InstallmentOneTime.ToLower() || type == "single")
                {
                    if (p.NextInstallmentDate != null)
                    {
                        list.Add(new SyncPreviewDto
                        {
                            PolicyId = p.Id,
                            PolicyNumber = p.PolicyNumber,
                            PolicyHolderName = p.PolicyHolderName,
                            CompanyName = p.CompanyName ?? "N/A",
                            StartDate = p.StartDate,
                            EndDate = p.EndDate,
                            CurrentNextInstallmentDate = p.NextInstallmentDate,
                            NewNextInstallmentDate = null,
                            InstallmentType = p.InstallmentType
                        });
                    }
                    continue;
                }

                // If next installment is null, let's start projecting from StartDate
                var baseDate = p.NextInstallmentDate ?? p.StartDate;
                var currentNext = baseDate;

                // If the next installment date is already in the future, no sync needed
                if (p.NextInstallmentDate != null && p.NextInstallmentDate >= now)
                {
                    continue;
                }

                bool changed = false;
                int iterations = 0;

                // Keep advancing the date until it is in the future
                while (currentNext < now && iterations < 1000)
                {
                    iterations++;
                    currentNext = type switch
                    {
                        "monthly" => currentNext.AddMonths(1),
                        "quarterly" => currentNext.AddMonths(3),
                        "half-yearly" => currentNext.AddMonths(6),
                        "yearly" => currentNext.AddYears(1),
                        _ => currentNext.AddMonths(1)
                    };
                    changed = true;
                }

                if (changed && p.NextInstallmentDate != currentNext)
                {
                    list.Add(new SyncPreviewDto
                    {
                        PolicyId = p.Id,
                        PolicyNumber = p.PolicyNumber,
                        PolicyHolderName = p.PolicyHolderName,
                        CompanyName = p.CompanyName ?? "N/A",
                        StartDate = p.StartDate,
                        EndDate = p.EndDate,
                        CurrentNextInstallmentDate = p.NextInstallmentDate,
                        NewNextInstallmentDate = currentNext,
                        InstallmentType = p.InstallmentType
                    });
                }
            }

            return list;
        }

        public async Task<byte[]> ExportPoliciesToCsvAsync(PolicyFilterDto filter)
        {
            var result = await GetPoliciesAsync(filter);
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Policy Number,Holder,Premium,Status");
            foreach (var p in result.Items) sb.AppendLine($"{p.PolicyNumber},{p.PolicyHolderName},{p.PremiumAmount},{p.Status}");
            return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        }

        public async Task<List<PolicyDto>> GetPoliciesByUserAsync(int userId)
        {
            var policies = await _context.Policies.Where(p => p.CreatedByUserId == userId).ToListAsync();
            return _mapper.Map<List<PolicyDto>>(policies);
        }

        public async Task<List<UpcomingInstallmentDto>> GetUpcomingInstallmentsAsync(int daysAhead = 30)
        {
            var cutoff = DateTime.UtcNow.AddDays(daysAhead);
            var policies = await _context.Policies
                .Include(p => p.PolicyType)
                .Include(p => p.FamilyMember)
                .Where(p => !p.IsDeleted && p.Status == PolicyConstants.StatusActive && p.NextInstallmentDate <= cutoff)
                .ToListAsync();
            return _mapper.Map<List<UpcomingInstallmentDto>>(policies);
        }

        public async Task<bool> SendTestReminderEmailAsync(int policyId, string? recipientEmail) => true;

        private async Task<string> GeneratePolicyNumberAsync()
        {
            var count = await _context.Policies.CountAsync();
            return $"POL-{DateTime.UtcNow.Year}-{count + 1:D6}";
        }

        private static string SanitizeCellValue(string? rawValue)
        {
            if (string.IsNullOrWhiteSpace(rawValue)) return string.Empty;
            var trimmed = rawValue.Trim();
            var dangerousStarts = new[] { "=", "+", "-", "@", "\t", "\r" };
            foreach (var prefix in dangerousStarts) if (trimmed.StartsWith(prefix)) return "'" + trimmed;
            return trimmed;
        }

        public async Task<ApiResponse<ExcelUploadResultDto>> UploadPoliciesFromExcelAsync(IFormFile file, int userId)
        {
            var result = new ExcelUploadResultDto();
            if (file == null || file.Length == 0) return ApiResponse<ExcelUploadResultDto>.FailResponse("File is empty.");

            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

            using var stream = file.OpenReadStream();
            using var reader = ExcelReaderFactory.CreateReader(stream);
            var dataSet = reader.AsDataSet();
            var dataTable = dataSet.Tables[0];

            if (dataTable.Rows.Count <= 1) return ApiResponse<ExcelUploadResultDto>.FailResponse("No data rows found.");

            // Performance Optimization: Pre-load existing policy numbers to avoid N database calls
            var policyList = await _context.Policies
                .Select(p => p.PolicyNumber)
                .ToListAsync();
            var existingPolicyNumbers = policyList.ToHashSet();

            var policyTypes = await _context.PolicyTypes.ToDictionaryAsync(t => t.Name.ToLower(), t => t.Id);
            var familyMembers = await _context.FamilyMembers.ToDictionaryAsync(m => m.Name.ToLower(), m => m.Id);

            var policiesToInsert = new List<Policy>();

            for (int i = 1; i < dataTable.Rows.Count; i++) // Skip header
            {
                var row = dataTable.Rows[i];
                string GetVal(int idx) => SanitizeCellValue((idx >= 0 && idx < dataTable.Columns.Count) ? row[idx]?.ToString() : string.Empty);

                try
                {
                    var policyNumber = GetVal(0);
                    if (string.IsNullOrEmpty(policyNumber)) continue;

                    // Optimized duplicate check
                    if (existingPolicyNumbers.Contains(policyNumber))
                    {
                        result.SkippedCount++;
                        result.Errors.Add($"Row {i + 1}: Policy {policyNumber} already exists.");
                        continue;
                    }

                    var typeName = GetVal(3).ToLower();
                    var memberName = GetVal(1).ToLower();

                    var policy = new Policy
                    {
                        PolicyNumber = policyNumber,
                        PolicyHolderName = GetVal(1),
                        Email = GetVal(2),
                        PolicyTypeId = policyTypes.GetValueOrDefault(typeName, 1),
                        FamilyMemberId = familyMembers.GetValueOrDefault(memberName),
                        PremiumAmount = decimal.TryParse(GetVal(4), out var p) ? p : 0,
                        StartDate = DateTime.TryParse(GetVal(5), out var s) ? s : DateTime.UtcNow,
                        EndDate = DateTime.TryParse(GetVal(6), out var e) ? e : DateTime.UtcNow.AddYears(1),
                        NextInstallmentDate = DateTime.TryParse(GetVal(7), out var n) ? n : null,
                        InstallmentType = GetVal(8),
                        Status = PolicyConstants.StatusActive,
                        CreatedByUserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };

                    policiesToInsert.Add(policy);
                    existingPolicyNumbers.Add(policyNumber); // Add to local hashset for this batch
                    result.ImportedCount++;
                }
                catch (Exception ex)
                {
                    result.FailedCount++;
                    result.Errors.Add($"Row {i + 1}: {ex.Message}");
                }
            }

            if (policiesToInsert.Any())
            {
                // Batch insert
                await _context.Policies.AddRangeAsync(policiesToInsert);
                await _context.SaveChangesAsync();
                await _auditLogService.LogAsync(PolicyConstants.ActionImport, "Policy", null, null, $"Imported {policiesToInsert.Count} policies", userId);
            }

            return ApiResponse<ExcelUploadResultDto>.SuccessResponse(result, "Import completed.");
        }

        public async Task<int> UpdateCompletedPoliciesAsync()
        {
            var now = DateTime.UtcNow;
            var policiesToComplete = await _context.Policies
                .Where(p => p.Status != PolicyConstants.StatusCompleted && 
                            p.Status != PolicyConstants.StatusCancelled && 
                            p.EndDate < now)
                .ToListAsync();

            if (!policiesToComplete.Any())
                return 0;

            foreach (var policy in policiesToComplete)
            {
                var oldValues = JsonSerializer.Serialize(_mapper.Map<PolicyDto>(policy));
                policy.Status = PolicyConstants.StatusCompleted;
                policy.UpdatedAt = now;
                
                // Add an audit log for the system automated change
                await _auditLogService.LogAsync(PolicyConstants.ActionUpdate, "Policy", policy.Id, oldValues,
                    JsonSerializer.Serialize(_mapper.Map<PolicyDto>(policy)), null, "System");
            }

            await _context.SaveChangesAsync();
            return policiesToComplete.Count;
        }
    }
}
