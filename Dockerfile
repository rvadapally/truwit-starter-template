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

# Copy the published output from the build stage
COPY --from=build /app .

# Expose the port the app runs on
EXPOSE 8080

# Set the entry point for the application
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]
