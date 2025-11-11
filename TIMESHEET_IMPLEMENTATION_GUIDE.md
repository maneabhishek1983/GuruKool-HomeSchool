# Timesheet QR System - Implementation Guide

## Quick Start (5 Minutes)

### 1. Run Database Migration

```bash
# Apply the timesheet tables migration
supabase db push

# Or manually:
psql -U postgres -d your_database -f supabase/migrations/002_timesheet_tables.sql
```

### 2. Add to Parent Dashboard

```tsx
// src/app/parent/dashboard/page.tsx
import { TimesheetQRCode } from '@/components/parent/TimesheetQRCode';

export default function ParentDashboard() {
  const { user } = useAuthContext();
  const [students, setStudents] = useState([]);

  return (
    <div className="space-y-6">
      <h1>My Students</h1>

      {students.map(student => (
        <div key={student.id} className="bg-white rounded-xl p-6">
          <h2>{student.name}</h2>

          {/* Add QR Code Component */}
          <TimesheetQRCode studentId={student.id} studentName={student.name} />
        </div>
      ))}
    </div>
  );
}
```

### 3. Add to Teacher Dashboard

```tsx
// src/app/teacher/dashboard/page.tsx
import { QRCheckInOut } from '@/components/teacher/QRCheckInOut';
import { TimesheetView } from '@/components/shared/TimesheetView';

export default function TeacherDashboard() {
  const { user } = useAuthContext();

  return (
    <div className="space-y-6">
      <h1>Teacher Portal</h1>

      {/* Add Check-In/Out Component */}
      <section>
        <h2>Check-In/Out</h2>
        <QRCheckInOut
          onSuccess={entry => {
            console.log('Success:', entry);
            // Optionally show success message
          }}
          onError={error => {
            console.error('Error:', error);
            // Optionally show error message
          }}
        />
      </section>

      {/* Add Timesheet View */}
      <section>
        <h2>My Timesheet</h2>
        <TimesheetView role="teacher" userId={user.id} />
      </section>
    </div>
  );
}
```

### 4. Test the Flow

#### Test as Parent:

1. Navigate to parent dashboard
2. See QR code displayed for each student
3. QR code should be a real scannable pattern (not text)
4. Try printing the QR code

#### Test as Teacher:

1. Navigate to teacher dashboard
2. Click "Open Camera Scanner" or "Test with Mock QR Code"
3. Select "Check-In"
4. See success message
5. Repeat and select "Check-Out"
6. View timesheet with recorded session

## Complete Integration Examples

### Parent Portal - Full Example

```tsx
// src/app/parent/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/authContext';
import { TimesheetQRCode } from '@/components/parent/TimesheetQRCode';
import { TimesheetView } from '@/components/shared/TimesheetView';

export default function ParentDashboard() {
  const { user } = useAuthContext();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    // Load students
    loadStudents();
  }, [user]);

  const loadStudents = async () => {
    // Your logic to load students
    // const data = await studentService.getStudents(user.id);
    // setStudents(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <p className="text-neutral-600">
          Manage your students and track teacher sessions
        </p>
      </header>

      {/* Student Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {students.map(student => (
          <button
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedStudent?.id === student.id
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {student.name}
          </button>
        ))}
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Teacher Check-In QR Code
            </h2>
            <TimesheetQRCode
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
            />
          </div>

          {/* Timesheet Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Session History</h2>
            <TimesheetView role="parent" userId={user.id} />
          </div>
        </div>
      )}
    </div>
  );
}
```

### Teacher Portal - Full Example

