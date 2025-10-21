@echo off
setlocal

REM Run timezone migration on production database
REM This converts existing Central Time timestamps to UTC (+5 hours for CDT)

echo Starting timezone migration on production database...
echo Converting Central Time timestamps to UTC (+5 hours)

REM Set environment variables for production database
set PGPASSWORD=%DATABASE_PASSWORD%
set PGHOST=%DATABASE_HOST%
set PGPORT=%DATABASE_PORT%
set PGUSER=%DATABASE_USER%
set PGDATABASE=%DATABASE_NAME%

REM Run the migration
psql -f api/Data/Migrations/2025-10-21_fix_timezone_to_utc.sql

if %errorlevel% equ 0 (
    echo ✅ Timezone migration completed successfully!
    echo All timestamps have been converted from Central Time to UTC
) else (
    echo ❌ Migration failed!
    exit /b 1
)
