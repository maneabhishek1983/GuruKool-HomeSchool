# Fix Flutter PATH for Subprocesses
# This ensures Flutter PATH is available in all PowerShell subprocesses

$FlutterPath = 'C:\Users\abhis\develop\flutter\bin'

Write-Host '=== Fixing Flutter PATH for Subprocesses ===' -ForegroundColor Cyan
Write-Host ''

# Step 1: Verify Flutter directory exists
if (-not (Test-Path $FlutterPath)) {
    Write-Host "Error: Flutter directory not found at: $FlutterPath" -ForegroundColor Red
    exit 1
}

# Step 2: Ensure Flutter is in User PATH (persistent)
Write-Host 'Step 1: Ensuring Flutter is in User PATH...' -ForegroundColor Yellow
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')

if ($userPath -notlike "*$FlutterPath*") {
    $newUserPath = $userPath + ';' + $FlutterPath
    [System.Environment]::SetEnvironmentVariable('Path', $newUserPath, 'User')
    Write-Host "Added Flutter to User PATH" -ForegroundColor Green
} else {
    Write-Host "Flutter already in User PATH" -ForegroundColor Green
}

# Step 3: Refresh current session PATH (combine Machine + User)
Write-Host ''
Write-Host 'Step 2: Refreshing current session PATH...' -ForegroundColor Yellow
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$env:Path = $machinePath + ';' + $userPath

# Step 4: Verify Flutter is now in session PATH
Write-Host ''
Write-Host 'Step 3: Verifying PATH in current session...' -ForegroundColor Yellow
if ($env:Path -like "*$FlutterPath*") {
    Write-Host "Flutter is now in session PATH" -ForegroundColor Green
} else {
    Write-Host "Warning: Flutter not found in session PATH" -ForegroundColor Yellow
}

# Step 5: Test Flutter command
Write-Host ''
Write-Host 'Step 4: Testing Flutter command...' -ForegroundColor Yellow
try {
    $flutterVersion = flutter --version 2>&1 | Select-Object -First 1
    Write-Host "Flutter is working!" -ForegroundColor Green
    Write-Host "   $flutterVersion" -ForegroundColor Gray
} catch {
    Write-Host "Error: Flutter command failed" -ForegroundColor Red
    Write-Host "You may need to restart PowerShell" -ForegroundColor Yellow
}

# Step 6: Update PowerShell profile to auto-load PATH
Write-Host ''
Write-Host 'Step 5: Setting up PowerShell profile for auto-load...' -ForegroundColor Yellow

$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path -Path $profilePath -Parent

if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$profileContent = @"
# Auto-refresh PATH to include Flutter
`$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
`$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
`$env:Path = `$machinePath + ';' + `$userPath
"@

if (-not (Test-Path $profilePath)) {
    Set-Content -Path $profilePath -Value $profileContent
    Write-Host "Created PowerShell profile: $profilePath" -ForegroundColor Green
} else {
    $existingContent = Get-Content -Path $profilePath -Raw
    if ($existingContent -notlike "*Auto-refresh PATH*") {
        Add-Content -Path $profilePath -Value "`n$profileContent"
        Write-Host "Updated PowerShell profile: $profilePath" -ForegroundColor Green
    } else {
        Write-Host "PowerShell profile already configured" -ForegroundColor Green
    }
}

Write-Host ''
Write-Host '=== Setup Complete ===' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '  1. Close and reopen PowerShell for full effect' -ForegroundColor White
Write-Host '  2. Or run: . $PROFILE' -ForegroundColor White
Write-Host '  3. Test with: flutter --version' -ForegroundColor White

