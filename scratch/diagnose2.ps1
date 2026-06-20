$installPath = "C:\Program Files\PolicyManager"
if (-not (Test-Path $installPath)) { $installPath = "C:\Program Files (x86)\PolicyManager" }

Write-Host "Install path: $installPath" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== appsettings.json ===" -ForegroundColor Cyan
$settingsPath = "$installPath\appsettings.json"
if (Test-Path $settingsPath) {
    Get-Content $settingsPath
} else {
    Write-Host "appsettings.json NOT FOUND at $settingsPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== SQL Server Services ===" -ForegroundColor Cyan
Get-Service -Name "MSSQL*" -ErrorAction SilentlyContinue | Select-Object Name, Status, DisplayName
Get-Service -Name "SQLBrowser" -ErrorAction SilentlyContinue | Select-Object Name, Status, DisplayName

Write-Host ""
Write-Host "=== Latest App Log (last 40 lines) ===" -ForegroundColor Cyan
$logDir = "$installPath\Logs"
if (Test-Path $logDir) {
    $latest = Get-ChildItem $logDir -Filter "*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
        Write-Host "File: $($latest.FullName)" -ForegroundColor Yellow
        Get-Content $latest.FullName | Select-Object -Last 40
    }
} else {
    Write-Host "No Logs directory found" -ForegroundColor Red
}
