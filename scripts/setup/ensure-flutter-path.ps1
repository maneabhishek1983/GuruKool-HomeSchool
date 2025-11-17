# Ensure Flutter PATH is available in all subprocesses
# Run this script to fix PATH issues

$FlutterPath = 'C:\Users\abhis\develop\flutter\bin'

Write-Host '=== Ensuring Flutter PATH for Subprocesses ===' -ForegroundColor Cyan
Write-Host ''

# Verify Flutter exists
if (-not (Test-Path $FlutterPath)) {
    Write-Host "Error: Flutter not found at $FlutterPath" -ForegroundColor Red
    exit 1
}

# Get current PATH values
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')

# Ensure Flutter is in User PATH
if ($userPath -notlike "*$FlutterPath*") {
    Write-Host 'Adding Flutter to User PATH...' -ForegroundColor Yellow
    $newUserPath = if ($userPath) { $userPath + ';' + $FlutterPath } else { $FlutterPath }
    [System.Environment]::SetEnvironmentVariable('Path', $newUserPath, 'User')
    Write-Host 'Added to User PATH' -ForegroundColor Green
    # Refresh userPath variable
    $userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
} else {
    Write-Host 'Flutter already in User PATH' -ForegroundColor Green
}

# Update current session PATH
$env:Path = if ($machinePath) { $machinePath + ';' + $userPath } else { $userPath }
Write-Host 'Refreshed current session PATH' -ForegroundColor Green

# Verify
Write-Host ''
Write-Host 'Verifying Flutter access...' -ForegroundColor Yellow
$flutterInPath = $env:Path -like "*$FlutterPath*"
Write-Host "Flutter in session PATH: $flutterInPath" -ForegroundColor $(if ($flutterInPath) { 'Green' } else { 'Red' })

# Test Flutter command
try {
    $null = Get-Command flutter -ErrorAction Stop
    Write-Host 'Flutter command is accessible' -ForegroundColor Green
    flutter --version | Select-Object -First 1
} catch {
    Write-Host 'Flutter command not accessible in this session' -ForegroundColor Yellow
    Write-Host 'Restart PowerShell or run: $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")' -ForegroundColor Cyan
}

Write-Host ''
Write-Host '=== Summary ===' -ForegroundColor Cyan
Write-Host "Flutter Path: $FlutterPath" -ForegroundColor White
Write-Host "In User PATH: $($userPath -like "*$FlutterPath*")" -ForegroundColor White
Write-Host "In Session PATH: $flutterInPath" -ForegroundColor White
Write-Host ''
Write-Host 'Note: For CMD subprocesses, you may need to restart your terminal.' -ForegroundColor Yellow
Write-Host 'PowerShell subprocesses should work immediately.' -ForegroundColor Green

