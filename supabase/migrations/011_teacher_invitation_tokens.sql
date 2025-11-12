-- ================================
-- Teacher Invitation Tokens - Migration 011
-- Secure token-based teacher invitation system
-- Date: 2025-11-12
-- ================================

-- Create invitation_tokens table for teacher invitations
CREATE TABLE IF NOT EXISTS invitation_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_invitation_tokens_token ON invitation_tokens(token);
CREATE INDEX idx_invitation_tokens_teacher_id ON invitation_tokens(teacher_id);
CREATE INDEX idx_invitation_tokens_parent_id ON invitation_tokens(parent_id);
CREATE INDEX idx_invitation_tokens_email ON invitation_tokens(email);
CREATE INDEX idx_invitation_tokens_status ON invitation_tokens(status);
CREATE INDEX idx_invitation_tokens_expires_at ON invitation_tokens(expires_at);

-- Add updated_at trigger
CREATE TRIGGER update_invitation_tokens_updated_at
    BEFORE UPDATE ON invitation_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Parents can read their own invitation tokens
CREATE POLICY "Parents can read their invitation tokens" ON invitation_tokens
    FOR SELECT USING (auth.uid() = parent_id);

-- Parents can create invitation tokens for their teachers
CREATE POLICY "Parents can create invitation tokens" ON invitation_tokens
    FOR INSERT WITH CHECK (
        auth.uid() = parent_id AND
        EXISTS (
            SELECT 1 FROM teachers
            WHERE teachers.id = invitation_tokens.teacher_id
            AND teachers.parent_id = auth.uid()
        )
    );

-- Parents can update (revoke) their own invitation tokens
CREATE POLICY "Parents can update invitation tokens" ON invitation_tokens
    FOR UPDATE USING (auth.uid() = parent_id);

-- Admins can manage all invitation tokens
CREATE POLICY "Admins can manage all invitation tokens" ON invitation_tokens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Service role can accept invitations (unauthenticated users accepting invitations)
CREATE POLICY "Service can accept invitations" ON invitation_tokens
    FOR UPDATE USING (status = 'pending' AND expires_at > NOW())
    WITH CHECK (status = 'accepted');

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Check table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'invitation_tokens'
-- ORDER BY ordinal_position;

-- Check RLS policies:
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'invitation_tokens';

-- ================================
-- CLEANUP FUNCTION
-- ================================

-- Function to auto-expire old invitation tokens
CREATE OR REPLACE FUNCTION expire_old_invitation_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE invitation_tokens
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- Note: Uncomment if pg_cron is available in your Supabase project
-- SELECT cron.schedule(
--     'expire-invitation-tokens',
--     '0 * * * *', -- Every hour
--     'SELECT expire_old_invitation_tokens();'
-- );

-- ================================
-- ROLLBACK SCRIPT (if needed)
-- ================================

-- To rollback this migration:
-- DROP TABLE IF EXISTS invitation_tokens CASCADE;
-- DROP FUNCTION IF EXISTS expire_old_invitation_tokens;
