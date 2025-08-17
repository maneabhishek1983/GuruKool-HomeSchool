-- Timesheet and Session Management Schema
-- This migration adds the missing tables for timesheet tracking, sessions, and billing

-- Create additional custom types
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled', 'paused');
CREATE TYPE billing_status AS ENUM ('pending', 'billed', 'paid', 'disputed');
CREATE TYPE payment_method AS ENUM ('credit_card', 'bank_transfer', 'paypal', 'cash');

-- Timesheets table
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    actual_duration INTEGER, -- in minutes
    break_duration INTEGER DEFAULT 0, -- in minutes
    location_start JSONB, -- GPS coordinates
    location_end JSONB, -- GPS coordinates
    location_verifications JSONB DEFAULT '[]',
    billing_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    rate_type VARCHAR(20) DEFAULT 'hourly', -- 'hourly', 'fixed', 'session'
    status session_status DEFAULT 'scheduled',
    notes TEXT,
    auto_generated BOOLEAN DEFAULT FALSE,
    verification_level VARCHAR(20) DEFAULT 'none', -- 'none', 'basic', 'gps', 'enhanced'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status session_status DEFAULT 'scheduled',
    location JSONB, -- GPS coordinates or address
    notes TEXT,
    objectives JSONB DEFAULT '[]', -- Learning objectives
    materials JSONB DEFAULT '[]', -- Required materials
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing table
CREATE TABLE billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status billing_status DEFAULT 'pending',
    description TEXT,
    line_items JSONB DEFAULT '[]', -- Detailed line items
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_id UUID NOT NULL REFERENCES billing(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method payment_method NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher rates table
CREATE TABLE teacher_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    rate_type VARCHAR(20) DEFAULT 'hourly', -- 'hourly', 'fixed', 'session'
    rate_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, subject, effective_date)
);

-- Create indexes for better performance
CREATE INDEX idx_timesheets_teacher_id ON timesheets(teacher_id);
CREATE INDEX idx_timesheets_student_id ON timesheets(student_id);
CREATE INDEX idx_timesheets_session_id ON timesheets(session_id);
CREATE INDEX idx_timesheets_start_time ON timesheets(start_time);
CREATE INDEX idx_timesheets_status ON timesheets(status);

CREATE INDEX idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_scheduled_start ON sessions(scheduled_start);
CREATE INDEX idx_sessions_status ON sessions(status);

CREATE INDEX idx_billing_timesheet_id ON billing(timesheet_id);
CREATE INDEX idx_billing_teacher_id ON billing(teacher_id);
CREATE INDEX idx_billing_parent_id ON billing(parent_id);
CREATE INDEX idx_billing_status ON billing(status);
CREATE INDEX idx_billing_billing_date ON billing(billing_date);

CREATE INDEX idx_payments_billing_id ON payments(billing_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_teacher_rates_teacher_id ON teacher_rates(teacher_id);
CREATE INDEX idx_teacher_rates_subject ON teacher_rates(subject);
CREATE INDEX idx_teacher_rates_is_active ON teacher_rates(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_rates_updated_at BEFORE UPDATE ON teacher_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for timesheet management

-- Function to calculate timesheet duration
CREATE OR REPLACE FUNCTION calculate_timesheet_duration(
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER AS $$
BEGIN
    IF end_time IS NULL THEN
        RETURN EXTRACT(EPOCH FROM (NOW() - start_time)) / 60;
    ELSE
        RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 60;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate timesheet amount
CREATE OR REPLACE FUNCTION calculate_timesheet_amount(
    duration_minutes INTEGER,
    hourly_rate DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN (duration_minutes / 60.0) * hourly_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS VARCHAR(50) AS $$
DECLARE
    next_number INTEGER;
    invoice_number VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1
    INTO next_number
    FROM billing
    WHERE invoice_number LIKE 'INV-%';
    
    invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create billing record from timesheet
CREATE OR REPLACE FUNCTION create_billing_from_timesheet(
    timesheet_uuid UUID
) RETURNS UUID AS $$
DECLARE
    billing_id UUID;
    timesheet_record RECORD;
BEGIN
    -- Get timesheet details
    SELECT * INTO timesheet_record
    FROM timesheets
    WHERE id = timesheet_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timesheet not found';
    END IF;
    
    -- Create billing record
    INSERT INTO billing (
        timesheet_id,
        teacher_id,
        parent_id,
        invoice_number,
        amount,
        currency,
        total_amount,
        description
    ) VALUES (
        timesheet_uuid,
        timesheet_record.teacher_id,
        timesheet_record.parent_id,
        generate_invoice_number(),
        timesheet_record.total_amount,
        timesheet_record.currency,
        timesheet_record.total_amount,
        'Session with student ID: ' || timesheet_record.student_id
    ) RETURNING id INTO billing_id;
    
    RETURN billing_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for demonstration
INSERT INTO teacher_rates (teacher_id, subject, rate_amount, currency) VALUES
('teacher-1', 'Mathematics', 25.00, 'USD'),
('teacher-1', 'Science', 25.00, 'USD'),
('teacher-1', 'English', 22.00, 'USD');

-- Add comments for documentation
COMMENT ON TABLE timesheets IS 'Tracks teacher work sessions with GPS verification and billing';
COMMENT ON TABLE sessions IS 'Scheduled and actual teaching sessions';
COMMENT ON TABLE billing IS 'Invoice and billing records for timesheets';
COMMENT ON TABLE payments IS 'Payment records for billing invoices';
COMMENT ON TABLE teacher_rates IS 'Teacher hourly rates by subject';
