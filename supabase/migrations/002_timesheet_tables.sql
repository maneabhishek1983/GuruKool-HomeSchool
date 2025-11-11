-- Timesheet Tables for QR Check-In/Out System
-- This migration creates tables for tracking teacher check-ins and check-outs

-- Parent QR Codes Table
CREATE TABLE IF NOT EXISTS parent_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  qr_code_data TEXT NOT NULL,
  qr_code_image TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT unique_active_parent_student UNIQUE (parent_id, student_id, is_active)
);

-- Timesheet Entries Table
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_code_id UUID NOT NULL REFERENCES parent_qr_codes(id) ON DELETE RESTRICT,
  
  -- Time tracking
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Location data (JSONB for flexibility)
  location JSONB DEFAULT '{}'::jsonb,
  
  -- Session details
  notes TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('checked_in', 'checked_out')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_out_after_check_in CHECK (
    check_out_time IS NULL OR check_out_time > check_in_time
  ),
  CONSTRAINT duration_positive CHECK (
    duration_minutes IS NULL OR duration_minutes >= 0
  )
);

-- Indexes for performance
CREATE INDEX idx_parent_qr_codes_parent_id ON parent_qr_codes(parent_id);
CREATE INDEX idx_parent_qr_codes_student_id ON parent_qr_codes(student_id);
CREATE INDEX idx_parent_qr_codes_active ON parent_qr_codes(is_active) WHERE is_active = true;

CREATE INDEX idx_timesheet_entries_teacher_id ON timesheet_entries(teacher_id);
CREATE INDEX idx_timesheet_entries_student_id ON timesheet_entries(student_id);
CREATE INDEX idx_timesheet_entries_parent_id ON timesheet_entries(parent_id);
CREATE INDEX idx_timesheet_entries_status ON timesheet_entries(status);
CREATE INDEX idx_timesheet_entries_check_in_time ON timesheet_entries(check_in_time DESC);
CREATE INDEX idx_timesheet_entries_teacher_status ON timesheet_entries(teacher_id, status);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_parent_qr_codes_updated_at
  BEFORE UPDATE ON parent_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timesheet_entries_updated_at
  BEFORE UPDATE ON timesheet_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate duration on check-out
CREATE OR REPLACE FUNCTION calculate_timesheet_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate duration
CREATE TRIGGER calculate_duration_on_checkout
  BEFORE INSERT OR UPDATE ON timesheet_entries
  FOR EACH ROW
  WHEN (NEW.check_out_time IS NOT NULL)
  EXECUTE FUNCTION calculate_timesheet_duration();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE parent_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Parent QR Codes Policies
CREATE POLICY "Parents can view their own QR codes"
  ON parent_qr_codes FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their own QR codes"
  ON parent_qr_codes FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own QR codes"
  ON parent_qr_codes FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Teachers can view QR codes for their students"
  ON parent_qr_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_assignments
      WHERE teacher_id = auth.uid()
      AND student_id = parent_qr_codes.student_id
      AND is_active = true
    )
  );

-- Timesheet Entries Policies
CREATE POLICY "Teachers can view their own timesheet entries"
  ON timesheet_entries FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own timesheet entries"
  ON timesheet_entries FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own timesheet entries"
  ON timesheet_entries FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Parents can view timesheet entries for their students"
  ON timesheet_entries FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Admins can view all timesheet entries"
  ON timesheet_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Views for reporting

-- Teacher timesheet summary view
CREATE OR REPLACE VIEW teacher_timesheet_summary AS
SELECT
  t.teacher_id,
  u.name as teacher_name,
  u.email as teacher_email,
  COUNT(*) as total_sessions,
  SUM(CASE WHEN t.status = 'checked_out' THEN 1 ELSE 0 END) as completed_sessions,
  SUM(CASE WHEN t.status = 'checked_in' THEN 1 ELSE 0 END) as active_sessions,
  SUM(t.duration_minutes) as total_minutes,
  ROUND(SUM(t.duration_minutes)::numeric / 60, 2) as total_hours,
  MIN(t.check_in_time) as first_check_in,
  MAX(t.check_in_time) as last_check_in
FROM timesheet_entries t
JOIN users u ON t.teacher_id = u.id
GROUP BY t.teacher_id, u.name, u.email;

-- Parent timesheet summary view
CREATE OR REPLACE VIEW parent_timesheet_summary AS
SELECT
  t.parent_id,
  u.name as parent_name,
  u.email as parent_email,
  t.student_id,
  s.name as student_name,
  COUNT(*) as total_sessions,
  SUM(CASE WHEN t.status = 'checked_out' THEN 1 ELSE 0 END) as completed_sessions,
  SUM(t.duration_minutes) as total_minutes,
  ROUND(SUM(t.duration_minutes)::numeric / 60, 2) as total_hours,
  MIN(t.check_in_time) as first_check_in,
  MAX(t.check_in_time) as last_check_in
FROM timesheet_entries t
JOIN users u ON t.parent_id = u.id
JOIN students s ON t.student_id = s.id
GROUP BY t.parent_id, u.name, u.email, t.student_id, s.name;

-- Grant permissions on views
GRANT SELECT ON teacher_timesheet_summary TO authenticated;
GRANT SELECT ON parent_timesheet_summary TO authenticated;

-- Comments for documentation
COMMENT ON TABLE parent_qr_codes IS 'Stores QR codes generated for parents that teachers scan for check-in/out';
COMMENT ON TABLE timesheet_entries IS 'Records teacher check-in and check-out times for timesheet tracking';
COMMENT ON COLUMN timesheet_entries.duration_minutes IS 'Automatically calculated duration between check-in and check-out';
COMMENT ON COLUMN timesheet_entries.location IS 'JSONB field storing location data (latitude, longitude, address)';
COMMENT ON VIEW teacher_timesheet_summary IS 'Aggregated timesheet data per teacher';
COMMENT ON VIEW parent_timesheet_summary IS 'Aggregated timesheet data per parent and student';
