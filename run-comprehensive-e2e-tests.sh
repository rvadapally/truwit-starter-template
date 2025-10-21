#!/bin/bash
# Comprehensive E2E Test Runner
# Tests the complete badge system and catches real issues

set -e

echo "🧪 TruWit Comprehensive E2E Test Suite"
echo "======================================"

# Check if Python and Playwright are available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Install Playwright if not available
if ! python3 -c "import playwright" 2>/dev/null; then
    echo "📦 Installing Playwright..."
    pip install playwright
    python3 -m playwright install --with-deps chromium
fi

# Set environment variables
export E2E_BASE_URL="${E2E_BASE_URL:-https://truwit.ai}"
export E2E_API_URL="${E2E_API_URL:-https://truwit-starter-template-production.up.railway.app}"

echo "🌐 Frontend URL: $E2E_BASE_URL"
echo "🔗 API URL: $E2E_API_URL"
echo ""

# Run the comprehensive test suite
python3 tools/comprehensive_e2e_test.py

echo ""
echo "✅ E2E test suite completed!"
echo "📄 Check test-results/ directory for detailed reports"
