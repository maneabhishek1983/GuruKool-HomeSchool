-- Additional schema for Phase 2 features
-- Data Sheets, Country-based Syllabus, and Enhanced User Management

-- Create additional custom types
CREATE TYPE country_code AS ENUM ('UK', 'US', 'INDIA');
CREATE TYPE activity_type AS ENUM ('sensory', 'writing', 'communication', 'social', 'academics');
CREATE TYPE activity_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped');
CREATE TYPE grade_system AS ENUM ('uk_year', 'us_grade', 'india_class');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'deleted');

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 3 AND age <= 18),
    country country_code NOT NULL DEFAULT 'UK',
    grade_level VARCHAR(50) NOT NULL, -- e.g., 'Reception', 'Grade 1', 'Class 1'
    grade_system grade_system NOT NULL,
    birth_date DATE,
    learning_preferences JSONB DEFAULT '{}',
    special_needs JSONB DEFAULT '[]',
    academic_standards JSONB DEFAULT '{}', -- Country-specific standards
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academic Standards table (country-specific curricula)
CREATE TABLE academic_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country country_code NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    grade_system grade_system NOT NULL,
    subject VARCHAR(255) NOT NULL,
    standards JSONB NOT NULL DEFAULT '[]', -- Array of learning objectives
    assessment_criteria JSONB DEFAULT '{}',
    age_range JSONB NOT NULL, -- {min_age: 5, max_age: 6}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(country, grade_level, subject)
);

-- Data Sheets table
CREATE TABLE data_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activities JSONB NOT NULL DEFAULT '[]', -- Array of activity objects
    progress_summary JSONB DEFAULT '{}',
    challenges JSONB DEFAULT '[]',
    prompts JSONB DEFAULT '[]',
    notes TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    template_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Sheet Activities table
CREATE TABLE data_sheet_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_sheet_id UUID NOT NULL REFERENCES data_sheets(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status activity_status DEFAULT 'scheduled',
    progress_notes TEXT,
    prompts_used JSONB DEFAULT '[]',
    challenges_encountered JSONB DEFAULT '[]',
    success_indicators JSONB DEFAULT '[]',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    observations TEXT,
    next_steps TEXT,
    attachments JSONB DEFAULT '[]', -- Photos, videos, documents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Communication table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants JSONB NOT NULL, -- Array of user IDs
    conversation_type VARCHAR(50) NOT NULL DEFAULT 'group', -- 'direct', 'group', 'announcement'
    title VARCHAR(255),
    context JSONB DEFAULT '{}', -- Student, session, or topic context
    is_archived BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    attachments JSONB DEFAULT '[]',
    read_by JSONB DEFAULT '[]', -- Array of user IDs who have read this message
    replied_to UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher assignments table
CREATE TABLE teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subjects JSONB NOT NULL DEFAULT '[]', -- Array of subjects
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, student_id, parent_id)
);

-- User accounts enhancement (extend existing users table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS qualifications JSONB DEFAULT '[]'; -- For teachers
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'; -- For teachers
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'; -- For teachers
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}';

-- Progress tracking table
CREATE TABLE progress_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    data_sheet_id UUID REFERENCES data_sheets(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES data_sheet_activities(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    skill_area VARCHAR(255) NOT NULL,
    progress_data JSONB NOT NULL DEFAULT '{}',
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    measured_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_country ON students(country);
CREATE INDEX idx_students_grade_system ON students(grade_system);
CREATE INDEX idx_academic_standards_country_grade ON academic_standards(country, grade_level);
CREATE INDEX idx_data_sheets_student_id ON data_sheets(student_id);
CREATE INDEX idx_data_sheets_date ON data_sheets(date);
CREATE INDEX idx_data_sheet_activities_data_sheet_id ON data_sheet_activities(data_sheet_id);
CREATE INDEX idx_data_sheet_activities_type ON data_sheet_activities(activity_type);
CREATE INDEX idx_data_sheet_activities_status ON data_sheet_activities(status);
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_student_id ON teacher_assignments(student_id);
CREATE INDEX idx_progress_tracking_student_id ON progress_tracking(student_id);
CREATE INDEX idx_progress_tracking_subject ON progress_tracking(subject);

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_standards_updated_at BEFORE UPDATE ON academic_standards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sheets_updated_at BEFORE UPDATE ON data_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sheet_activities_updated_at BEFORE UPDATE ON data_sheet_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_assignments_updated_at BEFORE UPDATE ON teacher_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_tracking_updated_at BEFORE UPDATE ON progress_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sheet_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Parents can manage their students" ON students
    FOR ALL USING (auth.uid()::text = parent_id::text);

CREATE POLICY "Teachers can read assigned students" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teacher_assignments ta 
            WHERE ta.student_id = students.id 
            AND ta.teacher_id::text = auth.uid()::text 
            AND ta.is_active = true
        )
    );

