-- Enable Realtime for teacher_sessions table
-- This allows the parent dashboard to receive instant updates when a teacher checks in/out

DO $$
BEGIN
  -- Check if teacher_sessions is already in the publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'teacher_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE teacher_sessions;
  END IF;

  -- Also check for teacher_qr_codes just in case
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'teacher_qr_codes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE teacher_qr_codes;
  END IF;
END
$$;