```tsx
// src/app/teacher/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/authContext';
import { QRCheckInOut } from '@/components/teacher/QRCheckInOut';
import { TimesheetView } from '@/components/shared/TimesheetView';
import { timesheetService, TimesheetEntry } from '@/services/timesheet.service';

export default function TeacherDashboard() {
  const { user } = useAuthContext();
  const [activeSession, setActiveSession] = useState<TimesheetEntry | null>(
    null
  );
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    checkActiveSession();
  }, [user]);

  const checkActiveSession = async () => {
    if (!user?.id) return;
    const active = await timesheetService.getActiveCheckIn(user.id);
    setActiveSession(active);
  };

  const handleCheckInSuccess = (entry: TimesheetEntry) => {
    setActiveSession(entry);
    setShowScanner(false);
    // Show success notification
    alert(
      `Successfully ${entry.status === 'checked_in' ? 'checked in' : 'checked out'}!`
    );
  };

  const handleCheckInError = (error: string) => {
    // Show error notification
    alert(`Error: ${error}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-neutral-600">
          Manage your sessions and track your time
        </p>
      </header>

      {/* Active Session Banner */}
      {activeSession && (
        <div className="bg-success-50 border border-success-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-success-800">
                Active Session
              </h3>
              <p className="text-success-600">
                Started at{' '}
                {new Date(activeSession.check_in_time).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="px-6 py-3 bg-error-600 hover:bg-error-700 text-white font-medium rounded-xl"
            >
              Check Out
            </button>
          </div>
        </div>
      )}

      {/* Check-In/Out Section */}
      <section className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Check-In/Out</h2>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl"
          >
            {showScanner ? 'Close Scanner' : 'Scan QR Code'}
          </button>
        </div>

        {showScanner && (
          <QRCheckInOut
            onSuccess={handleCheckInSuccess}
            onError={handleCheckInError}
          />
        )}
      </section>

      {/* Timesheet Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">My Timesheet</h2>
        <TimesheetView role="teacher" userId={user.id} />
      </section>
    </div>
  );
}
```

## API Usage Examples

### Generate QR Code

```typescript
import { timesheetService } from '@/services/timesheet.service';

// Generate QR code for a student
const qrCode = await timesheetService.generateParentQRCode(parentId, studentId);

console.log('QR Code Image:', qrCode.qr_code_image);
console.log('Expires:', qrCode.expires_at);
```

### Check In

```typescript
import { timesheetService } from '@/services/timesheet.service';

// Check in teacher
const entry = await timesheetService.checkIn(teacherId, qrDataString, {
  latitude: 37.7749,
  longitude: -122.4194,
  address: '123 Main St, San Francisco, CA',
});

if (entry) {
  console.log('Checked in at:', entry.check_in_time);
}
```

### Check Out

```typescript
import { timesheetService } from '@/services/timesheet.service';

// Check out teacher
const entry = await timesheetService.checkOut(
  teacherId,
  qrDataString,
  'Great session! Student made excellent progress.',
  {
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Main St, San Francisco, CA',
  }
);

if (entry) {
  console.log('Checked out at:', entry.check_out_time);
  console.log('Duration:', entry.duration_minutes, 'minutes');
}
```

### Get Timesheet

```typescript
import { timesheetService } from '@/services/timesheet.service';

// Get teacher timesheet for last 30 days
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const endDate = new Date();

const entries = await timesheetService.getTeacherTimesheet(
  teacherId,
  startDate,
  endDate
);

console.log('Total entries:', entries.length);
```

### Calculate Hours

```typescript
import { timesheetService } from '@/services/timesheet.service';

// Calculate hours for billing period
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');

const summary = await timesheetService.calculateTeacherHours(
  teacherId,
  startDate,
  endDate
);

console.log('Total hours:', summary.totalHours);
console.log('Total sessions:', summary.entriesCount);
console.log('By student:', summary.byStudent);
```

## Customization

### Custom QR Code Styling

```typescript
// Modify in timesheet.service.ts
const qrCodeImage = await QRCode.toDataURL(qrDataString, {
  errorCorrectionLevel: 'H',
  type: 'image/png',
  quality: 1,
  margin: 4,
  width: 512,
  color: {
    dark: '#1a56db', // Your brand color
    light: '#ffffff',
  },
});
```

### Custom Success Messages

```tsx
<QRCheckInOut
  onSuccess={entry => {
    // Custom success handling
    if (entry.status === 'checked_in') {
      showNotification('Welcome! Your session has started.');
    } else {
      showNotification(
        `Session complete! Duration: ${entry.duration_minutes} minutes`
      );
    }
  }}
/>
```

### Custom Timesheet Filters

```tsx
// Add custom filters to TimesheetView
const [filters, setFilters] = useState({
  studentId: null,
  minDuration: 0,
  maxDuration: 480, // 8 hours
});

// Filter entries
const filteredEntries = entries.filter(entry => {
  if (filters.studentId && entry.student_id !== filters.studentId) return false;
  if (entry.duration_minutes < filters.minDuration) return false;
  if (entry.duration_minutes > filters.maxDuration) return false;
  return true;
});
```

## Troubleshooting

### QR Code Not Displaying

```typescript
// Check if QR code is generated
console.log('QR Code:', qrCode);
console.log('Format:', qrCode?.qr_code_image?.substring(0, 30));

// Should start with: data:image/png;base64,
```

### Check-In Failed

```typescript
// Debug check-in
try {
  const entry = await timesheetService.checkIn(teacherId, qrData);
  console.log('Success:', entry);
} catch (error) {
  console.error('Check-in error:', error);
  // Check:
  // 1. Is teacher already checked in?
  // 2. Is QR code valid?
  // 3. Is QR code active?
}
```

### Duration Not Calculated

```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'calculate_duration_on_checkout';

-- Manually calculate duration
UPDATE timesheet_entries
SET duration_minutes = EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 60
WHERE check_out_time IS NOT NULL AND duration_minutes IS NULL;
```

## Production Checklist

- [ ] Database migration applied
- [ ] QR codes generate correctly (PNG format)
- [ ] Check-in flow works
- [ ] Check-out flow works
- [ ] Duration calculated automatically
- [ ] Timesheet displays correctly
- [ ] Parent can view QR code
- [ ] Teacher can scan QR code
- [ ] RLS policies tested
- [ ] Error handling tested
- [ ] Mobile responsive
- [ ] iOS QR scanning tested
- [ ] Android QR scanning tested
- [ ] Print QR code works
- [ ] Export timesheet works

## Next Steps

1. **Test the system** with real users
2. **Gather feedback** on UX
3. **Monitor performance** of QR scanning
4. **Add analytics** for usage patterns
5. **Implement notifications** for check-ins
6. **Add GPS tracking** if needed
7. **Create mobile app** for better camera access
8. **Integrate with payroll** system

## Support

Need help? Check:

1. `TIMESHEET_QR_SYSTEM.md` - Complete documentation
2. Component source code - Inline comments
3. Database migration - SQL comments
4. Test with mock data first

**System is ready to use!** 🚀
