namespace HumanProof.Api.Domain.Common;

/// <summary>
/// Provides DateTime values in Central Time Zone (Dallas, Texas)
/// </summary>
public static class DateTimeProvider
{
    private static readonly TimeZoneInfo CentralTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Central Standard Time");

    /// <summary>
    /// Gets the current DateTime in Central Time Zone (CST/CDT for Dallas, Texas)
    /// </summary>
    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, CentralTimeZone);

    /// <summary>
    /// Gets the current UTC DateTime
    /// </summary>
    public static DateTime UtcNow => DateTime.UtcNow;

    /// <summary>
    /// Converts UTC DateTime to Central Time
    /// </summary>
    public static DateTime ToCentralTime(DateTime utcDateTime)
    {
        if (utcDateTime.Kind != DateTimeKind.Utc)
        {
            utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        }
        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, CentralTimeZone);
    }

    /// <summary>
    /// Converts Central Time to UTC
    /// </summary>
    public static DateTime ToUtc(DateTime centralDateTime)
    {
        return TimeZoneInfo.ConvertTimeToUtc(centralDateTime, CentralTimeZone);
    }

    /// <summary>
    /// Gets timezone display name
    /// </summary>
    public static string TimeZoneName => CentralTimeZone.DisplayName;

    /// <summary>
    /// Gets timezone ID
    /// </summary>
    public static string TimeZoneId => CentralTimeZone.Id;
}

