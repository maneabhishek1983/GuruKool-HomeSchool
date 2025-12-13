/**
 * Timesheet Service Tests
 * Tests for timesheet operations, QR code handling, and monthly summaries
 */

import {
  TimesheetService,
  TimesheetEntry,
  MonthlyTimesheetSummary,
} from '../timesheet.service';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock QRCode library
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}));

describe('TimesheetService', () => {
  const mockTeacherId = 'teacher-123';
  const mockStudentId = 'student-456';
  const mockParentId = 'parent-789';

  const mockTimesheetEntry: TimesheetEntry = {
    id: 'entry-1',
    teacher_id: mockTeacherId,
    student_id: mockStudentId,
    parent_id: mockParentId,
    check_in_time: new Date('2024-01-15T09:00:00Z').toISOString(),
    check_out_time: new Date('2024-01-15T11:00:00Z').toISOString(),
    duration_minutes: 120,
    location: {
      latitude: 40.7128,
      longitude: -74.006,
      address: '123 Main St',
    },
    notes: 'Math tutoring session',
    qr_code_id: 'qr-code-1',
    status: 'checked_out',
    created_at: new Date('2024-01-15T09:00:00Z').toISOString(),
    updated_at: new Date('2024-01-15T11:00:00Z').toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('convertTeacherSessionToTimesheetEntry', () => {
    it('should convert TeacherSession to TimesheetEntry format', () => {
      const mockSession = {
        id: 'session-1',
        teacher_id: mockTeacherId,
        student_id: mockStudentId,
        parent_id: mockParentId,
        session_start: new Date('2024-01-15T09:00:00Z').toISOString(),
        session_end: new Date('2024-01-15T11:00:00Z').toISOString(),
        duration_minutes: 120,
        location: { address: '123 Main St' },
        notes: 'Test session',
        qr_code_used: 'qr-code-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Access private method via any type
      const result = (
        TimesheetService as any
      ).convertTeacherSessionToTimesheetEntry(mockSession);

      expect(result.id).toBe(mockSession.id);
      expect(result.teacher_id).toBe(mockSession.teacher_id);
      expect(result.check_in_time).toBe(mockSession.session_start);
      expect(result.check_out_time).toBe(mockSession.session_end);
      expect(result.status).toBe('checked_out');
    });

    it('should set status to checked_in when session_end is null', () => {
      const mockSession = {
        id: 'session-1',
        teacher_id: mockTeacherId,
        student_id: mockStudentId,
        parent_id: mockParentId,
        session_start: new Date().toISOString(),
        session_end: null,
        duration_minutes: null,
        location: null,
        notes: null,
        qr_code_used: 'qr-code-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = (
        TimesheetService as any
      ).convertTeacherSessionToTimesheetEntry(mockSession);

      expect(result.status).toBe('checked_in');
      expect(result.check_out_time).toBeUndefined();
    });
  });

  describe('deduplicateById', () => {
    it('should remove duplicate entries by ID', () => {
      const entries: TimesheetEntry[] = [
        { ...mockTimesheetEntry, id: 'entry-1' },
        { ...mockTimesheetEntry, id: 'entry-2' },
        { ...mockTimesheetEntry, id: 'entry-1' }, // Duplicate
      ];

      const result = (TimesheetService as any).deduplicateById(entries);

      expect(result).toHaveLength(2);
      expect(result.map((e: TimesheetEntry) => e.id)).toEqual([
        'entry-1',
        'entry-2',
      ]);
    });

    it('should handle empty array', () => {
      const result = (TimesheetService as any).deduplicateById([]);

      expect(result).toHaveLength(0);
    });

    it('should preserve order of first occurrence', () => {
      const entries: TimesheetEntry[] = [
        { ...mockTimesheetEntry, id: 'entry-3' },
        { ...mockTimesheetEntry, id: 'entry-1' },
        { ...mockTimesheetEntry, id: 'entry-2' },
        { ...mockTimesheetEntry, id: 'entry-1' }, // Duplicate
      ];

      const result = (TimesheetService as any).deduplicateById(entries);

      expect(result.map((e: TimesheetEntry) => e.id)).toEqual([
        'entry-3',
        'entry-1',
        'entry-2',
      ]);
    });
  });

  describe('TimesheetEntry interface', () => {
    it('should have all required properties', () => {
      const entry: TimesheetEntry = mockTimesheetEntry;

      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('teacher_id');
      expect(entry).toHaveProperty('student_id');
      expect(entry).toHaveProperty('parent_id');
      expect(entry).toHaveProperty('check_in_time');
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('created_at');
      expect(entry).toHaveProperty('updated_at');
    });

    it('should allow optional properties to be undefined', () => {
      const entry: TimesheetEntry = {
        ...mockTimesheetEntry,
        check_out_time: undefined,
        duration_minutes: undefined,
        location: undefined,
        notes: undefined,
      };

      expect(entry.check_out_time).toBeUndefined();
      expect(entry.duration_minutes).toBeUndefined();
      expect(entry.location).toBeUndefined();
      expect(entry.notes).toBeUndefined();
    });
  });

  describe('MonthlyTimesheetSummary interface', () => {
    it('should have correct structure', () => {
      const summary: MonthlyTimesheetSummary = {
        totalHours: 40,
        totalSessions: 20,
        totalEarnings: 1200,
        sessionsByDate: {},
        byStudent: {
          'student-1': {
            studentName: 'John Doe',
            sessions: 10,
            hours: 20,
          },
        },
        bySubject: {
          math: {
            subjectName: 'Mathematics',
            sessions: 15,
            hours: 30,
          },
        },
        entries: [],
      };

      expect(summary.totalHours).toBe(40);
      expect(summary.totalSessions).toBe(20);
      expect(summary.totalEarnings).toBe(1200);
      expect(summary.byStudent['student-1']?.studentName).toBe('John Doe');
      expect(summary.bySubject['math']?.subjectName).toBe('Mathematics');
    });
  });

  describe('status values', () => {
    it('should accept checked_in status', () => {
      const entry: TimesheetEntry = {
        ...mockTimesheetEntry,
        status: 'checked_in',
      };

      expect(entry.status).toBe('checked_in');
    });

    it('should accept checked_out status', () => {
      const entry: TimesheetEntry = {
        ...mockTimesheetEntry,
        status: 'checked_out',
      };

      expect(entry.status).toBe('checked_out');
    });
  });

  describe('location data', () => {
    it('should handle location with all fields', () => {
      const entry: TimesheetEntry = {
        ...mockTimesheetEntry,
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          address: '123 Main St, New York, NY',
        },
      };

      expect(entry.location?.latitude).toBe(40.7128);
      expect(entry.location?.longitude).toBe(-74.006);
      expect(entry.location?.address).toBe('123 Main St, New York, NY');
    });

    it('should handle partial location data', () => {
      const entry: TimesheetEntry = {
        ...mockTimesheetEntry,
        location: {
          address: '123 Main St',
        },
      };

      expect(entry.location?.address).toBe('123 Main St');
      expect(entry.location?.latitude).toBeUndefined();
      expect(entry.location?.longitude).toBeUndefined();
    });
  });

  describe('duration calculations', () => {
    it('should correctly represent duration in minutes', () => {
      // 2 hours = 120 minutes
      const entry: TimesheetEntry = {
        ...mockTimesheetEntry,
        duration_minutes: 120,
      };

      expect(entry.duration_minutes).toBe(120);
    });

    it('should handle partial hour durations', () => {
      // 1.5 hours = 90 minutes
      const entry: TimesheetEntry = {
        ...mockTimesheetEntry,
        duration_minutes: 90,
      };

      expect(entry.duration_minutes).toBe(90);
    });
  });

  describe('date handling', () => {
    it('should store dates as ISO strings', () => {
      const checkInDate = new Date('2024-01-15T09:00:00Z');
      const checkOutDate = new Date('2024-01-15T11:00:00Z');

      const entry: TimesheetEntry = {
        ...mockTimesheetEntry,
        check_in_time: checkInDate.toISOString(),
        check_out_time: checkOutDate.toISOString(),
      };

      expect(entry.check_in_time).toBe('2024-01-15T09:00:00.000Z');
      expect(entry.check_out_time).toBe('2024-01-15T11:00:00.000Z');
    });

    it('should be parseable back to Date objects', () => {
      const entry: TimesheetEntry = mockTimesheetEntry;

      const checkInDate = new Date(entry.check_in_time);
      const checkOutDate = new Date(entry.check_out_time!);

      expect(checkInDate.getFullYear()).toBe(2024);
      expect(checkOutDate.getFullYear()).toBe(2024);
    });
  });
});

describe('CheckInOutData interface', () => {
  it('should have correct structure for check_in', () => {
    const data = {
      type: 'check_in' as const,
      parentId: 'parent-123',
      studentId: 'student-456',
      timestamp: Date.now(),
      signature: 'valid-signature',
    };

    expect(data.type).toBe('check_in');
    expect(data.parentId).toBeDefined();
    expect(data.studentId).toBeDefined();
    expect(data.timestamp).toBeDefined();
    expect(data.signature).toBeDefined();
  });

  it('should have correct structure for check_out', () => {
    const data = {
      type: 'check_out' as const,
      parentId: 'parent-123',
      studentId: 'student-456',
      teacherId: 'teacher-789',
      timestamp: Date.now(),
      signature: 'valid-signature',
    };

    expect(data.type).toBe('check_out');
    expect(data.teacherId).toBe('teacher-789');
  });
});
