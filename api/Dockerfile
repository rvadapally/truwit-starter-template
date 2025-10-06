FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    jq \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install --no-cache-dir yt-dlp

# Install c2patool (Linux x64 release)
RUN curl -L -o /usr/local/bin/c2patool https://github.com/contentauth/c2pa/releases/download/v2.2.0/c2patool-linux-x64 \
    && chmod +x /usr/local/bin/c2patool

# Create temp directory for downloads
RUN mkdir -p /tmp/truwit_dl && chmod 777 /tmp/truwit_dl

WORKDIR /app

# Copy published application
COPY ./publish/ ./

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Add startup script to log tool versions
RUN echo '#!/bin/bash\necho "=== Tool Versions ==="\necho "yt-dlp: $(yt-dlp --version)"\necho "c2patool: $(c2patool --version)"\necho "ffmpeg: $(ffmpeg -version | head -1)"\necho "==================="\nexec "$@"' > /usr/local/bin/startup.sh \
    && chmod +x /usr/local/bin/startup.sh

ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]
