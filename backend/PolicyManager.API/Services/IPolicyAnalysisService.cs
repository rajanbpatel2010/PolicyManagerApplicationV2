using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

public interface IPolicyAnalysisService
{
    PolicyAnalysisResultDto CalculateBenefit(Policy policy);
    PolicyAnalysisResultDto CalculateBenefit(PolicyDto dto);
}
