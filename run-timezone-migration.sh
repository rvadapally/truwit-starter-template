#!/bin/bash

# Run timezone migration on production database
# This converts existing Central Time timestamps to UTC (+5 hours for CDT)

echo "Starting timezone migration on production database..."
echo "Converting Central Time timestamps to UTC (+5 hours)"

# Set environment variables for production database
export PGPASSWORD="$DATABASE_PASSWORD"
export PGHOST="$DATABASE_HOST"
export PGPORT="$DATABASE_PORT"
export PGUSER="$DATABASE_USER"
export PGDATABASE="$DATABASE_NAME"

# Run the migration
psql -f api/Data/Migrations/2025-10-21_fix_timezone_to_utc.sql

if [ $? -eq 0 ]; then
    echo "✅ Timezone migration completed successfully!"
    echo "All timestamps have been converted from Central Time to UTC"
else
    echo "❌ Migration failed!"
    exit 1
fi
