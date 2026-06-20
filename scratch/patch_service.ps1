$path = 'C:\Program Files\PolicyManager\appsettings.json'
$json = Get-Content $path | ConvertFrom-Json
$json.ConnectionStrings.DefaultConnection = 'Server=(localdb)\MSSQLLocalDB;Database=PolicyManagerDB;TrustServerCertificate=True;MultipleActiveResultSets=true;Integrated Security=True;'
$json.JwtSettings.SecretKey = 'PolicyManager_Secure_Production_Key_2026_@#$!'
$json | ConvertTo-Json -Depth 10 | Set-Content $path -Encoding UTF8
Restart-Service PolicyManagerService -Force
Write-Host "Service Restarted Successfully"
