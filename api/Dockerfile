# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["HumanProof.Api.csproj", "."]
RUN dotnet restore "HumanProof.Api.csproj"
COPY . .
RUN dotnet publish "HumanProof.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install system dependencies (yt-dlp and ffmpeg only - using hosted C2PA verifier)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    ffmpeg \
    curl \
    ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/* && \
    yt-dlp --version && \
    ffmpeg -version && \
    mkdir -p /tmp/truwit_dl && chmod 777 /tmp/truwit_dl && \
    mkdir -p /app/data && chmod 777 /app/data

COPY --from=build /app/publish .

# Copy YouTube cookies for yt-dlp authentication (bypasses bot detection)
COPY cookies.txt /app/cookies.txt
RUN chmod 644 /app/cookies.txt

EXPOSE 8080
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]