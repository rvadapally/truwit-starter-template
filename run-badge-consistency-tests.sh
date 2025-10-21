#!/bin/bash

echo "========================================"
echo "BADGE CONSISTENCY E2E TEST SUITE"
echo "========================================"
echo ""
echo "This test suite validates the CRUX of the app:"
echo "- Unified circular badge system"
echo "- Badge consistency across all routes"
echo "- Proof card generation and display"
echo "- Badge fallback mechanisms"
echo "- Cross-browser compatibility"
echo ""

# Set environment variables
export E2E_BASE_URL="https://truwit.ai"
export E2E_API_URL="https://truwit-starter-template-production.up.railway.app"

echo "Testing against:"
echo "  Frontend: $E2E_BASE_URL"
echo "  API: $E2E_API_URL"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check if Playwright is installed
if ! python3 -c "import playwright" &> /dev/null; then
    echo "Installing Playwright..."
    pip3 install playwright
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install Playwright"
        exit 1
    fi
fi

# Install Playwright browsers if needed
echo "Installing Playwright browsers..."
python3 -m playwright install --with-deps
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Playwright browsers"
    exit 1
fi

echo ""
echo "Starting Badge Consistency Tests..."
echo "========================================"

# Run the badge consistency tests
python3 tools/badge_consistency_e2e_test.py
test_result=$?

echo ""
echo "========================================"
if [ $test_result -eq 0 ]; then
    echo "🎉 BADGE CONSISTENCY TESTS PASSED!"
    echo "The unified circular badge system is ROCK SOLID!"
elif [ $test_result -eq 1 ]; then
    echo "⚠️  BADGE CONSISTENCY TESTS WARNING"
    echo "Badge consistency needs improvement"
else
    echo "❌ BADGE CONSISTENCY TESTS FAILED"
    echo "CRITICAL: Badge consistency issues detected"
fi
echo "========================================"

echo ""
echo "Test completed with exit code: $test_result"
echo "Check test-results/ folder for detailed report"
echo ""

exit $test_result
