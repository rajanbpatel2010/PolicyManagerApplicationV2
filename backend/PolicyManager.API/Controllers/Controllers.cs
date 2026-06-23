using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManager.API.DTOs;
using PolicyManager.API.Helpers;
using PolicyManager.API.Services;
using PolicyManager.API.Models;

namespace PolicyManager.API.Controllers;

// ═══════════════════════════════════════════════════════════════
//  AUTH CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>
    /// Authenticate a user and return a JWT token.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<AuthResponseDto>.FailResponse("Validation failed",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _authService.LoginAsync(dto, ipAddress);
        return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Login successful"));
    }

    /// <summary>
    /// Register a new user.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<AuthResponseDto>.FailResponse("Validation failed",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));

        var result = await _authService.RegisterAsync(dto);
        return CreatedAtAction(nameof(Register), ApiResponse<AuthResponseDto>.SuccessResponse(result, "Registration successful"));
    }

    /// <summary>
    /// Get current user profile from JWT claims.
    /// </summary>
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetProfile()
    {
        var userId = JwtHelper.GetUserIdFromClaims(User);
        if (userId == null) return Unauthorized();

        var user = await _authService.GetUserByIdAsync(userId.Value);
        if (user == null) return NotFound();

        return Ok(ApiResponse<UserDto>.SuccessResponse(user));
    }

    /// <summary>
    /// Admin-only: Get all users.
    /// </summary>
    [HttpGet("users")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAllUsers()
    {
        var users = await _authService.GetAllUsersAsync();
        return Ok(ApiResponse<List<UserDto>>.SuccessResponse(users));
    }

    /// <summary>
    /// Admin-only: Get login history.
    /// </summary>
    [HttpGet("login-history")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<List<RequestLoginHistory>>>> GetLoginHistory()
    {
        var history = await _authService.GetLoginHistoryAsync();
        return Ok(ApiResponse<List<RequestLoginHistory>>.SuccessResponse(history));
    }
}

// ═══════════════════════════════════════════════════════════════
//  POLICIES CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PoliciesController : ControllerBase
{
    private readonly IPolicyService _policyService;

    public PoliciesController(IPolicyService policyService) => _policyService = policyService;

    /// <summary>
    /// Get paginated, filtered, sorted list of policies.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PolicyDto>>>> GetPolicies(
        [FromQuery] PolicyFilterDto filter)
    {
        var result = await _policyService.GetPoliciesAsync(filter);
        return Ok(ApiResponse<PagedResult<PolicyDto>>.SuccessResponse(result));
    }

    /// <summary>
    /// Get a single policy by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<PolicyDto>>> GetPolicy(int id)
    {
        var policy = await _policyService.GetPolicyByIdAsync(id);
        if (policy == null)
            return NotFound(ApiResponse<PolicyDto>.FailResponse("Policy not found"));

        return Ok(ApiResponse<PolicyDto>.SuccessResponse(policy));
    }

    /// <summary>
    /// Create a new policy.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PolicyDto>>> CreatePolicy([FromBody] CreatePolicyDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<PolicyDto>.FailResponse("Validation failed",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));

        var userId = JwtHelper.GetUserIdFromClaims(User) ?? 0;
        var policy = await _policyService.CreatePolicyAsync(dto, userId);
        return CreatedAtAction(nameof(GetPolicy), new { id = policy.Id },
            ApiResponse<PolicyDto>.SuccessResponse(policy, "Policy created successfully"));
    }

    /// <summary>
    /// Update an existing policy.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<PolicyDto>>> UpdatePolicy(int id, [FromBody] UpdatePolicyDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<PolicyDto>.FailResponse("Validation failed",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()));

        var userId = JwtHelper.GetUserIdFromClaims(User) ?? 0;
        var policy = await _policyService.UpdatePolicyAsync(id, dto, userId);
        return Ok(ApiResponse<PolicyDto>.SuccessResponse(policy, "Policy updated successfully"));
    }

    /// <summary>
    /// Soft-delete a policy.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePolicy(int id)
    {
        var userId = JwtHelper.GetUserIdFromClaims(User) ?? 0;
        await _policyService.DeletePolicyAsync(id, userId);
        return Ok(ApiResponse<bool>.SuccessResponse(true, "Policy deleted successfully"));
    }

    /// <summary>
    /// Get policies created by the current user.
    /// </summary>
    [HttpGet("my-policies")]
    public async Task<ActionResult<ApiResponse<List<PolicyDto>>>> GetMyPolicies()
    {
        var userId = JwtHelper.GetUserIdFromClaims(User) ?? 0;
        var policies = await _policyService.GetPoliciesByUserAsync(userId);
        return Ok(ApiResponse<List<PolicyDto>>.SuccessResponse(policies));
    }

    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<ExcelUploadResultDto>>> UploadPolicies(IFormFile file)
    {
        var userId = JwtHelper.GetUserIdFromClaims(User) ?? 0;
        var result = await _policyService.UploadPoliciesFromExcelAsync(file, userId);
        return Ok(result);
    }

    [HttpGet("template")]
    public async Task<IActionResult> DownloadTemplate()
    {
        var csvBytes = await _policyService.ExportPoliciesToCsvAsync(new PolicyFilterDto { PageSize = 0 });
        return File(csvBytes, "text/csv", "Policy_Import_Template_2026.csv");
    }

    /// <summary>
    /// Mark a policy as paid, record a payment entry, and auto-increment its next installment date.
    /// </summary>
    [HttpPost("{id:int}/pay")]
    public async Task<ActionResult<ApiResponse<PolicyDto>>> MarkAsPaid(int id, [FromBody] CreatePaymentDto dto)
    {
        if (id != dto.PolicyId)
            return BadRequest(ApiResponse<PolicyDto>.FailResponse("Policy ID mismatch"));

        var userId = JwtHelper.GetUserIdFromClaims(User) ?? 0;
        var policy = await _policyService.MarkAsPaidAsync(id, userId, dto.Amount, dto.PaymentMethod, dto.TransactionId, dto.Notes);
        return Ok(ApiResponse<PolicyDto>.SuccessResponse(policy, "Payment recorded and next due date incremented successfully."));
    }

    /// <summary>
    /// Get payment history for a specific policy.
    /// </summary>
    [HttpGet("{id:int}/payments")]
    public async Task<ActionResult<ApiResponse<List<PaymentDto>>>> GetPaymentHistory(int id)
    {
        var result = await _policyService.GetPaymentHistoryAsync(id);
        return Ok(ApiResponse<List<PaymentDto>>.SuccessResponse(result));
    }

    /// <summary>
    /// Get audit history for a specific policy.
    /// </summary>
    [HttpGet("{id:int}/history")]
    public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetPolicyHistory(int id, [FromServices] IAuditLogService auditLogService)
    {
        var result = await auditLogService.GetPolicyAuditHistoryAsync(id);
        return Ok(ApiResponse<List<AuditLogDto>>.SuccessResponse(result));
    }

    /// <summary>
    /// Catch up all installment dates to the current date for all policies.
    /// </summary>
    [HttpPost("sync-installments")]
    public async Task<ActionResult<ApiResponse<int>>> SyncInstallmentDates()
    {
        var userId = JwtHelper.GetUserIdFromClaims(User) ?? 0;
        var updatedCount = await _policyService.SyncAllInstallmentDatesAsync(userId);
        return Ok(ApiResponse<int>.SuccessResponse(updatedCount, $"Successfully caught up installments for {updatedCount} policies."));
    }

    /// <summary>
    /// Preview which policies need sync and what their new next installment dates will be.
    /// </summary>
    [HttpGet("sync-preview")]
    public async Task<ActionResult<ApiResponse<List<SyncPreviewDto>>>> GetSyncPreview()
    {
        var preview = await _policyService.GetSyncPreviewAsync();
        return Ok(ApiResponse<List<SyncPreviewDto>>.SuccessResponse(preview));
    }

    /// <summary>
    /// Upload a document (Policy or Receipt) for a policy.
    /// </summary>
    [HttpPost("{id:int}/documents")]
    public async Task<ActionResult<ApiResponse<PolicyDocumentDto>>> UploadDocument(int id, IFormFile file, [FromQuery] string type = "Policy")
    {
        var userId = JwtHelper.GetUserIdFromClaims(User) ?? 0;
        var result = await _policyService.UploadDocumentAsync(id, file, type, userId);
        return Ok(ApiResponse<PolicyDocumentDto>.SuccessResponse(result, $"{type} document uploaded successfully"));
    }

    /// <summary>
    /// Use AI to parse a policy document and return suggested details.
    /// </summary>
    [HttpPost("parse-document")]
    public async Task<ActionResult<ApiResponse<CreatePolicyDto>>> ParseDocument(IFormFile file)
    {
        var result = await _policyService.ParsePolicyDocumentAsync(file);
        return Ok(ApiResponse<CreatePolicyDto>.SuccessResponse(result, "AI analysis completed. Details extracted."));
    }

    /// <summary>
    /// Download a policy document.
    /// </summary>
    [HttpGet("documents/{documentId:int}")]
    public async Task<IActionResult> DownloadDocument(int documentId)
    {
        var result = await _policyService.DownloadDocumentAsync(documentId);
        return File(result.Content, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Export filtered policies to CSV.
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportToCsv([FromQuery] PolicyFilterDto filter)
    {
        var content = await _policyService.ExportPoliciesToCsvAsync(filter);
        var fileName = $"Policies_{DateTime.UtcNow:yyyyMMddHHmmss}.csv";
        return File(content, "text/csv", fileName);
    }

    /// <summary>
    /// Get upcoming installments within the next N days (selectable: 7, 15, 30, 60, 90).
    /// </summary>
    [HttpGet("upcoming-installments")]
    public async Task<ActionResult<ApiResponse<List<UpcomingInstallmentDto>>>> GetUpcomingInstallments(
        [FromQuery] int daysAhead = 30)
    {
        var result = await _policyService.GetUpcomingInstallmentsAsync(daysAhead);
        return Ok(ApiResponse<List<UpcomingInstallmentDto>>.SuccessResponse(result,
            $"{result.Count} upcoming installments found."));
    }

    /// <summary>
    /// Send a test reminder email for a specific policy.
    /// </summary>
    [HttpPost("send-test-email")]
    public async Task<ActionResult<ApiResponse<bool>>> SendTestEmail([FromBody] SendTestEmailDto dto)
    {
        var result = await _policyService.SendTestReminderEmailAsync(dto.PolicyId, dto.RecipientEmail);
        return Ok(ApiResponse<bool>.SuccessResponse(result, "Test reminder email has been queued. It will be sent in the next scheduler cycle."));
    }
}

// ═══════════════════════════════════════════════════════════════
//  POLICY TYPES CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PolicyTypesController : ControllerBase
{
    private readonly IPolicyTypeService _service;

    public PolicyTypesController(IPolicyTypeService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PolicyTypeDto>>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(ApiResponse<List<PolicyTypeDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<PolicyTypeDto>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<PolicyTypeDto>.FailResponse("Policy type not found"));
        return Ok(ApiResponse<PolicyTypeDto>.SuccessResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PolicyTypeDto>>> Create([FromBody] PolicyTypeDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<PolicyTypeDto>.SuccessResponse(result, "Policy type created"));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<PolicyTypeDto>>> Update(int id, [FromBody] PolicyTypeDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<PolicyTypeDto>.SuccessResponse(result, "Policy type updated"));
    }
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<DashboardDto>>> GetDashboard([FromQuery] string? holderName = null)
    {
        var result = await _service.GetDashboardAsync(holderName);
        return Ok(ApiResponse<DashboardDto>.SuccessResponse(result));
    }

    /// <summary>
    /// Gets family-centric financial stats filtered by multiple members.
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats([FromQuery] string members = "All")
    {
        string[] selectedMembers;
        if (members == "All")
        {
            // This is a bit of a hack since I don't want to inject IFamilyMemberService here if possible,
            // but the requirement says "if members == 'All' get all".
            // For now, let's assume the frontend sends the list of names or "All".
            // I'll update the service to handle "All" internally or pass the array.
            selectedMembers = Array.Empty<string>(); 
        }
        else
        {
            selectedMembers = members.Split(',', StringSplitOptions.RemoveEmptyEntries);
        }

        var result = await _service.GetStatsAsync(selectedMembers);
        return Ok(ApiResponse<DashboardStatsDto>.SuccessResponse(result));
    }
}

// ═══════════════════════════════════════════════════════════════
//  FAMILY MEMBERS CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FamilyMembersController : ControllerBase
{
    private readonly IFamilyMemberService _service;

    public FamilyMembersController(IFamilyMemberService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<FamilyMemberDto>>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(ApiResponse<List<FamilyMemberDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<FamilyMemberDto>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<FamilyMemberDto>.FailResponse("Member not found"));
        return Ok(ApiResponse<FamilyMemberDto>.SuccessResponse(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<FamilyMemberDto>>> Create([FromBody] CreateFamilyMemberDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<FamilyMemberDto>.SuccessResponse(result, "Member created"));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<FamilyMemberDto>>> Update(int id, [FromBody] CreateFamilyMemberDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<FamilyMemberDto>.SuccessResponse(result, "Member updated"));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return Ok(ApiResponse<bool>.SuccessResponse(result, "Member deleted"));
    }

    /// <summary>
    /// Get all policies linked to a specific family member.
    /// </summary>
    [HttpGet("{id:int}/policies")]
    public async Task<ActionResult<ApiResponse<List<PolicyDto>>>> GetMemberPolicies(int id)
    {
        var result = await _service.GetPoliciesByMemberAsync(id);
        return Ok(ApiResponse<List<PolicyDto>>.SuccessResponse(result,
            $"{result.Count} policies found for member."));
    }
}

// ═══════════════════════════════════════════════════════════════
//  AUDIT LOGS CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _service;

    public AuditLogsController(IAuditLogService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AuditLogDto>>>> GetLogs(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetLogsAsync(page, pageSize);
        return Ok(ApiResponse<PagedResult<AuditLogDto>>.SuccessResponse(result));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<Dictionary<string, int>>>> GetSummary()
    {
        var result = await _service.GetAuditSummaryAsync();
        return Ok(ApiResponse<Dictionary<string, int>>.SuccessResponse(result));
    }
}

// ═══════════════════════════════════════════════════════════════
//  REMINDERS CONFIGURATION CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class RemindersController : ControllerBase
{
    private readonly IReminderService _service;

    public RemindersController(IReminderService service) => _service = service;

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse<List<PolicyReminderSettingDto>>>> GetSettings()
    {
        var result = await _service.GetSettingsAsync();
        return Ok(ApiResponse<List<PolicyReminderSettingDto>>.SuccessResponse(result));
    }

    [HttpPut("settings/{id:int}")]
    public async Task<ActionResult<ApiResponse<PolicyReminderSettingDto>>> UpdateSetting(int id, [FromBody] UpdateReminderSettingDto dto)
    {
        var result = await _service.UpdateSettingAsync(id, dto);
        return Ok(ApiResponse<PolicyReminderSettingDto>.SuccessResponse(result, "Reminder setting updated"));
    }

    [HttpGet("logs")]
    public async Task<ActionResult<ApiResponse<List<PolicyReminderEventDto>>>> GetLogs([FromQuery] int count = 20)
    {
        var result = await _service.GetRecentEventsAsync(count);
        return Ok(ApiResponse<List<PolicyReminderEventDto>>.SuccessResponse(result));
    }

    [HttpPost("run-scan")]
    public async Task<ActionResult<ApiResponse<int>>> RunScan()
    {
        var count = await _service.RunReminderScanAsync();
        return Ok(ApiResponse<int>.SuccessResponse(count, $"Scan completed. {count} new reminders created."));
    }

    [HttpPost("process-pending")]
    public async Task<ActionResult<ApiResponse<int>>> ProcessPending()
    {
        var count = await _service.ProcessPendingRemindersAsync();
        return Ok(ApiResponse<int>.SuccessResponse(count, $"Processing completed. {count} emails sent successfully."));
    }

    [HttpPost("manual")]
    public async Task<ActionResult<ApiResponse<bool>>> SendManual([FromBody] ManualReminderDto dto)
    {
        var success = await _service.SendManualReminderAsync(dto);
        if (success)
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Manual reminder sent successfully."));
        else
            return BadRequest(ApiResponse<bool>.FailResponse("Failed to send manual reminder."));
    }
}

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATIONS CONTROLLER (In-App Bell)
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service) => _service = service;

    private int? GetUserId() =>
        int.TryParse(User.FindFirst("UserId")?.Value, out var id) ? id : null;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<NotificationSummaryDto>>> GetNotifications()
    {
        var result = await _service.GetSummaryAsync(GetUserId());
        return Ok(ApiResponse<NotificationSummaryDto>.SuccessResponse(result));
    }

    [HttpPut("{id:int}/read")]
    public async Task<ActionResult> MarkRead(int id)
    {
        await _service.MarkAsReadAsync(id);
        return Ok(ApiResponse<bool>.SuccessResponse(true));
    }

    [HttpPut("read-all")]
    public async Task<ActionResult> MarkAllRead()
    {
        await _service.MarkAllReadAsync(GetUserId());
        return Ok(ApiResponse<bool>.SuccessResponse(true, "All notifications marked as read."));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Dismiss(int id)
    {
        await _service.DismissAsync(id);
        return Ok(ApiResponse<bool>.SuccessResponse(true));
    }
}

// ═══════════════════════════════════════════════════════════════
//  INVESTMENT FORECAST CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvestmentForecastController : ControllerBase
{
    private readonly IInvestmentForecastService _service;

    public InvestmentForecastController(IInvestmentForecastService service) => _service = service;

    /// <summary>
    /// Get full investment forecast for a fiscal year with monthly breakdown.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<InvestmentForecastDto>>> GetForecast(
        [FromQuery] int? year = null,
        [FromQuery] string members = "All")
    {
        var memberNames = members == "All" || string.IsNullOrEmpty(members)
            ? Array.Empty<string>()
            : members.Split(',', StringSplitOptions.RemoveEmptyEntries);

        var result = await _service.GetFullForecastAsync(year, memberNames);
        return Ok(ApiResponse<InvestmentForecastDto>.SuccessResponse(result,
            $"Forecast generated for FY {result.FiscalYear}-{(result.FiscalYear + 1) % 100:D2}"));
    }

    /// <summary>
    /// Preview the impact of adding a new policy on the current forecast.
    /// </summary>
    [HttpPost("impact")]
    public async Task<ActionResult<ApiResponse<ForecastImpactDto>>> GetForecastImpact(
        [FromBody] PolicyDto newPolicy,
        [FromQuery] string members = "All")
    {
        var memberNames = members == "All" || string.IsNullOrEmpty(members)
            ? Array.Empty<string>()
            : members.Split(',', StringSplitOptions.RemoveEmptyEntries);

        var result = await _service.GetForecastImpactAsync(newPolicy, memberNames);
        return Ok(ApiResponse<ForecastImpactDto>.SuccessResponse(result, result.ImpactSummary));
    }
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN CONTROLLER
// ═══════════════════════════════════════════════════════════════

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    /// <summary>
    /// Danger zone: Resets the database by wiping all user data and re-seeding.
    /// </summary>
    [HttpPost("reset-database")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetDatabase([FromServices] PolicyManager.API.Data.AppDbContext db)
    {
        using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            await Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteDeleteAsync(db.Payments);
            await Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteDeleteAsync(db.PolicyDocuments);
            await Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteDeleteAsync(db.PolicyReminderEvents);
            await Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteDeleteAsync(db.InAppNotifications);
            await Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteDeleteAsync(db.Policies.IgnoreQueryFilters());
            await Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteDeleteAsync(db.MutualFunds.IgnoreQueryFilters());
            await Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteDeleteAsync(db.FamilyMembers);
            await Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteDeleteAsync(db.PolicyReminderSettings);
            
            await transaction.CommitAsync();

            await PolicyManager.API.Data.AppDbContext.SeedDataAsync(db);

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Database has been successfully wiped and re-seeded."));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return BadRequest(ApiResponse<bool>.FailResponse($"Failed to reset database: {ex.Message}"));
        }
    }
}

