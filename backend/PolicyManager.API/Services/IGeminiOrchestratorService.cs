using PolicyManager.API.DTOs;

namespace PolicyManager.API.Services;

public interface IGeminiOrchestratorService
{
    Task<PolicyExtractionResultDto> ExtractPolicyDetailsAsync(byte[] fileBytes, string mimeType);
    Task<string> QueryPortfolioAsync(string query, int userId);
}
