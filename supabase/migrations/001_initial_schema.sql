-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('parent', 'teacher', 'admin');
CREATE TYPE session_status AS ENUM ('scheduled', 'in-progress', 'completed', 'cancelled');
CREATE TYPE auth_status AS ENUM ('pending', 'success', 'expired', 'failed');
CREATE TYPE insight_type AS ENUM ('progress', 'recommendation', 'alert', 'prediction');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'parent',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    location JSONB NOT NULL DEFAULT '{}',
    status session_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication sessions table (for QR code auth)
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    token_data JSONB NOT NULL,
    ai_context JSONB,
    risk_score DECIMAL(3,2) DEFAULT 0.0,
    status auth_status DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights table
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type insight_type NOT NULL,
    content TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning analytics table
CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    subject VARCHAR(255) NOT NULL,
    progress_metrics JSONB DEFAULT '[]',
    learning_patterns JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX idx_sessions_parent_id ON sessions(parent_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_scheduled_start ON sessions(scheduled_start);
CREATE INDEX idx_auth_sessions_session_id ON auth_sessions(session_id);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX idx_auth_sessions_status ON auth_sessions(status);
CREATE INDEX idx_ai_insights_session_id ON ai_insights(session_id);
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(type);
CREATE INDEX idx_learning_analytics_student_id ON learning_analytics(student_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_sessions_updated_at BEFORE UPDATE ON auth_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_analytics_updated_at BEFORE UPDATE ON learning_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Teachers can read sessions they're assigned to
CREATE POLICY "Teachers can read assigned sessions" ON sessions
    FOR SELECT USING (
        auth.uid()::text = teacher_id::text OR 
        auth.uid()::text = parent_id::text
    );

-- Teachers and parents can update sessions they're involved in
CREATE POLICY "Users can update involved sessions" ON sessions
    FOR UPDATE USING (
        auth.uid()::text = teacher_id::text OR 
        auth.uid()::text = parent_id::text
    );

-- Users can read AI insights related to their sessions
CREATE POLICY "Users can read related AI insights" ON ai_insights
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        EXISTS (
            SELECT 1 FROM sessions s 
            WHERE s.id = ai_insights.session_id 
            AND (s.teacher_id::text = auth.uid()::text OR s.parent_id::text = auth.uid()::text)
        )
    );

-- Users can read learning analytics for their students
CREATE POLICY "Users can read student analytics" ON learning_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s 
            WHERE s.student_id::text = learning_analytics.student_id::text 
            AND (s.teacher_id::text = auth.uid()::text OR s.parent_id::text = auth.uid()::text)
        )
    );

-- Insert demo data
INSERT INTO users (id, email, name, role, preferences) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'teacher@example.com', 'John Teacher', 'teacher', '{"notifications": {"email": true, "push": true, "sms": false, "inApp": true, "frequency": "immediate"}, "dashboard": {"layout": "detailed", "theme": "light", "widgets": ["sessions", "analytics", "notifications"]}, "privacy": {"dataSharing": false, "analytics": true, "aiTraining": true}, "accessibility": {"fontSize": "medium", "highContrast": false, "reducedMotion": false, "screenReader": false}}'),
    ('550e8400-e29b-41d4-a716-446655440002', 'parent@example.com', 'Jane Parent', 'parent', '{"notifications": {"email": true, "push": true, "sms": true, "inApp": true, "frequency": "immediate"}, "dashboard": {"layout": "compact", "theme": "light", "widgets": ["sessions", "progress", "notifications"]}, "privacy": {"dataSharing": false, "analytics": true, "aiTraining": true}, "accessibility": {"fontSize": "medium", "highContrast": false, "reducedMotion": false, "screenReader": false}}'),
    ('550e8400-e29b-41d4-a716-446655440003', 'admin@example.com', 'Admin User', 'admin', '{"notifications": {"email": true, "push": true, "sms": false, "inApp": true, "frequency": "immediate"}, "dashboard": {"layout": "detailed", "theme": "light", "widgets": ["users", "sessions", "analytics", "system"]}, "privacy": {"dataSharing": false, "analytics": true, "aiTraining": true}, "accessibility": {"fontSize": "medium", "highContrast": false, "reducedMotion": false, "screenReader": false}}');

-- Insert demo sessions
INSERT INTO sessions (id, student_id, teacher_id, parent_id, subject, scheduled_start, scheduled_end, location, status) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Mathematics', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', '{"address": "123 Main St, Anytown, USA", "coordinates": {"latitude": 40.7128, "longitude": -74.0060}, "verified": true}', 'scheduled'),
    ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Science', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1.5 hours', '{"address": "123 Main St, Anytown, USA", "coordinates": {"latitude": 40.7128, "longitude": -74.0060}, "verified": true}', 'scheduled'),
    ('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'English', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '2 hours', '{"address": "456 Oak Ave, Anytown, USA", "coordinates": {"latitude": 40.7589, "longitude": -73.9851}, "verified": true}', 'completed');

-- Insert demo AI insights
INSERT INTO ai_insights (session_id, user_id, type, content, confidence, metadata) VALUES
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'progress', 'Student shows excellent progress in reading comprehension', 0.92, '{"subject": "English", "metrics": {"comprehension": 0.95, "engagement": 0.88}}'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'recommendation', 'Consider introducing more advanced vocabulary exercises', 0.85, '{"subject": "English", "difficulty_level": "intermediate_to_advanced"}');

-- Insert demo learning analytics
INSERT INTO learning_analytics (student_id, subject, progress_metrics, learning_patterns, recommendations) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'Mathematics', '[{"metric": "problem_solving", "value": 0.85, "trend": "improving", "period": "last_month"}]', '[{"pattern": "visual_learner", "frequency": 0.8, "impact": "positive", "confidence": 0.9}]', '[{"id": "math_rec_1", "type": "resource", "title": "Visual Math Tools", "description": "Use more visual aids for problem solving", "priority": "medium", "actionable": true}]'),
    ('770e8400-e29b-41d4-a716-446655440001', 'Science', '[{"metric": "experimental_understanding", "value": 0.78, "trend": "stable", "period": "last_month"}]', '[{"pattern": "hands_on_learner", "frequency": 0.9, "impact": "positive", "confidence": 0.95}]', '[{"id": "sci_rec_1", "type": "action", "title": "More Lab Experiments", "description": "Increase hands-on experimental activities", "priority": "high", "actionable": true}]');

-- Create function to cleanup expired auth sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user session statistics
CREATE OR REPLACE FUNCTION get_user_session_stats(user_uuid UUID, user_role_param user_role)
RETURNS TABLE(
    total_sessions BIGINT,
    completed_sessions BIGINT,
    upcoming_sessions BIGINT,
    completion_rate DECIMAL
) AS $$
BEGIN
    IF user_role_param = 'teacher' THEN
        RETURN QUERY
        SELECT 
            COUNT(*) as total_sessions,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
            COUNT(*) FILTER (WHERE status = 'scheduled' AND scheduled_start > NOW()) as upcoming_sessions,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND(COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*) * 100, 2)
                ELSE 0 
            END as completion_rate
        FROM sessions 
        WHERE teacher_id = user_uuid;
    ELSE
        RETURN QUERY
        SELECT 
            COUNT(*) as total_sessions,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
            COUNT(*) FILTER (WHERE status = 'scheduled' AND scheduled_start > NOW()) as upcoming_sessions,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND(COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*) * 100, 2)
                ELSE 0 
            END as completion_rate
        FROM sessions 
        WHERE parent_id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;