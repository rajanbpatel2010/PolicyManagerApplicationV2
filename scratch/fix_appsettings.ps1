# Fix appsettings.json with correct values
$path = "C:\Program Files\PolicyManager\appsettings.json"
$json = Get-Content $path -Raw | ConvertFrom-Json

Write-Host "=== Before Fix ===" -ForegroundColor Yellow
Write-Host "Connection: $($json.ConnectionStrings.DefaultConnection)"
Write-Host "Kestrel URL: $($json.Kestrel.Endpoints.Http.Url)"

# Fix connection string - use named pipe for LocalDB compatibility
$json.ConnectionStrings.DefaultConnection = "Server=(localdb)\MSSQLLocalDB;Database=PolicyManagerDB;TrustServerCertificate=True;MultipleActiveResultSets=true;User ID=sa;Password=sys;"

# Fix Kestrel URL
$json.Kestrel.Endpoints.Http.Url = "http://*:5100"

# Write back
$json | ConvertTo-Json -Depth 100 | Set-Content $path -Encoding UTF8

Write-Host ""
Write-Host "=== After Fix ===" -ForegroundColor Green
$verify = Get-Content $path -Raw | ConvertFrom-Json
Write-Host "Connection: $($verify.ConnectionStrings.DefaultConnection)"
Write-Host "Kestrel URL: $($verify.Kestrel.Endpoints.Http.Url)"

# Check if LocalDB is available at all
Write-Host ""
Write-Host "=== LocalDB Instances ===" -ForegroundColor Cyan
& "sqllocaldb" info 2>&1

Write-Host ""
Write-Host "=== Checking LocalDB MSSQLLocalDB state ===" -ForegroundColor Cyan
& "sqllocaldb" info MSSQLLocalDB 2>&1
