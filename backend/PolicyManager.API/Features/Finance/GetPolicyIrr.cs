using MediatR;
using PolicyManager.API.DTOs;
using PolicyManager.API.Services;

namespace PolicyManager.API.Features.Finance;

public record GetPolicyIrrQuery(int PolicyId) : IRequest<ApiResponse<IrrAnalysisDto>>;

public class GetPolicyIrrHandler : IRequestHandler<GetPolicyIrrQuery, ApiResponse<IrrAnalysisDto>>
{
    private readonly IIrrCalculatorService _irrService;

    public GetPolicyIrrHandler(IIrrCalculatorService irrService)
    {
        _irrService = irrService;
    }

    public async Task<ApiResponse<IrrAnalysisDto>> Handle(GetPolicyIrrQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _irrService.GetPolicyIrrAsync(request.PolicyId);
            return ApiResponse<IrrAnalysisDto>.SuccessResponse(result);
        }
        catch (Exception ex)
        {
            return ApiResponse<IrrAnalysisDto>.FailResponse(ex.Message);
        }
    }
}
