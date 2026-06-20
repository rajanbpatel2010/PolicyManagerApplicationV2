# Setup-HTTPS.ps1
# This script CLEANS old certificates, creates a new one, and INSTALLS it locally for IIS and Android.

# Detect Local IP dynamically
$IP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi", "Ethernet" | Where-Object { $_.IPv4Address -notlike "169.*" -and $_.IPv4Address -ne "127.0.0.1" } | Select-Object -First 1).IPv4Address
if (-not $IP) { $IP = "127.0.0.1" }

Write-Host "Detected Local IP: $IP" -ForegroundColor Green
$CertName = "PolicyManagerSelfSigned"
$Password = "PolicyManager123!" | ConvertTo-SecureString -AsPlainText -Force

Write-Host "--- 1. CLEANING OLD CERTIFICATES ---" -ForegroundColor Yellow

# Remove from Personal Store
Get-ChildItem -Path "cert:\LocalMachine\My" | Where-Object { $_.FriendlyName -eq $CertName -or $_.Subject -like "*CN=$IP*" } | Remove-Item -Force -ErrorAction SilentlyContinue

# Remove from Trusted Root Store
Get-ChildItem -Path "cert:\LocalMachine\Root" | Where-Object { $_.FriendlyName -eq $CertName -or $_.Subject -like "*CN=$IP*" } | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup complete." -ForegroundColor Green

Write-Host "`n--- 2. GENERATING NEW CERTIFICATE FOR $IP ---" -ForegroundColor Cyan

# Create the certificate
$cert = New-SelfSignedCertificate -DnsName $IP -CertStoreLocation "cert:\LocalMachine\My" -FriendlyName $CertName -NotAfter (Get-Date).AddYears(5)

# Copy to Trusted Root Certification Authorities (so the PC trusts its own cert)
$rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
$rootStore.Open("ReadWrite")
$rootStore.Add($cert)
$rootStore.Close()

Write-Host "Certificate generated and installed in Local Machine Root." -ForegroundColor Green

Write-Host "`n--- 3. EXPORTING FILES ---" -ForegroundColor Cyan

# Export PFX for IIS
$pfxPath = Join-Path $PSScriptRoot "PolicyManagerCert.pfx"
$cert | Export-PfxCertificate -FilePath $pfxPath -Password $Password
Write-Host "Exported PFX for IIS: $pfxPath" -ForegroundColor Green

# Export CRT (Base64/PEM) for Android Phone
$crtPath = Join-Path $PSScriptRoot "PolicyManagerCert_Android.crt"
$certBase64 = [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
$pemContent = "-----BEGIN CERTIFICATE-----`n$certBase64`n-----END CERTIFICATE-----"
$pemContent | Out-File -FilePath $crtPath -Encoding ascii
Write-Host "Exported CRT for Android (PEM Format): $crtPath" -ForegroundColor Green

Write-Host "`n--- NEXT STEPS ---" -ForegroundColor Yellow
Write-Host "1. In IIS, update your site bindings to use the new '$CertName'."
Write-Host "2. Copy '$crtPath' to your phone."
Write-Host "3. ON PHONE: Settings > Security > Install a Certificate > CA CERTIFICATE."

Write-Host "`nDone!" -ForegroundColor Cyan
