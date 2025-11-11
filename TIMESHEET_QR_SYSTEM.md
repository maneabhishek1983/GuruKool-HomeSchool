# Timesheet QR Check-In/Out System

## Overview

A complete QR code-based check-in/check-out system for tracking teacher sessions with automatic timesheet calculation.

## How It Works

### 1. Parent Portal

- Parents generate a QR code for each student in their portal
- QR code is displayed prominently and can be printed
- QR code remains active for 30 days
- Parents can regenerate QR codes at any time

### 2. Teacher Portal

- Teachers scan the parent's QR code using their device camera
- After scanning, teachers select either "Check-In" or "Check-Out"
- System automatically records timestamp and calculates duration
- Teachers can add optional notes during check-out

### 3. Automatic Timesheet

- All check-ins and check-outs are automatically recorded
- Duration is calculated automatically
- Both teachers and parents can view timesheet history
- Export options available (PDF, Excel, Email)

## Features

### ✅ Real QR Codes (iOS Compatible)

- Uses `qrcode` library for real, scannable QR codes
- Error correction level: H (highest - 30% recovery)
- Optimized for iOS Camera app
- Works in various lighting conditions

### ✅ Automatic Time Tracking

- Check-in timestamp recorded automatically
- Check-out timestamp recorded automatically
- Duration calculated in minutes and hours
- No manual entry required

### ✅ Security

- QR codes include cryptographic signature
- Validates parent-student relationship
- Prevents duplicate check-ins
- Requires active QR code

### ✅ Location Tracking (Optional)

- Can record GPS coordinates
- Can record address
- Useful for home visits or multiple locations

### ✅ Session Notes

- Teachers can add notes during check-out
- Notes visible to parents
- Useful for session summaries

### ✅ Real-Time Updates

- Parents see check-ins in real-time
- Active session indicator
- Recent activity feed

### ✅ Reporting & Analytics

- Total hours worked
- Sessions count
- Average session duration
- By student breakdown
- Date range filtering

## Components

### For Parents

#### `TimesheetQRCode.tsx`

Displays QR code for teacher check-in/out

- Shows active QR code
- Recent check-in/out activity
- Refresh QR code option
- Print QR code option

**Usage:**

```tsx
import { TimesheetQRCode } from '@/components/parent/TimesheetQRCode';

<TimesheetQRCode studentId="student-123" studentName="John Doe" />;
```

### For Teachers

#### `QRCheckInOut.tsx`

QR scanner and check-in/out interface

- Camera QR scanner
- Action selection (check-in/out)
- Active session indicator
- Notes input for check-out

**Usage:**

```tsx
import { QRCheckInOut } from '@/components/teacher/QRCheckInOut';

<QRCheckInOut
  onSuccess={entry => console.log('Success:', entry)}
  onError={error => console.error('Error:', error)}
/>;
```

### Shared

#### `TimesheetView.tsx`

Timesheet display for both teachers and parents

- Date range filtering
- Summary statistics
- Detailed entries list
- Export options

**Usage:**

```tsx
import { TimesheetView } from '@/components/shared/TimesheetView';

// For teachers
<TimesheetView role="teacher" userId={teacherId} />

// For parents
<TimesheetView role="parent" userId={parentId} />
```

## Services

### `timesheetService`

#### Generate QR Code

```typescript
const qrCode = await timesheetService.generateParentQRCode(parentId, studentId);
```

#### Check In

```typescript
const entry = await timesheetService.checkIn(
  teacherId,
  qrDataString,
  location // optional
);
```

#### Check Out

```typescript
const entry = await timesheetService.checkOut(
  teacherId,
  qrDataString,
  notes, // optional
  location // optional
);
```

#### Get Active Check-In

```typescript
const activeEntry = await timesheetService.getActiveCheckIn(teacherId);
```

#### Get Timesheet

```typescript
// For teachers
const entries = await timesheetService.getTeacherTimesheet(
  teacherId,
  startDate,
  endDate
);

// For parents
const entries = await timesheetService.getParentTimesheet(
  parentId,
  startDate,
  endDate
);
```

#### Calculate Hours

```typescript
const summary = await timesheetService.calculateTeacherHours(
  teacherId,
  startDate,
  endDate
);

console.log(summary.totalHours); // e.g., 42.5
console.log(summary.byStudent); // Hours per student
```

## Database Schema

### `parent_qr_codes`

Stores QR codes for parents

- `id`: UUID primary key
- `parent_id`: Reference to users table
- `student_id`: Reference to students table
- `qr_code_data`: JSON string with QR data
- `qr_code_image`: Base64 PNG image
- `is_active`: Boolean flag
- `expires_at`: Expiration timestamp

### `timesheet_entries`

Records check-in/out events

- `id`: UUID primary key
- `teacher_id`: Reference to users table
- `student_id`: Reference to students table
- `parent_id`: Reference to users table
- `qr_code_id`: Reference to parent_qr_codes
- `check_in_time`: Timestamp
- `check_out_time`: Timestamp (nullable)
- `duration_minutes`: Auto-calculated
- `location`: JSONB (optional)
- `notes`: Text (optional)
- `status`: 'checked_in' | 'checked_out'

