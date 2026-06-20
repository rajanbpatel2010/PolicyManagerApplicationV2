#define MyAppVersion "1.1.0"
#define BuildNumFile "e:\Data\Code\AIProjects\PolicyManagerApplication\PolicyManagerApplication\PolicyManagerApp\version.ini"
#define NewBuildNum ReadIni(BuildNumFile, "Version", "Build", "0")

[Setup]
AppName=Policy Manager
AppVersion={#MyAppVersion}.{#NewBuildNum}
DefaultDirName={commonpf64}\PolicyManager
DefaultGroupName=Policy Manager
OutputDir=installer
OutputBaseFilename=PolicyManager_Setup_v{#MyAppVersion}.{#NewBuildNum}
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible

[Files]
; Copy all published files from the build process
Source: "publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Run]
; (Optional) Silent Install of SQL Server Express if included alongside the installer
; Place SQLEXPR_x64_ENU.exe in a "prerequisites" folder next to this setup file.
; Filename: "{src}\prerequisites\SQLEXPR_x64_ENU.exe"; Parameters: "/qs /IACCEPTSQLSERVERLICENSETERMS /ACTION=install /FEATURES=SQL /INSTANCENAME=SQLEXPRESS /SQLSVCACCOUNT=""NT AUTHORITY\Network Service"" /SQLSYSADMINACCOUNTS=""BUILTIN\ADMINISTRATORS"" /TCPENABLED=1 /NPENABLED=1"; Check: CheckIfSQLIsNotInstalled; Flags: waituntilterminated

; Create and start the Windows service registered as the current user (supports LocalDB)
Filename: "{sys}\sc.exe"; Parameters: "create PolicyManagerService binPath= ""{app}\PolicyManager.API.exe"" start= auto obj= ""{code:GetServiceUser}"" password= ""{code:GetServicePass}"""; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "start PolicyManagerService"; Flags: runhidden

; Open firewall for the configured ports
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""Policy Manager API Port {code:GetApiPort}"" dir=in action=allow protocol=TCP localport={code:GetApiPort}"; Flags: runhidden
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""Policy Manager Web Port {code:GetAppPort}"" dir=in action=allow protocol=TCP localport={code:GetAppPort}"; Check: PortDifferenceCheck; Flags: runhidden

[UninstallRun]
; Stop and remove the service
Filename: "{sys}\sc.exe"; Parameters: "stop PolicyManagerService"; Flags: runhidden; RunOnceId: "StopService"
Filename: "{sys}\sc.exe"; Parameters: "delete PolicyManagerService"; Flags: runhidden; RunOnceId: "DeleteService"
; Remove firewall rules
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Policy Manager API Port"""; Flags: runhidden; RunOnceId: "DelFirewallApi"
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Policy Manager Web Port"""; Flags: runhidden; RunOnceId: "DelFirewallWeb"

[Code]
function CheckIfSQLIsNotInstalled: Boolean;
begin
  Result := Not RegKeyExists(HKLM, 'SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL');
end;

var
  PortPage, DbPage, SvcAcctPage: TInputQueryWizardPage;

function IsPortInUse(Port: String): Boolean;
var
  ResultCode: Integer;
begin
  // Use netstat to check if the port is LISTENING
  Exec('cmd.exe', '/c netstat -ano | findstr LISTENING | findstr :' + Port, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := (ResultCode = 0);
end;

procedure InitializeWizard;
begin
  // ── Page 1: Port Configuration ──────────────────────────────────────────
  PortPage := CreateInputQueryPage(wpSelectDir,
    'Application Configuration', 'Configure Hosting Ports',
    'Specify the ports for the API and Web Application.');
  PortPage.Add('API Port (Backend):', False);
  PortPage.Add('Web App Port (Frontend):', False);
  PortPage.Values[0] := '5100';
  PortPage.Values[1] := '5100';

  // ── Page 2: Database Configuration ──────────────────────────────────────
  DbPage := CreateInputQueryPage(PortPage.ID,
    'Database Configuration', 'Configure SQL Server Connection',
    'Enter your SQL Server connection details. Leave User ID blank for Windows Authentication.');
  DbPage.Add('SQL Server Name (e.g. (localdb)\MSSQLLocalDB):', False);
  DbPage.Add('Database Name:', False);
  DbPage.Add('User ID (blank = Windows Auth):', False);
  DbPage.Add('Password:', True);
  DbPage.Values[0] := '(localdb)\MSSQLLocalDB';
  DbPage.Values[1] := 'PolicyManagerDB';
  DbPage.Values[2] := '';   // blank = Windows Auth (Integrated Security) for LocalDB
  DbPage.Values[3] := '';   // no password for Windows Auth

  // ── Page 3: Service Account ──────────────────────────────────────────────
  // Required when using LocalDB: the service must run as your Windows user.
  SvcAcctPage := CreateInputQueryPage(DbPage.ID,
    'Service Account', 'Windows Service Login',
    'Policy Manager runs as a Windows Service. If using LocalDB, the service must run as ' +
    'your Windows user account (not SYSTEM). Enter your credentials below.' + #13#10 +
    'Leave blank to run as LocalSystem (only works with full SQL Server, not LocalDB).');
  SvcAcctPage.Add('Windows Username (e.g. COMPUTERNAME\YourName or domain\user):', False);
  SvcAcctPage.Add('Windows Password:', True);

  // Pre-fill with current user from registry (best-effort)
  SvcAcctPage.Values[0] := GetEnv('USERDOMAIN') + '\' + GetEnv('USERNAME');
  SvcAcctPage.Values[1] := '';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  // Port conflict warnings
  if CurPageID = PortPage.ID then
  begin
    if IsPortInUse(PortPage.Values[0]) then
      if MsgBox('API Port ' + PortPage.Values[0] + ' is already in use. Continue?', mbConfirmation, MB_YESNO) = IDNO then
        Result := False;

    if Result and (PortPage.Values[0] <> PortPage.Values[1]) then
      if IsPortInUse(PortPage.Values[1]) then
        if MsgBox('Web App Port ' + PortPage.Values[1] + ' is already in use. Continue?', mbConfirmation, MB_YESNO) = IDNO then
          Result := False;
  end;

  // Validate service account page
  if CurPageID = SvcAcctPage.ID then
  begin
    // If username is provided, password must also be provided
    if (Trim(SvcAcctPage.Values[0]) <> '') and (Trim(SvcAcctPage.Values[1]) = '') then
    begin
      MsgBox('Please enter the Windows password for the service account, or clear the username to use LocalSystem.', mbError, MB_OK);
      Result := False;
    end;
  end;
end;

function GetApiPort(Param: String): String;
begin
  Result := Trim(PortPage.Values[0]);
  if Result = '' then Result := '5100';
end;

function GetAppPort(Param: String): String;
begin
  Result := Trim(PortPage.Values[1]);
  if Result = '' then Result := '5100';
end;

function PortDifferenceCheck: Boolean;
begin
  Result := (PortPage.Values[0] <> PortPage.Values[1]);
end;

function GetServiceUser(Param: String): String;
begin
  Result := Trim(SvcAcctPage.Values[0]);
  if Result = '' then Result := 'LocalSystem';
end;

function GetServicePass(Param: String): String;
begin
  Result := SvcAcctPage.Values[1];
end;

// Runs after files are copied, before [Run] section
procedure CurStepChanged(CurStep: TSetupStep);
var
  ConnStr, PsScript, PsCmd, AppSettingsPath, ServerName, ApiPort: String;
  ResultCode: Integer;
  TempScript: String;
begin
  if CurStep = ssPostInstall then
  begin
    ApiPort    := GetApiPort('');
    ServerName := DbPage.Values[0];
    StringChangeEx(ServerName, '\\', '\', True);

    // Build connection string
    ConnStr := 'Server=' + ServerName + ';Database=' + DbPage.Values[1] +
               ';TrustServerCertificate=True;MultipleActiveResultSets=true;';
    if Trim(DbPage.Values[2]) <> '' then
      ConnStr := ConnStr + 'User ID=' + DbPage.Values[2] + ';Password=' + DbPage.Values[3] + ';'
    else
      ConnStr := ConnStr + 'Integrated Security=True;';

    AppSettingsPath := ExpandConstant('{app}\appsettings.json');

    // Write a temporary PowerShell script to disk to avoid command-line quoting issues.
    // This script safely builds the Kestrel JSON tree even if it doesn't exist yet.
    TempScript := ExpandConstant('{tmp}\pm_patch_settings.ps1');

    PsScript :=
      '$path = ''' + AppSettingsPath + '''' + #13#10 +
      '$connStr = ''' + ConnStr + '''' + #13#10 +
      '$kestrelUrl = ''http://*:' + ApiPort + '''' + #13#10 +
      '' + #13#10 +
      '$json = Get-Content $path -Raw | ConvertFrom-Json' + #13#10 +
      '' + #13#10 +
      '# Update connection string' + #13#10 +
      '$json.ConnectionStrings.DefaultConnection = $connStr' + #13#10 +
      '' + #13#10 +
      '# Safely build Kestrel > Endpoints > Http > Url tree' + #13#10 +
      'if (-not $json.PSObject.Properties[''Kestrel'']) {' + #13#10 +
      '    $json | Add-Member -NotePropertyName ''Kestrel'' -NotePropertyValue ([PSCustomObject]@{' + #13#10 +
      '        Endpoints = [PSCustomObject]@{ Http = [PSCustomObject]@{ Url = $kestrelUrl } }' + #13#10 +
      '    })' + #13#10 +
      '} elseif (-not $json.Kestrel.PSObject.Properties[''Endpoints'']) {' + #13#10 +
      '    $json.Kestrel | Add-Member -NotePropertyName ''Endpoints'' -NotePropertyValue ([PSCustomObject]@{' + #13#10 +
      '        Http = [PSCustomObject]@{ Url = $kestrelUrl }' + #13#10 +
      '    })' + #13#10 +
      '} elseif (-not $json.Kestrel.Endpoints.PSObject.Properties[''Http'']) {' + #13#10 +
      '    $json.Kestrel.Endpoints | Add-Member -NotePropertyName ''Http'' -NotePropertyValue ([PSCustomObject]@{ Url = $kestrelUrl })' + #13#10 +
      '} elseif (-not $json.Kestrel.Endpoints.Http.PSObject.Properties[''Url'']) {' + #13#10 +
      '    $json.Kestrel.Endpoints.Http | Add-Member -NotePropertyName ''Url'' -NotePropertyValue $kestrelUrl' + #13#10 +
      '} else {' + #13#10 +
      '    $json.Kestrel.Endpoints.Http.Url = $kestrelUrl' + #13#10 +
      '}' + #13#10 +
      '' + #13#10 +
      '$json | ConvertTo-Json -Depth 100 | Set-Content $path -Encoding UTF8' + #13#10 +
      'Write-Host "appsettings.json updated successfully."';

    SaveStringToFile(TempScript, PsScript, False);

    PsCmd := '-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "' + TempScript + '"';
    Exec('powershell.exe', PsCmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    if ResultCode <> 0 then
      MsgBox('Warning: Could not update appsettings.json (exit code ' + IntToStr(ResultCode) + '). ' +
             'Please manually edit: ' + AppSettingsPath, mbError, MB_OK);
  end;
end;