-- Academic standards are readable by all authenticated users
CREATE POLICY "Users can read academic standards" ON academic_standards
    FOR SELECT USING (auth.role() = 'authenticated');

-- Data sheets policies
CREATE POLICY "Parents and assigned teachers can manage data sheets" ON data_sheets
    FOR ALL USING (
        auth.uid()::text = parent_id::text OR
        (teacher_id IS NOT NULL AND auth.uid()::text = teacher_id::text) OR
        EXISTS (
            SELECT 1 FROM students s 
            JOIN teacher_assignments ta ON s.id = ta.student_id 
            WHERE s.id = data_sheets.student_id 
            AND ta.teacher_id::text = auth.uid()::text 
            AND ta.is_active = true
        )
    );

-- Data sheet activities inherit permissions from data sheets
CREATE POLICY "Users with data sheet access can manage activities" ON data_sheet_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM data_sheets ds 
            WHERE ds.id = data_sheet_activities.data_sheet_id 
            AND (
                auth.uid()::text = ds.parent_id::text OR
                (ds.teacher_id IS NOT NULL AND auth.uid()::text = ds.teacher_id::text) OR
                EXISTS (
                    SELECT 1 FROM students s 
                    JOIN teacher_assignments ta ON s.id = ta.student_id 
                    WHERE s.id = ds.student_id 
                    AND ta.teacher_id::text = auth.uid()::text 
                    AND ta.is_active = true
                )
            )
        )
    );

-- Conversations policies
CREATE POLICY "Users can read conversations they participate in" ON conversations
    FOR SELECT USING (participants ? auth.uid()::text);

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

-- Messages policies
CREATE POLICY "Users can read messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = messages.conversation_id 
            AND c.participants ? auth.uid()::text
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid()::text = sender_id::text AND
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = messages.conversation_id 
            AND c.participants ? auth.uid()::text
        )
    );

-- Teacher assignments policies
CREATE POLICY "Parents and teachers can read their assignments" ON teacher_assignments
    FOR SELECT USING (
        auth.uid()::text = parent_id::text OR 
        auth.uid()::text = teacher_id::text
    );

CREATE POLICY "Parents can manage teacher assignments" ON teacher_assignments
    FOR ALL USING (auth.uid()::text = parent_id::text);

-- Progress tracking policies
CREATE POLICY "Parents and assigned teachers can manage progress" ON progress_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = progress_tracking.student_id 
            AND (
                auth.uid()::text = s.parent_id::text OR
                EXISTS (
                    SELECT 1 FROM teacher_assignments ta 
                    WHERE ta.student_id = s.id 
                    AND ta.teacher_id::text = auth.uid()::text 
                    AND ta.is_active = true
                )
            )
        )
    );

-- Insert academic standards data for UK, US, and India
INSERT INTO academic_standards (country, grade_level, grade_system, subject, standards, assessment_criteria, age_range) VALUES
-- UK Standards
('UK', 'Reception', 'uk_year', 'Mathematics', 
 '[{"code": "R-M1", "title": "Numbers to 10", "description": "Count and recognize numbers 1-10"}, {"code": "R-M2", "title": "Simple Addition", "description": "Add two numbers with total up to 10"}]',
 '{"formative": ["observation", "play_based"], "summative": ["baseline_assessment"]}',
 '{"min_age": 4, "max_age": 5}'),

('UK', 'Year 1', 'uk_year', 'Mathematics',
 '[{"code": "Y1-M1", "title": "Numbers to 20", "description": "Count, read and write numbers to 20"}, {"code": "Y1-M2", "title": "Addition and Subtraction", "description": "Add and subtract one-digit and two-digit numbers to 20"}]',
 '{"formative": ["observation", "questioning"], "summative": ["end_of_year_assessment"]}',
 '{"min_age": 5, "max_age": 6}'),

