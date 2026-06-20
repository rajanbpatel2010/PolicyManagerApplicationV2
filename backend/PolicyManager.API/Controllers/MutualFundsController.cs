using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PolicyManager.API.DTOs;
using PolicyManager.API.Services;

namespace PolicyManager.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MutualFundsController : ControllerBase
{
    private readonly IMutualFundService _mutualFundService;
    private readonly ILogger<MutualFundsController> _logger;

    public MutualFundsController(
        IMutualFundService mutualFundService,
        ILogger<MutualFundsController> logger)
    {
        _mutualFundService = mutualFundService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<MutualFundDto>>>> GetMutualFunds([FromQuery] MutualFundFilterDto filter)
    {
        try
        {
            var result = await _mutualFundService.GetMutualFundsAsync(filter);
            return Ok(ApiResponse<PagedResult<MutualFundDto>>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching Mutual Funds.");
            return StatusCode(500, ApiResponse<PagedResult<MutualFundDto>>.FailResponse("Internal server error occurred."));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<MutualFundDto>>> GetMutualFundById(int id)
    {
        try
        {
            var fund = await _mutualFundService.GetMutualFundByIdAsync(id);
            if (fund == null)
            {
                return NotFound(ApiResponse<MutualFundDto>.FailResponse("Mutual Fund investment not found."));
            }
            return Ok(ApiResponse<MutualFundDto>.SuccessResponse(fund));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Mutual Fund with ID {Id}", id);
            return StatusCode(500, ApiResponse<MutualFundDto>.FailResponse("Internal server error occurred."));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<MutualFundDto>>> CreateMutualFund([FromBody] CreateMutualFundDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<MutualFundDto>.FailResponse("Invalid payload data."));
            }

            var userId = GetCurrentUserId();
            var fund = await _mutualFundService.CreateMutualFundAsync(dto, userId);

            return CreatedAtAction(
                nameof(GetMutualFundById),
                new { id = fund.Id },
                ApiResponse<MutualFundDto>.SuccessResponse(fund, "Mutual Fund portfolio added successfully.")
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Mutual Fund portfolio record.");
            return StatusCode(500, ApiResponse<MutualFundDto>.FailResponse("Internal server error occurred."));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<MutualFundDto>>> UpdateMutualFund(int id, [FromBody] UpdateMutualFundDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<MutualFundDto>.FailResponse("Invalid payload data."));
            }

            var userId = GetCurrentUserId();
            var updated = await _mutualFundService.UpdateMutualFundAsync(id, dto, userId);
            if (updated == null)
            {
                return NotFound(ApiResponse<MutualFundDto>.FailResponse("Mutual Fund investment not found."));
            }

            return Ok(ApiResponse<MutualFundDto>.SuccessResponse(updated, "Mutual Fund portfolio updated successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Mutual Fund record with ID {Id}", id);
            return StatusCode(500, ApiResponse<MutualFundDto>.FailResponse("Internal server error occurred."));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteMutualFund(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var deleted = await _mutualFundService.DeleteMutualFundAsync(id, userId);
            if (!deleted)
            {
                return NotFound(ApiResponse<object>.FailResponse("Mutual Fund investment not found."));
            }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Mutual Fund record deleted successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Mutual Fund with ID {Id}", id);
            return StatusCode(500, ApiResponse<object>.FailResponse("Internal server error."));
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdStr, out int userId))
        {
            return userId;
        }
        return null;
    }
}
