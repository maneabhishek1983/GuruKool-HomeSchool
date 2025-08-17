-- Teacher QR Codes table for student-specific authentication
-- Each teacher gets unique QR codes for each student they're assigned to

CREATE TABLE teacher_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL, -- Encoded QR code data
    qr_code_type VARCHAR(50) NOT NULL DEFAULT 'student_auth', -- 'student_auth', 'admin_auth', etc.
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, student_id, qr_code_type)
);

-- Teacher Session Logs table for tracking sign-in/sign-out
CREATE TABLE teacher_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'sign_in', 'sign_out'
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    location JSONB DEFAULT '{}', -- GPS coordinates, address
    notes TEXT,
    qr_code_used UUID REFERENCES teacher_qr_codes(id),
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_teacher_qr_codes_teacher_id ON teacher_qr_codes(teacher_id);
CREATE INDEX idx_teacher_qr_codes_student_id ON teacher_qr_codes(student_id);
CREATE INDEX idx_teacher_qr_codes_parent_id ON teacher_qr_codes(parent_id);
CREATE INDEX idx_teacher_qr_codes_active ON teacher_qr_codes(is_active);
CREATE INDEX idx_teacher_sessions_teacher_id ON teacher_sessions(teacher_id);
CREATE INDEX idx_teacher_sessions_student_id ON teacher_sessions(student_id);
CREATE INDEX idx_teacher_sessions_parent_id ON teacher_sessions(parent_id);
CREATE INDEX idx_teacher_sessions_session_start ON teacher_sessions(session_start);
CREATE INDEX idx_teacher_sessions_session_type ON teacher_sessions(session_type);

-- Create triggers for updated_at
CREATE TRIGGER update_teacher_qr_codes_updated_at BEFORE UPDATE ON teacher_qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_sessions_updated_at BEFORE UPDATE ON teacher_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE teacher_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_sessions ENABLE ROW LEVEL SECURITY;

-- Teacher QR Codes policies
CREATE POLICY "Parents can view their own teacher QR codes" ON teacher_qr_codes
    FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create teacher QR codes" ON teacher_qr_codes
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own teacher QR codes" ON teacher_qr_codes
    FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own teacher QR codes" ON teacher_qr_codes
    FOR DELETE USING (auth.uid() = parent_id);

-- Teacher Sessions policies
CREATE POLICY "Parents can view their own teacher sessions" ON teacher_sessions
    FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create teacher sessions" ON teacher_sessions
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own teacher sessions" ON teacher_sessions
    FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own teacher sessions" ON teacher_sessions
    FOR DELETE USING (auth.uid() = parent_id);

-- Teachers can view their own sessions
CREATE POLICY "Teachers can view their own sessions" ON teacher_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers 
            WHERE teachers.id = teacher_sessions.teacher_id 
            AND teachers.user_id = auth.uid()
        )
    );

-- Teachers can create their own sessions
CREATE POLICY "Teachers can create their own sessions" ON teacher_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teachers 
            WHERE teachers.id = teacher_sessions.teacher_id 
            AND teachers.user_id = auth.uid()
        )
    );

-- Teachers can update their own sessions
CREATE POLICY "Teachers can update their own sessions" ON teacher_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teachers 
            WHERE teachers.id = teacher_sessions.teacher_id 
            AND teachers.user_id = auth.uid()
        )
    );
