using System.Threading.Tasks;
using PolicyManager.API.DTOs;

namespace PolicyManager.API.Services;

public interface IMutualFundService
{
    Task<PagedResult<MutualFundDto>> GetMutualFundsAsync(MutualFundFilterDto filter);
    Task<MutualFundDto?> GetMutualFundByIdAsync(int id);
    Task<MutualFundDto> CreateMutualFundAsync(CreateMutualFundDto dto, int? userId);
    Task<MutualFundDto?> UpdateMutualFundAsync(int id, UpdateMutualFundDto dto, int? userId);
    Task<bool> DeleteMutualFundAsync(int id, int? userId);
}
