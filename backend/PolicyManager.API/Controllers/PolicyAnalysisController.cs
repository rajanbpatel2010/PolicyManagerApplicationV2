using Microsoft.AspNetCore.Mvc;
using PolicyManager.API.DTOs;
using PolicyManager.API.Services;
using Microsoft.AspNetCore.Authorization;

namespace PolicyManager.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PolicyAnalysisController : ControllerBase
{
    private readonly IPolicyAnalysisService _analysisService;
    private readonly IPolicyService _policyService;

    public PolicyAnalysisController(IPolicyAnalysisService analysisService, IPolicyService policyService)
    {
        _analysisService = analysisService;
        _policyService = policyService;
    }

    /// <summary>
    /// Calculates benefits for an existing policy by its ID.
    /// </summary>
    [HttpGet("calculate/{id}")]
    public async Task<ActionResult<ApiResponse<PolicyAnalysisResultDto>>> CalculateByPolicyIdAsync(int id)
    {
        var policyDto = await _policyService.GetPolicyByIdAsync(id);
        if (policyDto == null)
            return NotFound(ApiResponse<PolicyAnalysisResultDto>.FailResponse("Policy not found."));

        var result = _analysisService.CalculateBenefit(policyDto);
        return Ok(ApiResponse<PolicyAnalysisResultDto>.SuccessResponse(result));
    }

    /// <summary>
    /// Calculates benefits for a provided policy structure (useful for 'What If' scenarios).
    /// </summary>
    [HttpPost("analyze")]
    public ActionResult<ApiResponse<PolicyAnalysisResultDto>> AnalyzePolicyStructure([FromBody] PolicyDto dto)
    {
        if (dto == null)
            return BadRequest(ApiResponse<PolicyAnalysisResultDto>.FailResponse("Invalid policy data."));

        var result = _analysisService.CalculateBenefit(dto);
        return Ok(ApiResponse<PolicyAnalysisResultDto>.SuccessResponse(result));
    }
}