('UK', 'Reception', 'uk_year', 'English',
 '[{"code": "R-E1", "title": "Phonics Phase 2", "description": "Know letter sounds s a t p i n"}, {"code": "R-E2", "title": "Reading Simple Words", "description": "Read simple CVC words"}]',
 '{"formative": ["reading_observation", "phonics_check"], "summative": ["baseline_assessment"]}',
 '{"min_age": 4, "max_age": 5}'),

-- US Standards
('US', 'Kindergarten', 'us_grade', 'Mathematics',
 '[{"code": "K.CC.1", "title": "Count to 100", "description": "Count to 100 by ones and by tens"}, {"code": "K.OA.1", "title": "Addition and Subtraction", "description": "Represent addition and subtraction within 10"}]',
 '{"formative": ["portfolio", "observation"], "summative": ["district_assessment"]}',
 '{"min_age": 5, "max_age": 6}'),

('US', 'Grade 1', 'us_grade', 'Mathematics',
 '[{"code": "1.NBT.1", "title": "Numbers to 120", "description": "Count to 120, starting at any number less than 120"}, {"code": "1.OA.1", "title": "Addition and Subtraction Stories", "description": "Use addition and subtraction within 20 to solve problems"}]',
 '{"formative": ["exit_tickets", "math_journals"], "summative": ["standardized_test"]}',
 '{"min_age": 6, "max_age": 7}'),

('US', 'Kindergarten', 'us_grade', 'English Language Arts',
 '[{"code": "K.RF.2", "title": "Phonological Awareness", "description": "Demonstrate understanding of spoken words, syllables, and sounds"}, {"code": "K.RF.3", "title": "Phonics", "description": "Know and apply grade-level phonics and word analysis skills"}]',
 '{"formative": ["running_records", "phonics_inventory"], "summative": ["dibels"]}',
 '{"min_age": 5, "max_age": 6}'),

-- India Standards
('INDIA', 'Class 1', 'india_class', 'Mathematics',
 '[{"code": "I1-M1", "title": "Numbers 1-99", "description": "Recognize and write numbers 1-99"}, {"code": "I1-M2", "title": "Basic Operations", "description": "Add and subtract numbers within 20"}]',
 '{"formative": ["observation", "oral_assessment"], "summative": ["unit_test"]}',
 '{"min_age": 6, "max_age": 7}'),

('INDIA', 'Class 2', 'india_class', 'Mathematics',
 '[{"code": "I2-M1", "title": "Numbers to 999", "description": "Read, write and compare numbers up to 999"}, {"code": "I2-M2", "title": "Two-digit Addition", "description": "Add and subtract two-digit numbers"}]',
 '{"formative": ["worksheets", "group_work"], "summative": ["quarterly_exam"]}',
 '{"min_age": 7, "max_age": 8}'),

('INDIA', 'Class 1', 'india_class', 'English',
 '[{"code": "I1-E1", "title": "Letter Recognition", "description": "Recognize and write all letters of the alphabet"}, {"code": "I1-E2", "title": "Simple Words", "description": "Read and write simple three-letter words"}]',
 '{"formative": ["reading_aloud", "writing_samples"], "summative": ["term_exam"]}',
 '{"min_age": 6, "max_age": 7}');

-- Insert demo students
INSERT INTO students (id, parent_id, name, age, country, grade_level, grade_system, birth_date, learning_preferences, academic_standards) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Emma Johnson', 6, 'UK', 'Year 1', 'uk_year', '2018-03-15', 
 '{"learning_style": "visual", "interests": ["mathematics", "art"], "attention_span": "medium", "preferred_time": "morning"}',
 '{"mathematics": ["Y1-M1", "Y1-M2"], "english": ["Y1-E1", "Y1-E2"]}'),

('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Oliver Smith', 5, 'US', 'Kindergarten', 'us_grade', '2019-08-22',
 '{"learning_style": "kinesthetic", "interests": ["science", "building"], "attention_span": "short", "preferred_time": "afternoon"}',
 '{"mathematics": ["K.CC.1", "K.OA.1"], "english": ["K.RF.2", "K.RF.3"]}');

-- Insert demo data sheets
INSERT INTO data_sheets (id, student_id, teacher_id, parent_id, date, title, description, activities, progress_summary) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'Daily Learning Activities - Week 1', 'Comprehensive daily tracking for Emma focusing on core subjects and developmental areas',
 '[]', '{"overall_progress": 85, "areas_of_strength": ["mathematics", "social_skills"], "areas_for_improvement": ["writing", "attention_span"]}');

