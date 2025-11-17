# Add Flutter to PATH Environment Variable
$FlutterPath = 'C:\Users\abhis\develop\flutter\bin'

Write-Host 'Adding Flutter to PATH...' -ForegroundColor Cyan

if (-not (Test-Path $FlutterPath)) {
    Write-Host 'Error: Flutter directory not found' -ForegroundColor Red
    exit 1
}

$CurrentPath = [Environment]::GetEnvironmentVariable('Path', 'User')

if ($CurrentPath -like "*$FlutterPath*") {
    Write-Host 'Flutter is already in PATH' -ForegroundColor Green
} else {
    $NewPath = $CurrentPath + ';' + $FlutterPath
    [Environment]::SetEnvironmentVariable('Path', $NewPath, 'User')
    Write-Host 'Added Flutter to user PATH' -ForegroundColor Green
}

$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')

Write-Host ''
Write-Host 'Verifying Flutter installation...' -ForegroundColor Cyan

try {
    $flutterVersion = flutter --version 2>&1 | Select-Object -First 1
    Write-Host 'Flutter is now accessible!' -ForegroundColor Green
    Write-Host "   $flutterVersion" -ForegroundColor Gray
} catch {
    Write-Host 'Flutter command not yet available in this session.' -ForegroundColor Yellow
    Write-Host 'Please close and reopen PowerShell for changes to take effect' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '   1. Close and reopen PowerShell for changes to take effect' -ForegroundColor White
Write-Host '   2. Run flutter doctor to check your Flutter setup' -ForegroundColor White
Write-Host '   3. Run flutter --version to verify installation' -ForegroundColor White

