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
    ffmpeg -version

COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]