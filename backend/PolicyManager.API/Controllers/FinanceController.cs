using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManager.API.DTOs;
using PolicyManager.API.Services;
using System.Security.Claims;

namespace PolicyManager.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FinanceController : ControllerBase
{
    private readonly IIrrCalculatorService _irrService;
    private readonly MediatR.IMediator _mediator;

    public FinanceController(IIrrCalculatorService irrService, MediatR.IMediator mediator)
    {
        _irrService = irrService;
        _mediator = mediator;
    }

    [HttpGet("portfolio-irr")]
    public async Task<ActionResult<ApiResponse<List<IrrAnalysisDto>>>> GetPortfolioIrr()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

        try
        {
            var results = await _irrService.GetPortfolioIrrSummaryAsync(userId);
            return Ok(ApiResponse<List<IrrAnalysisDto>>.SuccessResponse(results));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<IrrAnalysisDto>>.FailResponse(ex.Message));
        }
    }

    [HttpGet("policy-irr/{id}")]
    public async Task<ActionResult<ApiResponse<IrrAnalysisDto>>> GetPolicyIrr(int id)
    {
        var result = await _mediator.Send(new Features.Finance.GetPolicyIrrQuery(id));
        if (!result.Success) return StatusCode(500, result);
        return Ok(result);
    }
}
