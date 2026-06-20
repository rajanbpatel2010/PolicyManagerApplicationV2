using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

public interface ITaxIntelligenceService
{
    Task<ApiResponse<TaxIntelligenceDto>> GetTaxPlanningAsync(int userId);
}
