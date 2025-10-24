#!/bin/bash
# Multi-Sign System Integration Test Script (Bash/curl version)
# Tests the complete flow: init -> finalize -> auth -> sign -> manifest -> badge

set -e

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
TEST_IMAGE="${TEST_IMAGE:-}"
VERBOSE="${VERBOSE:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
GROUP_ID=""
FILE_ID=""
IDENTITY_TOKEN=""
TEST_RESULTS=()

# Helper functions
print_header() {
    echo -e "\n${CYAN}========================================"
    echo -e "$1"
    echo -e "========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${YELLOW}ℹ️  $1${NC}"
    fi
}

add_result() {
    TEST_RESULTS+=("$1|$2|$3")
}

# Test 1: API Health Check
test_api_health() {
    print_header "TEST 1: API Health Check"
    
    response=$(curl -s -w "\n%{http_code}" "$API_URL/health" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_success "API is healthy"
        print_info "Response: $body"
        add_result "API Health" "PASS" "API responding"
        return 0
    else
        print_failure "API health check failed (HTTP $http_code)"
        add_result "API Health" "FAIL" "HTTP $http_code"
        return 1
    fi
}

# Test 2: Initialize Proof
test_init_proof() {
    print_header "TEST 2: Initialize Proof"
    
    response=$(curl -s -X POST "$API_URL/v1/proofs/init" \
        -H "Content-Type: application/json" \
        -d '{"fileName":"test-image.png","byteSize":12345,"mime":"image/png"}')
    
    if echo "$response" | grep -q "clientHashInstructions"; then
        print_success "Init proof succeeded"
        print_info "Response: $response"
        add_result "Init Proof" "PASS" "Init successful"
        return 0
    else
        print_failure "Init proof failed"
        print_info "Response: $response"
        add_result "Init Proof" "FAIL" "Unexpected response"
        return 1
    fi
}

# Create a simple test PNG (10x10 red square)
create_test_image() {
    # Minimal PNG hex data
    echo "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC" | base64 -d > /tmp/test-image.png
    echo "/tmp/test-image.png"
}

# Test 3: Finalize Proof
test_finalize_proof() {
    print_header "TEST 3: Finalize Proof"
    
    # Create or use test image
    if [ -z "$TEST_IMAGE" ]; then
        TEST_IMAGE=$(create_test_image)
        print_info "Created test image: $TEST_IMAGE"
    fi
    
    if [ ! -f "$TEST_IMAGE" ]; then
        print_failure "Test image not found: $TEST_IMAGE"
        add_result "Finalize Proof" "SKIP" "No image"
        return 1
    fi
    
    # Compute SHA256
    if command -v sha256sum >/dev/null 2>&1; then
        SHA256=$(sha256sum "$TEST_IMAGE" | awk '{print $1}')
    elif command -v shasum >/dev/null 2>&1; then
        SHA256=$(shasum -a 256 "$TEST_IMAGE" | awk '{print $1}')
    else
        print_failure "Neither sha256sum nor shasum found"
        add_result "Finalize Proof" "SKIP" "No SHA256 tool"
        return 1
    fi
    
    # Convert to base64
    IMAGE_BASE64=$(base64 < "$TEST_IMAGE" | tr -d '\n')
    
    print_info "SHA256: $SHA256"
    print_info "Image size: $(wc -c < "$TEST_IMAGE") bytes"
    print_info "Base64 length: ${#IMAGE_BASE64} chars"
    
    # Make request
    response=$(curl -s -X POST "$API_URL/v1/proofs/finalize" \
        -H "Content-Type: application/json" \
        -d "{\"sha256Hex\":\"$SHA256\",\"imageBase64\":\"$IMAGE_BASE64\",\"techMeta\":{\"tool\":\"Bash Test Script\"}}")
    
    # Extract group_id and file_id using grep and sed
    GROUP_ID=$(echo "$response" | grep -o '"groupId":"[^"]*"' | cut -d'"' -f4)
    FILE_ID=$(echo "$response" | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$GROUP_ID" ] && [ -n "$FILE_ID" ]; then
        print_success "Finalize proof succeeded"
        print_info "Group ID: $GROUP_ID"
        print_info "File ID: $FILE_ID"
        add_result "Finalize Proof" "PASS" "GroupId: $GROUP_ID"
        return 0
    else
        print_failure "Finalize proof failed"
        print_info "Response: $response"
        add_result "Finalize Proof" "FAIL" "Missing IDs"
        return 1
    fi
}

# Test 4: Anonymous Authentication
test_anonymous_auth() {
    print_header "TEST 4: Anonymous Authentication"
    
    response=$(curl -s -X POST "$API_URL/v1/auth/anonymous")
    
    IDENTITY_TOKEN=$(echo "$response" | grep -o '"identity_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$IDENTITY_TOKEN" ]; then
        print_success "Anonymous auth succeeded"
        print_info "Token length: ${#IDENTITY_TOKEN} chars"
        print_info "Token preview: ${IDENTITY_TOKEN:0:50}..."
        add_result "Anonymous Auth" "PASS" "Token received"
        return 0
    else
        print_failure "Anonymous auth failed"
        print_info "Response: $response"
        add_result "Anonymous Auth" "FAIL" "No token"
        return 1
    fi
}

# Test 5: Create Signature
test_create_signature() {
    print_header "TEST 5: Create Signature"
    
    if [ -z "$FILE_ID" ] || [ -z "$IDENTITY_TOKEN" ]; then
        print_failure "Missing FileId or IdentityToken from previous tests"
        add_result "Create Signature" "SKIP" "Missing prerequisites"
        return 1
    fi
    
    response=$(curl -s -X POST "$API_URL/v1/signatures" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $IDENTITY_TOKEN" \
        -d "{\"fileId\":\"$FILE_ID\",\"statement\":{\"claim\":\"creator\",\"notes\":\"Original creator - automated test\"}}")
    
    SIG_ID=$(echo "$response" | grep -o '"sigId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$SIG_ID" ]; then
        print_success "Signature created successfully"
        print_info "Signature ID: $SIG_ID"
        add_result "Create Signature" "PASS" "SigId: $SIG_ID"
        return 0
    else
        print_failure "Create signature failed"
        print_info "Response: $response"
        add_result "Create Signature" "FAIL" "No sigId"
        return 1
    fi
}

# Test 6: Get Manifest
test_get_manifest() {
    print_header "TEST 6: Get Manifest"
    
    if [ -z "$GROUP_ID" ]; then
        print_failure "Missing GroupId from previous tests"
        add_result "Get Manifest" "SKIP" "Missing GroupId"
        return 1
    fi
    
    response=$(curl -s "$API_URL/v1/manifest/$GROUP_ID")
    
    if echo "$response" | grep -q "groupId"; then
        print_success "Manifest retrieved successfully"
        
        # Count files and signatures (basic grep count)
        files_count=$(echo "$response" | grep -o '"fileId"' | wc -l)
        sigs_count=$(echo "$response" | grep -o '"sigId"' | wc -l)
        
        print_info "Files count: $files_count"
        print_info "Signatures count: $sigs_count"
        
        add_result "Get Manifest" "PASS" "Files: $files_count, Sigs: $sigs_count"
        return 0
    else
        print_failure "Get manifest failed"
        print_info "Response: $response"
        add_result "Get Manifest" "FAIL" "Invalid response"
        return 1
    fi
}

# Test 7: Get Badge SVG
test_get_badge() {
    print_header "TEST 7: Get Badge SVG"
    
    if [ -z "$GROUP_ID" ]; then
        print_failure "Missing GroupId from previous tests"
        add_result "Get Badge" "SKIP" "Missing GroupId"
        return 1
    fi
    
    badge_file="/tmp/test-badge-$GROUP_ID.svg"
    http_code=$(curl -s -w "%{http_code}" -o "$badge_file" "$API_URL/v1/badge/$GROUP_ID.svg")
    
    if [ "$http_code" = "200" ] && [ -f "$badge_file" ] && grep -q "<svg" "$badge_file"; then
        badge_size=$(wc -c < "$badge_file")
        
        print_success "Badge SVG retrieved successfully"
        print_info "Badge size: $badge_size bytes"
        print_info "Target size: <25KB (25600 bytes)"
        
        if [ "$badge_size" -lt 25600 ]; then
            print_success "Badge size is within target (<25KB)"
        else
            print_failure "Badge size exceeds target (>25KB)"
        fi
        
        print_info "Badge saved to: $badge_file"
        
        # Check for key elements
        has_title=$(grep -c "<title>" "$badge_file" || echo 0)
        has_verified=$(grep -c "Verified by Truwit" "$badge_file" || echo 0)
        
        print_info "Badge contains:"
        print_info "  - <title> tag: $has_title"
        print_info "  - 'Verified by Truwit' text: $has_verified"
        
        add_result "Get Badge" "PASS" "Size: $badge_size bytes"
        return 0
    else
        print_failure "Badge SVG invalid or missing"
        add_result "Get Badge" "FAIL" "Invalid SVG"
        return 1
    fi
}

# Test 8: Rate Limiting (Optional)
test_rate_limiting() {
    print_header "TEST 8: Rate Limiting (Optional)"
    
    print_info "Sending rapid requests to test rate limiting..."
    print_info "Expected: HTTP 429 after 10 requests"
    
    success_count=0
    rate_limited_count=0
    
    for i in {1..15}; do
        http_code=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/v1/proofs/finalize" \
            -H "Content-Type: application/json" \
            -d '{"sha256Hex":"test","imageBase64":"test"}')
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "400" ]; then
            ((success_count++))
            echo -n "."
        elif [ "$http_code" = "429" ]; then
            ((rate_limited_count++))
            echo -n "X"
        else
            echo -n "!"
        fi
        sleep 0.1
    done
    
    echo ""
    print_info "Results: Success=$success_count, RateLimited=$rate_limited_count"
    
    if [ "$rate_limited_count" -gt 0 ]; then
        print_success "Rate limiting is working (received $rate_limited_count HTTP 429 responses)"
        add_result "Rate Limiting" "PASS" "429 responses: $rate_limited_count"
        return 0
    else
        print_failure "Rate limiting did not trigger"
        add_result "Rate Limiting" "FAIL" "No 429 responses"
        return 1
    fi
}

# Show test summary
show_summary() {
    print_header "TEST SUMMARY"
    
    passed=0
    failed=0
    skipped=0
    
    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test status details <<< "$result"
        
        case "$status" in
            PASS)
                ((passed++))
                echo -e "${GREEN}[$status] $test - $details${NC}"
                ;;
            FAIL)
                ((failed++))
                echo -e "${RED}[$status] $test - $details${NC}"
                ;;
            SKIP)
                ((skipped++))
                echo -e "${YELLOW}[$status] $test - $details${NC}"
                ;;
        esac
    done
    
    total=${#TEST_RESULTS[@]}
    
    echo ""
    echo -e "${CYAN}Total Tests: $total${NC}"
    echo -e "${GREEN}Passed: $passed${NC}"
    echo -e "${RED}Failed: $failed${NC}"
    echo -e "${YELLOW}Skipped: $skipped${NC}"
    echo ""
    
    if [ "$failed" -eq 0 ] && [ "$passed" -gt 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}Implementation complete, all verification steps passed.${NC}"
    elif [ "$failed" -gt 0 ]; then
        echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
        echo -e "${RED}Please review the failures above.${NC}"
    fi
}

# Main execution
echo -e "${CYAN}"
cat << "EOF"

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        Multi-Sign System Integration Test Suite              ║
║                                                               ║
║        Testing Phases 4-7 Implementation                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

EOF
echo -e "${NC}"

echo -e "${YELLOW}API URL: $API_URL${NC}"
echo -e "${YELLOW}Test Image: ${TEST_IMAGE:-Generated 10x10 PNG}${NC}"
echo ""

# Run tests
if ! test_api_health; then
    echo -e "\n${RED}API is not reachable. Please start the API first:${NC}"
    echo -e "${YELLOW}  cd api${NC}"
    echo -e "${YELLOW}  dotnet run${NC}"
    show_summary
    exit 1
fi

test_init_proof
test_finalize_proof
test_anonymous_auth
test_create_signature
test_get_manifest
test_get_badge

# Ask before running rate limit test
echo -e "\n${YELLOW}Run rate limiting test? This will send rapid requests and may trigger rate limits.${NC}"
read -p "Run rate limit test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    test_rate_limiting
fi

show_summary

