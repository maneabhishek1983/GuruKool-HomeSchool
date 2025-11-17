# Quick PATH Refresh Script
# Run this in any PowerShell session to refresh environment PATH

$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

Write-Host 'PATH refreshed successfully!' -ForegroundColor Green
Write-Host 'You can now use flutter and dart commands.' -ForegroundColor Cyan

