using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManager.API.DTOs;
using PolicyManager.API.Services;
using System.Security.Claims;

namespace PolicyManager.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TaxController : ControllerBase
{
    private readonly ITaxIntelligenceService _taxService;

    public TaxController(ITaxIntelligenceService taxService)
    {
        _taxService = taxService;
    }

    [HttpGet("planning")]
    public async Task<ActionResult<ApiResponse<TaxIntelligenceDto>>> GetTaxPlanning()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var result = await _taxService.GetTaxPlanningAsync(userId);
        return Ok(result);
    }
}
