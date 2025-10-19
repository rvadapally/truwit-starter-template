#!/bin/bash
# Script to apply PostgreSQL migration to Railway database
# This script connects to Railway PostgreSQL and runs the proof card migration

echo "🔧 Applying PostgreSQL migration for proof card URLs..."

# Check if DATABASE_URL is set (Railway provides this)
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL to your Railway PostgreSQL connection string"
    echo "Example: DATABASE_URL=postgresql://user:password@host:port/database"
    exit 1
fi

# Run the migration
echo "📝 Executing migration: 2025-10-19_postgres_proof_card_urls.sql"
psql "$DATABASE_URL" -f "Data/Migrations/2025-10-19_postgres_proof_card_urls.sql"

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "🎉 Proof card URL columns added to VerificationProofs table"
else
    echo "❌ Migration failed!"
    exit 1
fi
