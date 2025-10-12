# Use the official .NET SDK image as a build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the API project file and restore dependencies
COPY api/*.csproj ./api/
RUN dotnet restore api/HumanProof.Api.csproj

# Copy the remaining API source code
COPY api/ ./api/
WORKDIR /src/api

# Publish the application
RUN dotnet publish HumanProof.Api.csproj -c Release -o /app

# Use the official .NET ASP.NET Core runtime image as the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
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

# Copy the published output from the build stage
COPY --from=build /app .

# Expose the port the app runs on
EXPOSE 8080

# Set the entry point for the application
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]
