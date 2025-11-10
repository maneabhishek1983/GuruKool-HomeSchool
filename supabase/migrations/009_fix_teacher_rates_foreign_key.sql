-- Fix teacher_rates foreign key to reference teachers table instead of users table
-- This allows teacher rates to be linked to teacher records correctly

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE teacher_rates
DROP CONSTRAINT IF EXISTS teacher_rates_teacher_id_fkey;

-- Step 2: Add new foreign key constraint to teachers table
ALTER TABLE teacher_rates
ADD CONSTRAINT teacher_rates_teacher_id_fkey
FOREIGN KEY (teacher_id)
REFERENCES teachers(id)
ON DELETE CASCADE;

-- Update the comment to clarify
COMMENT ON COLUMN teacher_rates.teacher_id IS 'References teachers.id (not users.id)';
