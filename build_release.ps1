$ErrorActionPreference = "Stop"

$solutionDir = "e:\Data\Code\AIProjects\PolicyManagerApplication\PolicyManagerApplication\PolicyManagerApp"
$frontendDir = "$solutionDir\frontend"
$backendDir = "$solutionDir\backend\PolicyManager.API"
$publishDir = "$solutionDir\publish"

Write-Host "========================================="
Write-Host " Policy Manager - Production Build Script "
Write-Host "========================================="
Write-Host ""

# 0. Increment Build Version
$versionFile = "$solutionDir\version.ini"
$newBuildNum = "0"
if (Test-Path $versionFile) {
    $content = Get-Content $versionFile
    $newContent = @()
    foreach ($line in $content) {
        if ($line -like "Build=*") {
            $buildNum = [int]($line.Split("=")[1])
            $newBuildNum = $buildNum + 1
            $newContent += "Build=$newBuildNum"
            Write-Host "--> Incrementing Build Version: $buildNum -> $newBuildNum" -ForegroundColor Yellow
        }
        else {
            $newContent += $line
        }
    }
    $newContent | Set-Content $versionFile
}

# 1. Clean old publish
if (Test-Path $publishDir) {
    Remove-Item -Recurse -Force $publishDir -ErrorAction Ignore
}
New-Item -ItemType Directory -Path $publishDir -Force | Out-Null

# 2. Build Angular Frontend
Write-Host "--> Building Angular Frontend (Production)..." -ForegroundColor Cyan
Set-Location $frontendDir
npm install
npm run build -- --configuration=production

# 3. Copy Frontend to Backend wwwroot
$wwwroot = "$backendDir\wwwroot"
if (Test-Path $wwwroot) {
    Remove-Item -Recurse -Force $wwwroot
}
New-Item -ItemType Directory -Path $wwwroot | Out-Null

# Handle Angular 17+ browser folder if it exists
$distPath = "$frontendDir\dist\policy-manager"
if (Test-Path "$distPath\browser") {
    Copy-Item -Path "$distPath\browser\*" -Destination $wwwroot -Recurse -Force
}
else {
    Copy-Item -Path "$distPath\*" -Destination $wwwroot -Recurse -Force
}

# 4. Build .NET Backend (Self-Contained)
Write-Host "--> Publishing .NET Backend (win-x64 Self-Contained)..." -ForegroundColor Cyan
Set-Location $backendDir
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o $publishDir

Write-Host ""
Write-Host "========================================="
Write-Host " Build Complete!" -ForegroundColor Green
Write-Host " Published files are in: $publishDir"
Write-Host "========================================="

# 5. Compile Inno Setup Installer
Write-Host ""
Write-Host "--> Compiling Inno Setup Installer..." -ForegroundColor Cyan
$isccPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (Test-Path $isccPath) {
    & $isccPath "$solutionDir\installer.iss"
    Write-Host ""
    Write-Host "========================================="
    Write-Host " Installer Generated Successfully!" -ForegroundColor Green
    Write-Host " Location: $solutionDir\installer"
    Write-Host "========================================="

    # 6. Run Installer and Open Browser
    Write-Host ""
    Write-Host "--> Starting Installation..." -ForegroundColor Cyan
    $version = "1.1.0"
    $setupExe = "$solutionDir\installer\PolicyManager_Setup_v$version.$newBuildNum.exe"
    
    if (Test-Path $setupExe) {
        Write-Host "--> Launching: $setupExe" -ForegroundColor Yellow
        Start-Process $setupExe -Wait
        
        Write-Host "--> Installation complete. Detecting configuration..." -ForegroundColor Cyan
        
        # Determine installation path (default to Program Files\PolicyManager)
        $installPath = "C:\Program Files\PolicyManager"
        if (-not (Test-Path $installPath)) {
            $installPath = "C:\Program Files (x86)\PolicyManager"
        }
        
        $port = "5100" # Standard .NET default fallback
        if (Test-Path "$installPath\appsettings.json") {
            try {
                $settings = Get-Content "$installPath\appsettings.json" | ConvertFrom-Json
                if ($settings.Kestrel.Endpoints.Http.Url) {
                    $urlConfig = $settings.Kestrel.Endpoints.Http.Url
                    if ($urlConfig -match ":(\d+)") {
                        $port = $matches[1]
                        Write-Host "--> Detected Port: $port" -ForegroundColor Yellow
                    }
                }
            }
            catch {
                Write-Warning "Could not parse appsettings.json for port detection."
            }
        }
        
        # Get machine IP (prioritize Wi-Fi/Ethernet)
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match "Wi-Fi|Ethernet|Local" } | Select-Object -First 1).IPAddress
        if (-not $ip) { $ip = "localhost" }
        
        # Use machine IP for network access if detected
        $url = "http://${ip}:$port"
        
        Write-Host "--> Opening Policy Manager: $url" -ForegroundColor Green
        Start-Process "chrome.exe" $url -ErrorAction SilentlyContinue
        if ($LASTEXITCODE -ne 0) {
            Start-Process $url # Fallback to default browser
        }
    }
    else {
        Write-Error "Setup file not found: $setupExe"
    }
}
else {
    Write-Warning "Inno Setup Compiler (ISCC.exe) not found at $isccPath. Skipping installer generation."
}

# 7. Return to project root
Set-Location $solutionDir
Write-Host "--> Process Finished. Ready for use." -ForegroundColor Cyan

