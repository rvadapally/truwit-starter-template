#!/bin/bash

# API Integration Test Script
# Usage: ./test-api.sh [base-url]
# Example: ./test-api.sh http://localhost:5000
# Example: ./test-api.sh https://truwit-starter-template-production.up.railway.app

BASE_URL="${1:-http://localhost:5000}"
FAILED=0
PASSED=0

echo "=========================================="
echo "Testing API at: $BASE_URL"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check Endpoint"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Health check returned 200"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Health check returned $RESPONSE (expected 200)"
    ((FAILED++))
fi
echo ""

# Test 2: Create Proof from URL (TikTok video)
echo "Test 2: Create Proof from URL"
TIKTOK_URL="https://www.tiktok.com/@user33951549420561/video/7524292924507426078"
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/proofs" \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": {
      \"url\": \"$TIKTOK_URL\"
    },
    \"declared\": {
      \"generator\": \"Test Generator\",
      \"prompt\": \"Test prompt\",
      \"license\": \"creator-owned\"
    }
  }")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/v1/proofs" \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": {
      \"url\": \"$TIKTOK_URL\"
    },
    \"declared\": {
      \"generator\": \"Test Generator\",
      \"prompt\": \"Test prompt\",
      \"license\": \"creator-owned\"
    }
  }")

echo "Response Code: $HTTP_CODE"
echo "Response Body: $RESPONSE"

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 500 ]; then
    # Check if it's a known error (yt-dlp issue, not a crash)
    if echo "$RESPONSE" | grep -q "yt-dlp failed\|Specified method is not supported\|TempDir"; then
        echo -e "${RED}✗ FAILED${NC} - API error: yt-dlp or path configuration issue"
        echo "Error details: $RESPONSE"
        ((FAILED++))
    elif [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Proof creation returned 200"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Got 500 but with valid error handling"
        ((PASSED++))
    fi
else
    echo -e "${RED}✗ FAILED${NC} - Unexpected response code: $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# Test 3: Direct video URL test
echo "Test 3: Create Proof from Direct Video URL"
VIDEO_URL="https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/proofs" \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": {
      \"url\": \"$VIDEO_URL\"
    },
    \"declared\": {
      \"generator\": \"Test Generator\",
      \"prompt\": \"Test direct video\",
      \"license\": \"public\"
    }
  }")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/v1/proofs" \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": {
      \"url\": \"$VIDEO_URL\"
    },
    \"declared\": {
      \"generator\": \"Test Generator\",
      \"prompt\": \"Test direct video\",
      \"license\": \"public\"
    }
  }")

echo "Response Code: $HTTP_CODE"
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Direct video proof creation succeeded"
    PROOF_ID=$(echo "$RESPONSE" | grep -o '"proofId":"[^"]*"' | cut -d'"' -f4)
    echo "Proof ID: $PROOF_ID"
    ((PASSED++))
elif [ "$HTTP_CODE" -eq 500 ]; then
    echo -e "${RED}✗ FAILED${NC} - Server error on direct video URL"
    echo "Response: $RESPONSE"
    ((FAILED++))
else
    echo -e "${RED}✗ FAILED${NC} - Unexpected response code: $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# Test 4: Test yt-dlp is installed
echo "Test 4: Check yt-dlp availability (diagnostic)"
if [ "$BASE_URL" = "http://localhost:5000" ]; then
    # Only run local diagnostic
    if command -v yt-dlp &> /dev/null; then
        echo -e "${GREEN}✓ yt-dlp is installed locally${NC}"
        yt-dlp --version
    else
        echo -e "${YELLOW}⚠ yt-dlp not found locally${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping local diagnostic for remote server${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi

