using Microsoft.AspNetCore.Mvc;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Interfaces;

namespace HumanProof.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
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
        try
        {
            if (string.IsNullOrEmpty(request.Url))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "URL is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var result = await _verificationService.VerifyContentAsync(request);
            
            return Ok(new ApiResponse<VerificationResultDto>
            {
                Data = result,
                Success = true,
                Message = "URL verified successfully",
                Status = StatusCodes.Status200OK
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying URL: {Url}", request.Url);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while processing the URL",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpGet("proof/{proofId}")]
    [ProducesResponseType(typeof(ApiResponse<ProofDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ProofDetailsDto>>> GetProofDetails(string proofId)
    {
        try
        {
            var result = await _verificationService.GetProofDetailsAsync(proofId);
            
            if (result == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Proof not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            return Ok(new ApiResponse<ProofDetailsDto>
            {
                Data = result,
                Success = true,
                Message = "Proof details retrieved successfully",
                Status = StatusCodes.Status200OK
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving proof details for {ProofId}", proofId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while retrieving proof details",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpGet("validate/{proofId}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<bool>>> ValidateProof(string proofId)
    {
        try
        {
            var isValid = await _verificationService.ValidateProofAsync(proofId);
            
            return Ok(new ApiResponse<bool>
            {
                Data = isValid,
                Success = true,
                Message = isValid ? "Proof is valid" : "Proof is invalid",
                Status = StatusCodes.Status200OK
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating proof {ProofId}", proofId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while validating the proof",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }
}
