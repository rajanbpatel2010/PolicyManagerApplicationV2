try {
    Stop-Service PolicyManagerService -Force -ErrorAction SilentlyContinue
    $path = 'C:\Program Files\PolicyManager\appsettings.json'
    $content = Get-Content $path -Raw
    $content = $content -replace '\[STORED_IN_ENV_OR_USER_SECRETS\]', 'PolicyManagerSuperSecretKeyForJwtAuthentication2026_VeryLongKey'
    $content = $content -replace 'Server=\(localdb\)\\MSSQLLocalDB;Database=PolicyManagerDB;TrustServerCertificate=True;MultipleActiveResultSets=true;User ID=sa;Password=sys;', 'Server=(localdb)\MSSQLLocalDB;Database=PolicyManagerDB;TrustServerCertificate=True;MultipleActiveResultSets=true;Integrated Security=True;'
    Set-Content -Path $path -Value $content -Encoding UTF8
    Start-Service PolicyManagerService
    Write-Host "SUCCESS! The service was patched and started." -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "Press any key to close..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
