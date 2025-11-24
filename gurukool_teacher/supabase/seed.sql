-- Seed data for local testing

-- Insert test teacher
INSERT INTO teachers (id, email, name, created_at, updated_at)
VALUES 
  ('test-teacher-1', 'test@example.com', 'Test Teacher', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test student
INSERT INTO students (id, name, qr_code, created_at, updated_at)
VALUES 
  ('test-student-1', 'Test Student', 'QR123', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test session
INSERT INTO teacher_sessions (id, teacher_id, student_id, session_start, status, created_at, updated_at)
VALUES 
  ('test-session-1', 'test-teacher-1', 'test-student-1', NOW(), 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test QR code
INSERT INTO teacher_qr_codes (id, teacher_id, code, created_at, updated_at)
VALUES 
  ('test-qr-1', 'test-teacher-1', 'QR-TEACHER-1', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
