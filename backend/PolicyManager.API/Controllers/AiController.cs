using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManager.API.DTOs;
using PolicyManager.API.Services;
using System.Security.Claims;

namespace PolicyManager.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IGeminiOrchestratorService _aiService;

    public AiController(IGeminiOrchestratorService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("query")]
    public async Task<ActionResult<ApiResponse<string>>> QueryPortfolio([FromBody] string query)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(query)) return BadRequest("Query cannot be empty.");

        try
        {
            var response = await _aiService.QueryPortfolioAsync(query, userId);
            return Ok(ApiResponse<string>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.FailResponse(ex.Message));
        }
    }
}
