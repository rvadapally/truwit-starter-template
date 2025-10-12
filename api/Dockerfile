# Use the official .NET 8 runtime as the base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Use the .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["HumanProof.Api.csproj", "."]
RUN dotnet restore "HumanProof.Api.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "HumanProof.Api.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "HumanProof.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Create the final runtime image
FROM base AS final
WORKDIR /app

# Install system dependencies: yt-dlp, ffmpeg, c2patool, python3, and curl
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    wget \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && wget -q https://github.com/contentauth/c2patool/releases/latest/download/c2patool-linux-x64.tar.gz -O /tmp/c2patool.tar.gz \
    && tar -xzf /tmp/c2patool.tar.gz -C /tmp \
    && mv /tmp/c2patool /usr/local/bin/c2patool \
    && chmod a+rx /usr/local/bin/c2patool \
    && rm /tmp/c2patool.tar.gz \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN yt-dlp --version && ffmpeg -version && c2patool --version

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]