using PolicyManager.API.DTOs;

namespace PolicyManager.API.Services;

public interface IIrrCalculatorService
{
    Task<IrrAnalysisDto> GetPolicyIrrAsync(int policyId);
    Task<List<IrrAnalysisDto>> GetPortfolioIrrSummaryAsync(int userId);
}