-- Insert demo data sheet activities
INSERT INTO data_sheet_activities (data_sheet_id, activity_type, activity_name, description, scheduled_time, status, progress_notes, success_indicators, rating) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'academics', 'Number Recognition Practice', 'Practice recognizing and writing numbers 1-20', NOW() + INTERVAL '1 hour', 'scheduled', null, '["recognizes_15_numbers", "writes_10_numbers_correctly"]', null),
('880e8400-e29b-41d4-a716-446655440001', 'writing', 'Letter Formation Practice', 'Practice forming letters A-J with proper grip', NOW() + INTERVAL '2 hours', 'scheduled', null, '["correct_pencil_grip", "forms_5_letters_correctly"]', null),
('880e8400-e29b-41d4-a716-446655440001', 'social', 'Collaborative Art Project', 'Work with another student on a art project', NOW() + INTERVAL '3 hours', 'scheduled', null, '["shares_materials", "communicates_ideas", "takes_turns"]', null),
('880e8400-e29b-41d4-a716-446655440001', 'sensory', 'Texture Exploration', 'Explore different textures and describe feelings', NOW() + INTERVAL '4 hours', 'scheduled', null, '["identifies_3_textures", "uses_descriptive_words"]', null),
('880e8400-e29b-41d4-a716-446655440001', 'communication', 'Story Telling Session', 'Tell a simple story using picture cards', NOW() + INTERVAL '5 hours', 'scheduled', null, '["uses_complete_sentences", "maintains_story_sequence"]', null);

-- Insert demo teacher assignment
INSERT INTO teacher_assignments (teacher_id, student_id, parent_id, subjects, start_date, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 
 '["Mathematics", "English", "Science"]', CURRENT_DATE, 'Primary teacher for core subjects. Focus on building foundational skills.');

-- Create functions for data sheet management
CREATE OR REPLACE FUNCTION create_data_sheet_from_template(
    template_id UUID,
    student_id_param UUID,
    teacher_id_param UUID,
    parent_id_param UUID,
    scheduled_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    new_sheet_id UUID;
    template_activities RECORD;
BEGIN
    -- Create new data sheet from template
    INSERT INTO data_sheets (student_id, teacher_id, parent_id, date, title, description, activities)
    SELECT student_id_param, teacher_id_param, parent_id_param, scheduled_date, title, description, activities
    FROM data_sheets 
    WHERE id = template_id AND is_template = true
    RETURNING id INTO new_sheet_id;
    
    -- Copy activities from template
    INSERT INTO data_sheet_activities (
        data_sheet_id, activity_type, activity_name, description, 
        scheduled_time, success_indicators, prompts_used
    )
    SELECT 
        new_sheet_id, activity_type, activity_name, description,
        scheduled_date + (scheduled_time::time), success_indicators, prompts_used
    FROM data_sheet_activities 
    WHERE data_sheet_id = template_id;
    
    RETURN new_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get student progress summary
CREATE OR REPLACE FUNCTION get_student_progress_summary(
  student_id_param uuid,
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  activity_type text,
  total_activities bigint,
  completed_activities bigint,
  average_rating numeric,
  progress_trend text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dsa.activity_type::text,
    COUNT(*) as total_activities,
    COUNT(*) FILTER (WHERE dsa.status = 'completed') as completed_activities,
    ROUND(AVG(dsa.rating) FILTER (WHERE dsa.rating IS NOT NULL), 2) as average_rating,
    CASE
      WHEN (AVG(dsa.rating) FILTER (WHERE dsa.rating IS NOT NULL AND dsa.created_at >= NOW() - INTERVAL '14 days')) >
           (AVG(dsa.rating) FILTER (WHERE dsa.rating IS NOT NULL AND dsa.created_at < NOW() - INTERVAL '14 days'))
      THEN 'improving'
      WHEN (AVG(dsa.rating) FILTER (WHERE dsa.rating IS NOT NULL AND dsa.created_at >= NOW() - INTERVAL '14 days')) <
           (AVG(dsa.rating) FILTER (WHERE dsa.rating IS NOT NULL AND dsa.created_at < NOW() - INTERVAL '14 days'))
      THEN 'declining'
      ELSE 'stable'
    END as progress_trend
  FROM data_sheet_activities dsa
  JOIN data_sheets ds ON dsa.data_sheet_id = ds.id
  WHERE ds.student_id = student_id_param
    AND dsa.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY dsa.activity_type;
END;
$$ LANGUAGE plpgsql STABLE;