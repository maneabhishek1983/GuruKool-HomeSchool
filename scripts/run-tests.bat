@echo off
echo ========================================
echo    Comprehensive Testing Framework
echo    Gurukool Homeschool Application
echo ========================================
echo.

echo Starting comprehensive testing...
echo.

REM Set environment variables
set BASE_URL=http://localhost:3000
set NODE_ENV=test

REM Run comprehensive testing
echo [1/4] Running comprehensive tests...
node scripts/comprehensive-testing.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Comprehensive tests failed
    exit /b 1
)
echo ✅ Comprehensive tests completed
echo.

REM Run performance testing
echo [2/4] Running performance tests...
node scripts/performance-testing.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Performance tests failed
    exit /b 1
)
echo ✅ Performance tests completed
echo.

REM Run security tests
echo [3/4] Running security tests...
npx playwright test security-penetration.spec.ts
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Security tests failed
    exit /b 1
)
echo ✅ Security tests completed
echo.

REM Run regression tests
echo [4/4] Running regression tests...
npx playwright test regression-testing.spec.ts
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Regression tests failed
    exit /b 1
)
echo ✅ Regression tests completed
echo.

echo ========================================
echo    All tests completed successfully!
echo ========================================
echo.
echo Test reports are available in:
echo - test-results/comprehensive-test-report.json
echo - test-results/performance-test-report.json
echo - test-results/ (Playwright reports)
echo.

pause