### Views

#### `teacher_timesheet_summary`

Aggregated data per teacher

- Total sessions
- Completed sessions
- Active sessions
- Total hours
- First/last check-in

#### `parent_timesheet_summary`

Aggregated data per parent/student

- Total sessions
- Completed sessions
- Total hours
- First/last check-in

## Workflow

### Parent Workflow

1. Navigate to parent portal
2. View student dashboard
3. QR code is automatically generated and displayed
4. Show QR code to teacher or print it
5. View real-time check-ins in activity feed
6. Access full timesheet history

### Teacher Workflow

1. Navigate to teacher portal
2. Click "Check-In/Out" button
3. Scan parent's QR code with camera
4. Select "Check-In" to start session
5. Work with student
6. Scan same QR code again
7. Select "Check-Out" and add notes
8. View timesheet history

## Security Features

### QR Code Validation

- Cryptographic signature verification
- Timestamp validation (24-hour expiry)
- Parent-student relationship verification
- Active QR code check

### Duplicate Prevention

- Cannot check-in if already checked in
- Cannot check-out without active check-in
- One active session per teacher-student pair

### Row Level Security (RLS)

- Parents can only view their own QR codes
- Teachers can only view QR codes for assigned students
- Teachers can only modify their own timesheet entries
- Parents can view timesheet entries for their students
- Admins can view all entries

## Integration Points

### Parent Dashboard

```tsx
import { TimesheetQRCode } from '@/components/parent/TimesheetQRCode';

function ParentDashboard() {
  return (
    <div>
      <h1>My Students</h1>
      {students.map(student => (
        <div key={student.id}>
          <h2>{student.name}</h2>
          <TimesheetQRCode studentId={student.id} studentName={student.name} />
        </div>
      ))}
    </div>
  );
}
```

### Teacher Dashboard

```tsx
import { QRCheckInOut } from '@/components/teacher/QRCheckInOut';
import { TimesheetView } from '@/components/shared/TimesheetView';

function TeacherDashboard() {
  const { user } = useAuthContext();

  return (
    <div>
      <h1>Check-In/Out</h1>
      <QRCheckInOut />

      <h1>My Timesheet</h1>
      <TimesheetView role="teacher" userId={user.id} />
    </div>
  );
}
```

## Testing

### Test QR Code Generation

```typescript
// Generate test QR code
const qrCode = await timesheetService.generateParentQRCode(
  'test-parent-id',
  'test-student-id'
);

// Verify format
console.assert(
  qrCode.qr_code_image.startsWith('data:image/png;base64,'),
  'QR code should be PNG format'
);
```

### Test Check-In Flow

```typescript
// Check in
const checkIn = await timesheetService.checkIn('teacher-id', qrDataString);

console.assert(checkIn.status === 'checked_in', 'Should be checked in');

// Check out
const checkOut = await timesheetService.checkOut(
  'teacher-id',
  qrDataString,
  'Great session!'
);

console.assert(checkOut.status === 'checked_out', 'Should be checked out');
console.assert(checkOut.duration_minutes > 0, 'Should have duration');
```

## Migration

### Run Database Migration

```bash
# Apply migration
supabase db push

# Or manually run
psql -f supabase/migrations/002_timesheet_tables.sql
```

### Verify Tables

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('parent_qr_codes', 'timesheet_entries');

-- Check views exist
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('teacher_timesheet_summary', 'parent_timesheet_summary');
```

## Troubleshooting

### QR Code Not Scanning

1. Verify QR code is PNG format (not SVG)
2. Check error correction level is 'H'
3. Ensure adequate lighting
4. Hold device 20-30cm from screen
5. Try refreshing QR code

### Check-In Failed

1. Verify QR code is active
2. Check teacher is not already checked in
3. Verify parent-student relationship
4. Check QR code signature is valid

### Duration Not Calculated

1. Verify check-out time is after check-in time
2. Check database trigger is active
3. Verify duration_minutes column exists

### Permission Denied

1. Check RLS policies are enabled
2. Verify user role is correct
3. Check teacher-student assignment exists
4. Verify auth.uid() matches user

## Future Enhancements

### Planned Features

- [ ] GPS location tracking
- [ ] Photo capture at check-in/out
- [ ] Push notifications for check-ins
- [ ] Automatic reminders for check-out
- [ ] Biometric verification
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Custom report templates
- [ ] Integration with payroll systems
- [ ] Mobile app (React Native)

### Analytics Enhancements

- [ ] Session patterns analysis
- [ ] Peak hours identification
- [ ] Student engagement metrics
- [ ] Teacher performance metrics
- [ ] Predictive scheduling

## Support

For issues or questions:

1. Check this documentation
2. Review component source code
3. Check database migration
4. Test with mock data
5. Verify QR code format (PNG, not SVG)

## Summary

The Timesheet QR Check-In/Out system provides:

- ✅ Automatic time tracking
- ✅ Real QR codes (iOS compatible)
- ✅ Secure validation
- ✅ Real-time updates
- ✅ Comprehensive reporting
- ✅ Easy integration
- ✅ Mobile-friendly
- ✅ Production-ready

**All components are ready to use!** 🎉
