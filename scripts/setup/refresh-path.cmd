@echo off
REM Refresh PATH in CMD to include Flutter
REM This script refreshes PATH from environment variables

echo Refreshing PATH for Flutter...

REM Get Machine PATH
for /f "tokens=2*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "MACHINE_PATH=%%B"

REM Get User PATH  
for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "USER_PATH=%%B"

REM Combine and set PATH
if defined MACHINE_PATH (
    if defined USER_PATH (
        set "PATH=%MACHINE_PATH%;%USER_PATH%"
    ) else (
        set "PATH=%MACHINE_PATH%"
    )
) else (
    if defined USER_PATH (
        set "PATH=%USER_PATH%"
    )
)

echo PATH refreshed!
echo.
echo Testing Flutter...
flutter --version

if errorlevel 1 (
    echo.
    echo Flutter not found. Please restart CMD/PowerShell for PATH changes to take effect.
) else (
    echo.
    echo Flutter is working!
)

