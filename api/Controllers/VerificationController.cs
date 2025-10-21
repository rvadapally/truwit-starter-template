using Microsoft.AspNetCore.Mvc;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Interfaces;

namespace HumanProof.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[ApiExplorerSettings(IgnoreApi = true)]
public class VerificationController : ControllerBase
{
    private readonly IVerificationService _verificationService;
    private readonly ILogger<VerificationController> _logger;

    public VerificationController(
        IVerificationService verificationService,
        ILogger<VerificationController> logger)
    {
        _verificationService = verificationService;
        _logger = logger;
    }

    [HttpPost("upload")]
    [ProducesResponseType(typeof(ApiResponse<VerificationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<VerificationResultDto>>> UploadFile(
        [FromForm] VerificationRequestDto request)
    {
        try
        {
            if (request.File == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "File is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var result = await _verificationService.VerifyContentAsync(request);
            
            return Ok(new ApiResponse<VerificationResultDto>
            {
                Data = result,
                Success = true,
                Message = "File verified successfully",
                Status = StatusCodes.Status200OK
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while processing the file",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpPost("url")]
    [ProducesResponseType(typeof(ApiResponse<VerificationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<VerificationResultDto>>> VerifyUrl(
        [FromBody] VerificationRequestDto request)
    {
        _logger.LogInformation("Legacy verification endpoint disabled: url");
        return StatusCode(StatusCodes.Status410Gone, new ApiResponse<object>
        {
            Success = false,
            Message = "Legacy verification endpoints are disabled. Use v1/proofs/url or the new flows.",
            Status = StatusCodes.Status410Gone
        });
    }

    [HttpGet("proof/{proofId}")]
    [ProducesResponseType(typeof(ApiResponse<ProofDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ProofDetailsDto>>> GetProofDetails(string proofId)
    {
        _logger.LogInformation("Legacy verification endpoint disabled: proof details");
        return StatusCode(StatusCodes.Status410Gone, new ApiResponse<object>
        {
            Success = false,
            Message = "Legacy verification endpoints are disabled. Use v1/proofs/* endpoints.",
            Status = StatusCodes.Status410Gone
        });
    }

    [HttpGet("validate/{proofId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> ValidateProof(string proofId)
    {
        _logger.LogInformation("Legacy verification endpoint disabled: validate");
        return StatusCode(StatusCodes.Status410Gone, new ApiResponse<object>
        {
            Success = false,
            Message = "Legacy verification endpoints are disabled. Use v1/proofs/* endpoints.",
            Status = StatusCodes.Status410Gone
        });
    }
}
