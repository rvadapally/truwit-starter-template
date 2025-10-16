namespace HumanProof.Api.Domain.Exceptions;

/// <summary>
/// Exception thrown when YouTube cookie authentication fails
/// </summary>
public class YouTubeCookieException : Exception
{
    public YouTubeCookieException(string message) : base(message)
    {
    }

    public YouTubeCookieException(string message, Exception inner) : base(message, inner)
    {
    }
}

