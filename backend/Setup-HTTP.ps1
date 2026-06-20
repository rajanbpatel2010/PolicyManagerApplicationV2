# Setup-HTTP.ps1
# This script fully automates the setup of the local environment using a dynamic IP.

# 1. Detect Local IP dynamically
$IP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi", "Ethernet" | Where-Object { $_.IPv4Address -notlike "169.*" -and $_.IPv4Address -ne "127.0.0.1" } | Select-Object -First 1).IPv4Address
if (-not $IP) { $IP = "127.0.0.1" }

Write-Host "Detected Local IP: $IP" -ForegroundColor Green

# 2. Cleanup Old SSL Certificates (to avoid confusion)
$CertName = "PolicyManagerSelfSigned"
Write-Host "--- 1. CLEANING UP SSL CERTIFICATES ---" -ForegroundColor Yellow
Get-ChildItem -Path "cert:\LocalMachine\My", "cert:\LocalMachine\Root" | Where-Object { $_.FriendlyName -eq $CertName -or $_.Subject -like "*CN=*" } | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "SSL Certificates cleaned." -ForegroundColor Green

# 3. Update Backend Config (appsettings.json)
Write-Host "`n--- 2. UPDATING BACKEND CONFIG ---" -ForegroundColor Cyan
$backendConfigPath = Join-Path $PSScriptRoot "PolicyManager.API\appsettings.json"
if (Test-Path $backendConfigPath) {
    $config = Get-Content $backendConfigPath | ConvertFrom-Json
    # Update CORS or other IP-based settings if they exist
    # $config.AllowedOrigins = "http://$IP:4200" # Example
    $config | ConvertTo-Json -Depth 10 | Set-Content $backendConfigPath
    Write-Host "Backend appsettings.json updated with IP: $IP" -ForegroundColor Green
}

# Configuration
$ApiPort = "5100"
$AppPort = "5100"

# 4. Update Frontend environment.prod.ts
Write-Host "`n--- 3. UPDATING FRONTEND ENVIRONMENT ---" -ForegroundColor Cyan
$frontendEnvPath = Join-Path $PSScriptRoot "..\frontend\src\environments\environment.prod.ts"
if (Test-Path $frontendEnvPath) {
    $envContent = "export const environment = {`n    production: true,`n    apiUrl: 'http://$IP:$ApiPort/api'`n};"
    Set-Content -Path $frontendEnvPath -Value $envContent
    Write-Host "Frontend environment.prod.ts updated to http://$IP:$ApiPort/api" -ForegroundColor Green
}

# 5. Automate IIS Binding (Optional - requires WebAdministration)
Write-Host "`n--- 4. IIS BINDING ---" -ForegroundColor Cyan
try {
    Import-Module WebAdministration -ErrorAction Stop
    $siteName = "PolicyAPI" # Update if your site name is different
    if (Get-Website -Name $siteName -ErrorAction SilentlyContinue) {
        # Check if binding exists
        $binding = Get-WebBinding -Name $siteName | Where-Object { $_.bindingInformation -like "*:$ApiPort:*" }
        if (-not $binding) {
            New-WebBinding -Name $siteName -Port $ApiPort -Protocol http -IPAddress "*"
            Write-Host "Created new IIS binding on port $ApiPort." -ForegroundColor Green
        } else {
            Write-Host "IIS binding on port $ApiPort already exists." -ForegroundColor Yellow
        }
    } else {
        Write-Host "IIS Site '$siteName' not found. Please configure manually." -ForegroundColor Gray
    }
} catch {
    Write-Host "Could not automate IIS. Please ensure port $ApiPort is open in IIS for $IP." -ForegroundColor Gray
}

Write-Host "`nSetup Complete!" -ForegroundColor Green
Write-Host "Next: Run 'npm run build' in frontend and rebuild your APK." -ForegroundColor Cyan
