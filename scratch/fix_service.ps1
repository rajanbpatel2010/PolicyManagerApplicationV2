# Must run as Administrator

$installPath = "C:\Program Files\PolicyManager"
$path = "$installPath\appsettings.json"

# Read raw JSON
$raw = Get-Content $path -Raw
$json = $raw | ConvertFrom-Json

Write-Host "=== Current State ===" -ForegroundColor Yellow
Write-Host "Connection: $($json.ConnectionStrings.DefaultConnection)"

# Show Kestrel section
Write-Host "Kestrel section:"
$json.Kestrel | ConvertTo-Json -Depth 10

# Fix 1: Ensure Kestrel URL is set (handle missing structure)
if (-not $json.Kestrel) {
    $json | Add-Member -MemberType NoteProperty -Name "Kestrel" -Value ([PSCustomObject]@{
        Endpoints = [PSCustomObject]@{
            Http = [PSCustomObject]@{ Url = "http://*:5100" }
        }
    })
} elseif (-not $json.Kestrel.Endpoints) {
    $json.Kestrel | Add-Member -MemberType NoteProperty -Name "Endpoints" -Value ([PSCustomObject]@{
        Http = [PSCustomObject]@{ Url = "http://*:5100" }
    })
} elseif (-not $json.Kestrel.Endpoints.Http) {
    $json.Kestrel.Endpoints | Add-Member -MemberType NoteProperty -Name "Http" -Value ([PSCustomObject]@{ Url = "http://*:5100" })
} elseif (-not ($json.Kestrel.Endpoints.Http | Get-Member -Name "Url" -ErrorAction SilentlyContinue)) {
    $json.Kestrel.Endpoints.Http | Add-Member -MemberType NoteProperty -Name "Url" -Value "http://*:5100"
} else {
    $json.Kestrel.Endpoints.Http.Url = "http://*:5100"
}

# Fix 2: Use named pipe for LocalDB (needed for service account)
# LocalDB instance pipe (get fresh each time)
$pipeOutput = & sqllocaldb info MSSQLLocalDB
$pipeLine = $pipeOutput | Where-Object { $_ -like "*Instance pipe name*" }
if ($pipeLine) {
    $pipeName = ($pipeLine -split ":\s+")[1].Trim()
    Write-Host "LocalDB pipe: $pipeName" -ForegroundColor Green
    $json.ConnectionStrings.DefaultConnection = "Server=$pipeName;Database=PolicyManagerDB;TrustServerCertificate=True;MultipleActiveResultSets=true;Integrated Security=True;"
} else {
    Write-Host "Could not get LocalDB pipe, keeping existing connection string" -ForegroundColor Yellow
}

# Write back
$json | ConvertTo-Json -Depth 100 | Set-Content $path -Encoding UTF8

Write-Host ""
Write-Host "=== After Fix ===" -ForegroundColor Green
$verify = Get-Content $path -Raw | ConvertFrom-Json
Write-Host "Connection: $($verify.ConnectionStrings.DefaultConnection)"
Write-Host "Kestrel URL: $($verify.Kestrel.Endpoints.Http.Url)"

# Fix 3: Change service to run as current user (not SYSTEM - LocalDB needs user context)
Write-Host ""
Write-Host "=== Fixing Service Account ===" -ForegroundColor Cyan
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
Write-Host "Current user: $currentUser" -ForegroundColor Yellow

# Stop service first
Write-Host "Stopping service..." -ForegroundColor Yellow
sc.exe stop PolicyManagerService | Out-Null
Start-Sleep -Seconds 2

# Change service to run as LocalSystem but with LocalDB workaround
# Better: configure service to run as current user
$password = Read-Host "Enter your Windows login password (needed to run service as $currentUser)" -AsSecureString
$cred = New-Object System.Management.Automation.PSCredential($currentUser, $password)
$plainPassword = $cred.GetNetworkCredential().Password

sc.exe config PolicyManagerService obj= "$currentUser" password= "$plainPassword"
Write-Host "Service account updated to: $currentUser" -ForegroundColor Green

# Start service
Write-Host ""
Write-Host "Starting service..." -ForegroundColor Cyan
sc.exe start PolicyManagerService
Start-Sleep -Seconds 5
sc.exe query PolicyManagerService
