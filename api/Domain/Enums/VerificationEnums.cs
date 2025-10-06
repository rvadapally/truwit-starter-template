namespace HumanProof.Api.Domain.Enums;

public enum LicenseType
{
    CreatorOwned = 0,
    BrandOwned = 1,
    Public = 2
}

public enum VerificationStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3
}

public enum HashAlgorithm
{
    SHA256 = 0,
    SHA512 = 1,
    MD5 = 2
}
