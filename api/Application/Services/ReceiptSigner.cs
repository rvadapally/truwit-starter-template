using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using HumanProof.Api.Application.DTOs;
using NSec.Cryptography;

namespace HumanProof.Api.Application.Services;

public interface IReceiptSigner
{
    Task<(string signature, string publicKey)> SignReceiptAsync(object receiptData, CancellationToken cancellationToken = default);
    Task<bool> VerifyReceiptAsync(object receiptData, string signature, string publicKey, CancellationToken cancellationToken = default);
}

public class ReceiptSigner : IReceiptSigner
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ReceiptSigner> _logger;
    private readonly Key _signingKey;

    public ReceiptSigner(IConfiguration configuration, ILogger<ReceiptSigner> logger)
    {
        _configuration = configuration;
        _logger = logger;

        // Load or generate Ed25519 signing key
        var keyBytes = LoadOrGenerateSigningKey();
        _signingKey = Key.Import(SignatureAlgorithm.Ed25519, keyBytes, KeyBlobFormat.RawPrivateKey);
    }

    public async Task<(string signature, string publicKey)> SignReceiptAsync(object receiptData, CancellationToken cancellationToken = default)
    {
        try
        {
            var canonicalJson = await CreateCanonicalJsonAsync(receiptData);
            var messageBytes = Encoding.UTF8.GetBytes(canonicalJson);

            var signature = SignatureAlgorithm.Ed25519.Sign(_signingKey, messageBytes);
            var publicKey = _signingKey.PublicKey.Export(KeyBlobFormat.RawPublicKey);

            var signatureBase64 = Convert.ToBase64String(signature);
            var publicKeyBase64 = Convert.ToBase64String(publicKey);

            _logger.LogDebug("Signed receipt data with Ed25519");
            return (signatureBase64, publicKeyBase64);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error signing receipt data");
            throw;
        }
    }

    public async Task<bool> VerifyReceiptAsync(object receiptData, string signature, string publicKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var canonicalJson = await CreateCanonicalJsonAsync(receiptData);
            var messageBytes = Encoding.UTF8.GetBytes(canonicalJson);

            var signatureBytes = Convert.FromBase64String(signature);
            var publicKeyBytes = Convert.FromBase64String(publicKey);

            var key = PublicKey.Import(SignatureAlgorithm.Ed25519, publicKeyBytes, KeyBlobFormat.RawPublicKey);
            return SignatureAlgorithm.Ed25519.Verify(key, messageBytes, signatureBytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying receipt data");
            return false;
        }
    }

    private async Task<string> CreateCanonicalJsonAsync(object obj)
    {
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        return await Task.Run(() => JsonSerializer.Serialize(obj, jsonOptions));
    }

    private byte[] LoadOrGenerateSigningKey()
    {
        var keyPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "signing.key");

        if (File.Exists(keyPath))
        {
            _logger.LogInformation("Loading existing signing key from {KeyPath}", keyPath);
            return File.ReadAllBytes(keyPath);
        }

        _logger.LogInformation("Generating new Ed25519 signing key");
        var keyCreationParameters = new KeyCreationParameters { ExportPolicy = KeyExportPolicies.AllowPlaintextExport };
        var key = Key.Create(SignatureAlgorithm.Ed25519, keyCreationParameters);
        var keyBytes = key.Export(KeyBlobFormat.RawPrivateKey);

        // Save key for future use
        File.WriteAllBytes(keyPath, keyBytes);
        _logger.LogWarning("New signing key saved to {KeyPath}. Keep this file secure!", keyPath);

        return keyBytes;
    }
}
