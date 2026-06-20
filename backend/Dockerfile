# Use the official .NET SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy the solution and project files
COPY ["PolicyManager.API/PolicyManager.API.csproj", "PolicyManager.API/"]
# If tests are included in the sln, we might want to copy them too, or just restore the API project directly.
RUN dotnet restore "PolicyManager.API/PolicyManager.API.csproj"

# Copy the rest of the source code
COPY . .
WORKDIR "/app/PolicyManager.API"
RUN dotnet build "PolicyManager.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PolicyManager.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official ASP.NET Core runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port 8080 (Render's default)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "PolicyManager.API.dll"]
