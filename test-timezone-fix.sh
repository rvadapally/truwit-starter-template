#!/bin/bash

# Test timezone fix - verify API returns proper UTC timestamps

echo "Testing timezone fix..."
echo "Checking if API returns proper UTC timestamps with Z suffix"

# Test a specific proof endpoint
PROOF_ID="TW-967F2CA5"
API_URL="https://truwit-starter-template-production.up.railway.app"

echo "Testing proof endpoint: $API_URL/v1/proofs/$PROOF_ID"

# Get the proof data and extract the IssuedAt timestamp
RESPONSE=$(curl -s "$API_URL/v1/proofs/$PROOF_ID")
ISSUED_AT=$(echo "$RESPONSE" | grep -o '"issuedAt":"[^"]*"' | cut -d'"' -f4)

echo "IssuedAt timestamp: $ISSUED_AT"

# Check if timestamp ends with 'Z' (UTC indicator)
if [[ "$ISSUED_AT" == *"Z" ]]; then
    echo "✅ SUCCESS: Timestamp has UTC 'Z' suffix"
else
    echo "❌ FAILED: Timestamp missing UTC 'Z' suffix"
fi

# Check if timestamp format is correct (ISO 8601)
if [[ "$ISSUED_AT" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
    echo "✅ SUCCESS: Timestamp format is correct ISO 8601 UTC"
else
    echo "❌ FAILED: Timestamp format is incorrect"
fi

echo "Raw response:"
echo "$RESPONSE" | jq '.issuedAt' 2>/dev/null || echo "$RESPONSE"
