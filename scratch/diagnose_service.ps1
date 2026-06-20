# Check service status
Write-Host "=== Service Status ===" -ForegroundColor Cyan
sc.exe query PolicyManagerService

# Check service binary path
Write-Host ""
Write-Host "=== Service Binary Path ===" -ForegroundColor Cyan
sc.exe qc PolicyManagerService

# Check Windows Event Log for service errors
Write-Host ""
Write-Host "=== Application Event Log (PolicyManager) ===" -ForegroundColor Cyan
Get-EventLog -LogName Application -Source "*PolicyManager*" -Newest 10 -ErrorAction SilentlyContinue | Format-List TimeGenerated, EntryType, Message

# Check System Event Log for service control manager errors
Write-Host ""
Write-Host "=== Service Control Manager Errors ===" -ForegroundColor Cyan
Get-EventLog -LogName System -Source "Service Control Manager" -Newest 10 -ErrorAction SilentlyContinue | Where-Object { $_.Message -like "*PolicyManager*" } | Format-List TimeGenerated, EntryType, Message

# Check install path
Write-Host ""
Write-Host "=== Install Directory ===" -ForegroundColor Cyan
$installPaths = @("C:\Program Files\PolicyManager", "C:\Program Files (x86)\PolicyManager")
foreach ($installPath in $installPaths) {
    if (Test-Path $installPath) {
        Write-Host "Found at: $installPath" -ForegroundColor Green
        Get-ChildItem $installPath | Select-Object Name, Length, LastWriteTime
        
        # Check appsettings.json
        $settingsFile = "$installPath\appsettings.json"
        if (Test-Path $settingsFile) {
            Write-Host ""
            Write-Host "=== appsettings.json ===" -ForegroundColor Cyan
            Get-Content $settingsFile
        }

        # Check app logs
        $logDir = "$installPath\Logs"
        if (Test-Path $logDir) {
            Write-Host ""
            Write-Host "=== App Logs (latest) ===" -ForegroundColor Cyan
            $latestLog = Get-ChildItem $logDir -Filter "*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($latestLog) {
                Write-Host "Log file: $($latestLog.FullName)" -ForegroundColor Yellow
                Get-Content $latestLog.FullName | Select-Object -Last 50
            }
        }
    }
}

# Try to manually start and capture error
Write-Host ""
Write-Host "=== Attempting Manual Start ===" -ForegroundColor Cyan
$result = sc.exe start PolicyManagerService 2>&1
Write-Host $result
