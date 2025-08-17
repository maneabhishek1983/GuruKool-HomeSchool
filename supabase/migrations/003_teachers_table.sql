-- Teachers table for dedicated teacher management
-- This provides better structure than just using the users table

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Parent who created this teacher
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subjects JSONB NOT NULL DEFAULT '[]', -- Array of subjects they teach
    experience_years INTEGER DEFAULT 0,
    qualifications JSONB DEFAULT '[]', -- Array of qualifications
    specializations JSONB DEFAULT '[]', -- Array of specializations
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    availability JSONB DEFAULT '{}', -- {days: ['monday', 'tuesday'], timeSlots: ['9:00-12:00', '14:00-17:00']}
    location JSONB DEFAULT '{}', -- {address: 'string', coordinates: {lat: 0, lng: 0}}
    bio TEXT,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'assigned', 'unavailable'
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, parent_id)
);

-- Create indexes for better performance
CREATE INDEX idx_teachers_parent_id ON teachers(parent_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_status ON teachers(status);
CREATE INDEX idx_teachers_subjects ON teachers USING GIN(subjects);

-- Create trigger for updated_at
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can only see teachers they created
CREATE POLICY "Parents can view their own teachers" ON teachers
    FOR SELECT USING (auth.uid() = parent_id);

-- Policy: Parents can insert teachers
CREATE POLICY "Parents can create teachers" ON teachers
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

-- Policy: Parents can update their own teachers
CREATE POLICY "Parents can update their own teachers" ON teachers
    FOR UPDATE USING (auth.uid() = parent_id);

-- Policy: Parents can delete their own teachers
CREATE POLICY "Parents can delete their own teachers" ON teachers
    FOR DELETE USING (auth.uid() = parent_id);

-- Update students table to include teacher assignments
ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_teachers JSONB DEFAULT '[]';
ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
