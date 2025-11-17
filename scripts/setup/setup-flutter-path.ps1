# Flutter PATH Setup Script
# Run this as Administrator for best results

Write-Host '=== Flutter PATH Setup ===' -ForegroundColor Cyan
Write-Host ''

# Step 1: Find Flutter installation
Write-Host 'Step 1: Searching for Flutter installation...' -ForegroundColor Yellow

$flutterPaths = @(
    'C:\Users\abhis\develop\flutter\bin',
    'C:\src\flutter\bin',
    'C:\flutter\bin'
)

$foundFlutter = $null

# Check known paths first
foreach ($path in $flutterPaths) {
    if (Test-Path $path) {
        $foundFlutter = $path
        Write-Host "Found Flutter at: $path" -ForegroundColor Green
        break
    }
}

# If not found, search the system
if (-not $foundFlutter) {
    Write-Host 'Searching system for Flutter installation...' -ForegroundColor Yellow
    $searchResult = Get-ChildItem -Path C:\ -Filter flutter -Recurse -ErrorAction SilentlyContinue -Directory -Depth 3 | 
        Where-Object { $_.FullName -like '*\flutter\bin' } | 
        Select-Object -First 1
    
    if ($searchResult) {
        $foundFlutter = $searchResult.FullName
        Write-Host "Found Flutter at: $foundFlutter" -ForegroundColor Green
    }
}

if (-not $foundFlutter) {
    Write-Host 'Error: Flutter installation not found!' -ForegroundColor Red
    Write-Host 'Please install Flutter or update the path in this script.' -ForegroundColor Yellow
    exit 1
}

# Step 2: Add to PATH
Write-Host ''
Write-Host 'Step 2: Adding Flutter to PATH...' -ForegroundColor Yellow

$currentPath = [System.Environment]::GetEnvironmentVariable('PATH', [System.EnvironmentVariableTarget]::User)

if ($currentPath -like "*$foundFlutter*") {
    Write-Host 'Flutter is already in PATH' -ForegroundColor Green
} else {
    $newPath = $currentPath + ';' + $foundFlutter
    [System.Environment]::SetEnvironmentVariable('PATH', $newPath, [System.EnvironmentVariableTarget]::User)
    Write-Host "Added Flutter to PATH: $foundFlutter" -ForegroundColor Green
}

# Step 3: Refresh PATH in current session
Write-Host ''
Write-Host 'Step 3: Refreshing PATH in current session...' -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')

# Step 4: Verify installation
Write-Host ''
Write-Host 'Step 4: Verifying Flutter installation...' -ForegroundColor Yellow

try {
    $flutterVersion = flutter --version 2>&1 | Select-Object -First 3
    Write-Host 'Flutter is working!' -ForegroundColor Green
    Write-Host ''
    flutter --version
    Write-Host ''
    Write-Host 'Running flutter doctor...' -ForegroundColor Cyan
    flutter doctor
} catch {
    Write-Host 'Warning: Flutter command not available in this session.' -ForegroundColor Yellow
    Write-Host 'Please restart PowerShell/CMD and run:' -ForegroundColor Yellow
    Write-Host '  flutter doctor' -ForegroundColor White
    Write-Host '  flutter --version' -ForegroundColor White
}

Write-Host ''
Write-Host '=== Setup Complete ===' -ForegroundColor Green
Write-Host 'Note: You may need to restart PowerShell/CMD for changes to take full effect.' -ForegroundColor Cyan

