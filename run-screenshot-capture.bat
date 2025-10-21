@echo off
setlocal

echo ================================================
echo    TRUWIT SCREENSHOT CAPTURE JOB
echo ================================================
echo.
echo This will capture screenshots of all main pages:
echo   - Home Page
echo   - About Page  
echo   - Verification Form Page
echo   - Direct Verification Pages (2 different proofs)
echo   - Badge preview and embed code sections
echo.
echo Screenshots will be saved in a timestamped folder.
echo.
echo Press any key to start capture, or Ctrl+C to cancel...
pause >nul

echo.
echo Starting screenshot capture...
python tools/capture_all_screenshots.py

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo    SCREENSHOT CAPTURE COMPLETED SUCCESSFULLY!
    echo ================================================
    echo.
    echo Screenshots have been saved to: screenshots-*
    echo.
    echo You can now:
    echo   - View the screenshots to verify badge display
    echo   - Check embed code sections for correct URLs
    echo   - Verify verification details show proper timestamps
    echo.
) else (
    echo.
    echo ================================================
    echo    SCREENSHOT CAPTURE FAILED!
    echo ================================================
    echo.
    echo Check the error messages above for details.
    echo.
)

echo Press any key to exit...
pause >nul
