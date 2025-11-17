@echo off
REM Simple PATH refresh for CMD
REM This uses PowerShell to refresh PATH, then tests Flutter

echo Refreshing PATH using PowerShell...
powershell -Command "$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')"

echo.
echo Testing Flutter...
flutter --version

if errorlevel 1 (
    echo.
    echo ERROR: Flutter not found in PATH.
    echo Please restart CMD/PowerShell window for changes to take effect.
    pause
) else (
    echo.
    echo SUCCESS: Flutter is working!
    pause
)

