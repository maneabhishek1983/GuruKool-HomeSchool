-- Make teachers.user_id nullable to allow teacher creation without auth accounts
-- This fixes the foreign key constraint issue when creating teachers

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE teachers
DROP CONSTRAINT IF EXISTS teachers_user_id_fkey;

-- Step 2: Make user_id nullable
ALTER TABLE teachers
ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Re-add the foreign key constraint as nullable (optional reference)
-- This allows NULL values but validates non-NULL values
ALTER TABLE teachers
ADD CONSTRAINT teachers_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- Step 4: Drop the unique constraint on (user_id, parent_id) since user_id can be null
ALTER TABLE teachers
DROP CONSTRAINT IF EXISTS teachers_user_id_parent_id_key;

-- Step 5: Add a new unique constraint on email per parent instead
-- This prevents duplicate teachers with the same email for the same parent
ALTER TABLE teachers
ADD CONSTRAINT teachers_email_parent_id_key
UNIQUE (email, parent_id);

-- Add comment to explain the change
COMMENT ON COLUMN teachers.user_id IS 'Optional reference to users table. NULL for teachers without auth accounts.';
