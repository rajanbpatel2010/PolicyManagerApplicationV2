$path = "C:\Program Files\PolicyManager\appsettings.json"
$json = Get-Content $path -Raw | ConvertFrom-Json

Write-Host "Current connection string:" -ForegroundColor Yellow
Write-Host $json.ConnectionStrings.DefaultConnection

Write-Host ""
Write-Host "Current Kestrel URL:" -ForegroundColor Yellow  
Write-Host $json.Kestrel.Endpoints.Http.Url

Write-Host ""
Write-Host "SQL Server name in conn string:" -ForegroundColor Yellow
if ($json.ConnectionStrings.DefaultConnection -match "Server=([^;]+)") {
    Write-Host $matches[1]
}
