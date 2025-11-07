-- Migration 000: Enable UUID extension properly
-- This ensures uuid_generate_v4() function is available
-- Run this BEFORE all other migrations

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Verify the extension is loaded
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'uuid_generate_v4'
    ) THEN
        RAISE EXCEPTION 'uuid_generate_v4 function not found after extension creation';
    END IF;
END $$;

-- Add comment
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
