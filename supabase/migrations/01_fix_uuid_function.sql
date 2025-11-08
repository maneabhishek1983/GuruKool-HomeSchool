-- Migration 001a: Fix UUID function access
-- This creates a wrapper function in public schema that calls the extensions schema function

-- Option 1: Create a wrapper function that references the extension schema
CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
RETURNS uuid AS $$
BEGIN
  RETURN extensions.uuid_generate_v4();
EXCEPTION
  WHEN undefined_function THEN
    -- Fallback to gen_random_uuid() if uuid-ossp is not available
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Add comment
COMMENT ON FUNCTION public.uuid_generate_v4() IS 'Wrapper function to access uuid_generate_v4 from extensions schema or fallback to gen_random_uuid';
