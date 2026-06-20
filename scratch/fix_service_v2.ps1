# Run as Administrator
# This script fixes the Kestrel URL in appsettings.json and changes the service to run as the current interactive user

$installPath = "C:\Program Files\PolicyManager"
$settingsPath = "$installPath\appsettings.json"

# ── Step 1: Fix appsettings.json ────────────────────────────────────────────
Write-Host "=== Fixing appsettings.json ===" -ForegroundColor Cyan

$raw = Get-Content $settingsPath -Raw

# Inject Kestrel URL via string replacement if the property is missing
# ConvertFrom-Json and back preserves structure better with manual node injection
$json = $raw | ConvertFrom-Json

# Ensure Kestrel > Endpoints > Http > Url exists
if (-not $json.PSObject.Properties['Kestrel']) {
    $json | Add-Member -NotePropertyName 'Kestrel' -NotePropertyValue ([PSCustomObject]@{
        Endpoints = [PSCustomObject]@{
            Http = [PSCustomObject]@{ Url = 'http://*:5100' }
        }
    })
} elseif (-not $json.Kestrel.PSObject.Properties['Endpoints']) {
    $json.Kestrel | Add-Member -NotePropertyName 'Endpoints' -NotePropertyValue ([PSCustomObject]@{
        Http = [PSCustomObject]@{ Url = 'http://*:5100' }
    })
} elseif (-not $json.Kestrel.Endpoints.PSObject.Properties['Http']) {
    $json.Kestrel.Endpoints | Add-Member -NotePropertyName 'Http' -NotePropertyValue ([PSCustomObject]@{ Url = 'http://*:5100' })
} elseif (-not $json.Kestrel.Endpoints.Http.PSObject.Properties['Url']) {
    $json.Kestrel.Endpoints.Http | Add-Member -NotePropertyName 'Url' -NotePropertyValue 'http://*:5100'
} else {
    $json.Kestrel.Endpoints.Http.Url = 'http://*:5100'
}

$json | ConvertTo-Json -Depth 100 | Set-Content $settingsPath -Encoding UTF8
Write-Host "  Kestrel URL set to: http://*:5100" -ForegroundColor Green

# Verify
$verify = Get-Content $settingsPath -Raw | ConvertFrom-Json
Write-Host "  Connection: $($verify.ConnectionStrings.DefaultConnection)"
Write-Host "  Kestrel URL: $($verify.Kestrel.Endpoints.Http.Url)"

# ── Step 2: Change service to run as current logged-in user ─────────────────
Write-Host ""
Write-Host "=== Changing Service Account ===" -ForegroundColor Cyan

# Get the current interactive user
$loggedInUser = (Get-WmiObject -Class Win32_ComputerSystem).UserName
Write-Host "  Logged-in user: $loggedInUser" -ForegroundColor Yellow

$pass = Read-Host "  Enter Windows password for '$loggedInUser'" -AsSecureString
$plainPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass)
)

sc.exe stop PolicyManagerService | Out-Null
Start-Sleep -Seconds 2

$result = sc.exe config PolicyManagerService obj= "$loggedInUser" password= "$plainPass"
Write-Host "  sc.exe config result: $result" -ForegroundColor Cyan

# ── Step 3: Start service ────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== Starting Service ===" -ForegroundColor Cyan
sc.exe start PolicyManagerService
Start-Sleep -Seconds 6

$state = sc.exe query PolicyManagerService
Write-Host $state

if ($state -like "*RUNNING*") {
    Write-Host ""
    Write-Host "SUCCESS! Service is running." -ForegroundColor Green
    Write-Host "Open: http://localhost:5100" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Service still not running. Check logs at: $installPath\Logs\" -ForegroundColor Red
}
