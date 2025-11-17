@echo off
REM Add Flutter to current CMD session PATH
REM This only affects the current CMD window

set "FLUTTER_PATH=C:\Users\abhis\develop\flutter\bin"

echo Adding Flutter to current CMD session PATH...
echo Flutter Path: %FLUTTER_PATH%

REM Check if Flutter directory exists
if not exist "%FLUTTER_PATH%" (
    echo ERROR: Flutter directory not found at %FLUTTER_PATH%
    pause
    exit /b 1
)

REM Add Flutter to current session PATH if not already present
echo %PATH% | findstr /C:"%FLUTTER_PATH%" >nul
if errorlevel 1 (
    set "PATH=%PATH%;%FLUTTER_PATH%"
    echo Flutter added to PATH
) else (
    echo Flutter already in PATH
)

echo.
echo Testing Flutter...
flutter --version

if errorlevel 1 (
    echo.
    echo ERROR: Flutter command failed
    echo Current PATH: %PATH%
) else (
    echo.
    echo SUCCESS: Flutter is working in this CMD session!
    echo.
    echo NOTE: This only affects the current CMD window.
    echo For permanent access, restart CMD after Flutter is added to User PATH.
)

pause

