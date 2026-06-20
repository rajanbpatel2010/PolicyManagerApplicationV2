try {
    Stop-Service PolicyManagerService -Force -ErrorAction SilentlyContinue
    $path = 'C:\Program Files\PolicyManager\appsettings.json'
    $json = Get-Content $path | ConvertFrom-Json
    $json.ConnectionStrings.DefaultConnection = 'Server=(localdb)\MSSQLLocalDB;Database=PolicyManagerDB;TrustServerCertificate=True;MultipleActiveResultSets=true;Integrated Security=True;'
    $json.JwtSettings.SecretKey = 'PolicyManagerSuperSecretKeyForJwtAuthentication2026_VeryLongKey'
    $json | ConvertTo-Json -Depth 10 | Set-Content $path -Encoding UTF8
    Start-Service PolicyManagerService
    Write-Host "SUCCESS! The service was patched and started." -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "Press any key to close..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
