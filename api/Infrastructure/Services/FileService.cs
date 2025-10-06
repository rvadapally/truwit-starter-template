using HumanProof.Api.Domain.Interfaces;
using System.Text;

namespace HumanProof.Api.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FileService> _logger;
    private readonly string _uploadPath;

    public FileService(HttpClient httpClient, ILogger<FileService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _uploadPath = configuration["FileUpload:Path"] ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        
        // Ensure upload directory exists
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<Stream> DownloadFromUrlAsync(string url)
    {
        try
        {
            _logger.LogInformation("Downloading file from URL: {Url}", url);
            
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStreamAsync();
            return content;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file from URL: {Url}", url);
            throw;
        }
    }

    public async Task<string> SaveFileAsync(Stream content, string fileName)
    {
        try
        {
            var filePath = Path.Combine(_uploadPath, fileName);
            
            using var fileStream = new FileStream(filePath, FileMode.Create);
            await content.CopyToAsync(fileStream);
            
            _logger.LogInformation("File saved successfully: {FilePath}", filePath);
            return filePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving file: {FileName}", fileName);
            throw;
        }
    }

    public async Task<Stream> GetFileAsync(string fileName)
    {
        var filePath = Path.Combine(_uploadPath, fileName);
        
        if (!File.Exists(filePath))
            throw new FileNotFoundException($"File not found: {fileName}");
        
        return new FileStream(filePath, FileMode.Open, FileAccess.Read);
    }

    public async Task DeleteFileAsync(string fileName)
    {
        var filePath = Path.Combine(_uploadPath, fileName);
        
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            _logger.LogInformation("File deleted: {FilePath}", filePath);
        }
    }

    public async Task<bool> IsValidVideoFileAsync(string fileName)
    {
        var validExtensions = new[] { ".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v" };
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return validExtensions.Contains(extension);
    }

    public async Task<bool> IsValidImageFileAsync(string fileName)
    {
        var validExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return validExtensions.Contains(extension);
    }
}
