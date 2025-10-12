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

# Install system dependencies in one layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    ffmpeg \
    curl \
    wget \
    ca-certificates && \
    # Install yt-dlp
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    # Install c2patool
    wget -q https://github.com/contentauth/c2patool/releases/latest/download/c2patool-linux-x64.tar.gz -O /tmp/c2patool.tar.gz && \
    tar -xzf /tmp/c2patool.tar.gz -C /tmp && \
    mv /tmp/c2patool /usr/local/bin/c2patool && \
    chmod +x /usr/local/bin/c2patool && \
    rm -rf /tmp/c2patool.tar.gz /var/lib/apt/lists/* && \
    # Verify installations
    yt-dlp --version && \
    ffmpeg -version && \
    c2patool --version

COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]