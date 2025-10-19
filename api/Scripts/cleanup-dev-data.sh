#!/bin/bash
# =====================================================================
# TruWit Dev Database Cleanup Script (Bash)
# Purpose: Remove all test proof data before implementing TW- prefix
# WARNING: This will delete all proofs, assets, receipts, and links
# Only run in development/testing environments!
# =====================================================================

set -e

echo "🧹 TruWit Database Cleanup Script"
echo "================================="
echo ""

# Check if running from api directory
if [ ! -f "truwit.db" ]; then
    echo "❌ Error: truwit.db not found. Please run from api/ directory."
    exit 1
fi

# Confirm cleanup
echo "⚠️  WARNING: This will delete ALL proof records from the database!"
echo ""
read -p "Type 'DELETE' to confirm cleanup (or press Enter to cancel): " confirm

if [ "$confirm" != "DELETE" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

echo ""
echo "🗑️  Running cleanup..."

# Execute cleanup SQL
sqlite3 truwit.db < Scripts/cleanup-dev-data.sql

echo ""
echo "✅ Cleanup completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Update GenerateShortId() to use TW- prefix"
echo "  2. Restart API"
echo "  3. Create test proof to verify new format"
echo ""

