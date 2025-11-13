# P0 CRITICAL BUGS - Service Layer Data Fragmentation

**Date**: November 13, 2025
**Severity**: P0 (Critical - Production Blocking)
**Status**: 🔴 UNFIXED - Requires Immediate Attention

---

## Executive Summary

While Fix #1 patched `TimesheetView.tsx` to read from both tables, **5 other components** and **3 service methods** still have the SAME bug. The service layer itself is fundamentally broken - all methods only query the OLD system (`timesheet_entries`), ignoring the NEW system (`teacher_sessions`).

### Impact

- **Check-in Bug**: Teachers can create duplicate active check-ins (same teacher, same student, multiple sessions)
- **Timesheet Display**: 5 components show incomplete data (missing sessions from NEW system)
- **Reports**: Monthly timesheet report completely broken (returns `null`)
- **CSV Export**: Broken (depends on broken `getMonthlyTimesheetSummary`)

---

## Bug #1: `getActiveCheckIn()` - Duplicate Check-ins Allowed (P0)

### Location

`src/services/timesheet.service.ts` lines 289-310

### Current Code

```typescript
static async getActiveCheckIn(
  teacherId: string
): Promise<TimesheetEntry | null> {
  try {
    const { data, error } = await supabase
      .from('timesheet_entries')  // ❌ ONLY queries OLD system
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'checked_in')
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error fetching active check-in:', error);
    return null;
  }
}
```

### The Bug

1. Teacher checks in via **NEW system** (creates session in `teacher_sessions`)
2. Component calls `getActiveCheckIn()` which **only queries** `timesheet_entries`
3. Returns `null` (no active check-in found)
4. Check-out button is **disabled** even though teacher IS checked in
5. Teacher can scan QR again and create **duplicate check-in**

### Reproduction Steps

1. Teacher scans student QR code (NEW system flow)
2. Session created in `teacher_sessions` only (trigger hasn't fired yet, or trigger not installed)
3. UI calls `getActiveCheckIn(teacherId)`
4. Returns `null` because `timesheet_entries` has no record yet
5. UI shows "Check In" button instead of "Check Out" button
6. Teacher scans QR again → creates duplicate session

### Components Affected

- [QRCheckInOut.tsx:41](src/components/teacher/QRCheckInOut.tsx#L41) - Calls `getActiveCheckIn()` to show check-in/check-out state

### Fix Required

Query BOTH tables and return most recent active check-in:

```typescript
static async getActiveCheckIn(
  teacherId: string
): Promise<TimesheetEntry | null> {
  try {
    // Query OLD system
    const { data: oldEntry } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'checked_in')
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() to avoid error if not found

    // Query NEW system
    const { data: newSessions } = await supabase
      .from('teacher_sessions')
      .select('*')
      .eq('teacher_id', teacherId)
      .is('session_end', null) // NULL session_end = still checked in
      .order('session_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Convert and compare both
    const entries: TimesheetEntry[] = [];
    if (oldEntry) entries.push(oldEntry);
    if (newSessions) {
      entries.push(convertTeacherSessionToTimesheetEntry(newSessions));
    }

    if (entries.length === 0) return null;

    // Return most recent
    return entries.sort((a, b) =>
      new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()
    )[0] || null;
  } catch (error) {
    console.error('Error fetching active check-in:', error);
    return null;
  }
}
```

---

## Bug #2: `getParentTimesheet()` - Missing Sessions (P0)

### Location

`src/services/timesheet.service.ts` lines 350-380

### Current Code

```typescript
static async getParentTimesheet(
  parentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TimesheetEntry[]> {
  try {
    let query = supabase
      .from('timesheet_entries')  // ❌ ONLY queries OLD system
      .select('*')
      .eq('parent_id', parentId)
      .order('check_in_time', { ascending: false });

    // ... date filtering ...

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}
```

### The Bug

- Parents only see sessions from `timesheet_entries`
- Sessions in `teacher_sessions` are **invisible**
- Even though `TimesheetView.tsx` has workaround, other components calling this service method are broken

### Components Affected

1. **TimesheetQRCode.tsx** (lines 77-80):

   ```typescript
   const entries = await timesheetService.getParentTimesheet(user.id);
   const studentEntries = entries
     .filter(e => e.student_id === studentId)
     .slice(0, 5); // Shows recent sessions - INCOMPLETE!
   ```

   **Impact**: "Recent Sessions" section below QR code is incomplete

2. **TimesheetView.tsx**:
   Already has workaround (Fix #1), but still calls this broken method for OLD entries

### Fix Required

Same pattern as Fix #1 - query both tables, merge, deduplicate:

```typescript
static async getParentTimesheet(
  parentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TimesheetEntry[]> {
  try {
    // Query OLD system
    let oldQuery = supabase
      .from('timesheet_entries')
      .select('*')
      .eq('parent_id', parentId)
      .order('check_in_time', { ascending: false });

    if (startDate) oldQuery = oldQuery.gte('check_in_time', startDate.toISOString());
    if (endDate) oldQuery = oldQuery.lte('check_in_time', endDate.toISOString());

    const { data: oldEntries } = await oldQuery;

    // Query NEW system
    let newQuery = supabase
      .from('teacher_sessions')
      .select('*')
      .eq('parent_id', parentId)
      .order('session_start', { ascending: false });

    if (startDate) newQuery = newQuery.gte('session_start', startDate.toISOString());
    if (endDate) newQuery = newQuery.lte('session_start', endDate.toISOString());

    const { data: newSessions } = await newQuery;

    // Convert and merge
    const newEntriesConverted = (newSessions || []).map(convertTeacherSessionToTimesheetEntry);
    const allEntries = [...(oldEntries || []), ...newEntriesConverted];

    // Deduplicate by ID
    const seen = new Set<string>();
    return allEntries.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  } catch (error) {
    console.error('Error fetching parent timesheet:', error);
    return [];
  }
}
```

---

## Bug #3: `getTeacherTimesheet()` - Missing Sessions (P0)

### Location

`src/services/timesheet.service.ts` lines 315-345

### Current Code

```typescript
static async getTeacherTimesheet(
  teacherId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TimesheetEntry[]> {
  try {
    let query = supabase
      .from('timesheet_entries')  // ❌ ONLY queries OLD system
      .select('*')
      .eq('teacher_id', teacherId)
      .order('check_in_time', { ascending: false });

    // ... date filtering ...
  }
}
```

### The Bug

- Teachers only see their sessions from `timesheet_entries`
- Sessions they created in `teacher_sessions` are **invisible**
- This breaks teacher dashboard views and hour calculations

### Components Affected

1. **calculateTeacherHours()** (lines 385-454):

   ```typescript
   const entries = await this.getTeacherTimesheet(
     teacherId,
     startDate,
     endDate
   ); // ❌ Missing sessions from NEW system
   ```

   **Impact**: Hour calculations are **underreported** (missing sessions from NEW system)

### Fix Required

Same pattern - query both tables:

```typescript
static async getTeacherTimesheet(
  teacherId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TimesheetEntry[]> {
  try {
    // Query OLD system
    let oldQuery = supabase
      .from('timesheet_entries')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('check_in_time', { ascending: false });

    if (startDate) oldQuery = oldQuery.gte('check_in_time', startDate.toISOString());
    if (endDate) oldQuery = oldQuery.lte('check_in_time', endDate.toISOString());

    const { data: oldEntries } = await oldQuery;

    // Query NEW system
    let newQuery = supabase
      .from('teacher_sessions')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('session_start', { ascending: false });

    if (startDate) newQuery = newQuery.gte('session_start', startDate.toISOString());
    if (endDate) newQuery = newQuery.lte('session_start', endDate.toISOString());

    const { data: newSessions } = await newQuery;

    // Convert and merge
    const newEntriesConverted = (newSessions || []).map(convertTeacherSessionToTimesheetEntry);
    const allEntries = [...(oldEntries || []), ...newEntriesConverted];

    // Deduplicate by ID
    const seen = new Set<string>();
    return allEntries.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  } catch (error) {
    console.error('Error fetching teacher timesheet:', error);
    return [];
  }
}
```

---

## Bug #4: `getMonthlyTimesheetSummary()` - Completely Broken (P0)

### Location

`src/services/timesheet.service.ts` lines 460-469

### Current Code

```typescript
static async getMonthlyTimesheetSummary(
  teacherId: string,
  month: number,
  year: number
): Promise<any> {
  console.warn(
    'getMonthlyTimesheetSummary is a legacy method - not implemented'
  );
  return null;  // ❌ ALWAYS RETURNS NULL
}
```

### The Bug

- Method is a **stub** - always returns `null`
- Marked as "legacy" but is **actively used** in production component
- Component shows "Failed to load timesheet data" error on mount

### Components Affected

1. **MonthlyTimesheetReport.tsx** (lines 63-68):

   ```typescript
   const data = await TimesheetService.getMonthlyTimesheetSummary(
     teacherId,
     selectedMonth,
     selectedYear
   );
   setSummary(data); // Always null!
   ```

   **Impact**: Entire component is **non-functional** - always shows loading error

2. **Teacher Dashboard** (uses MonthlyTimesheetReport):
   - Monthly report section is broken
   - CSV export is broken (depends on this method)

### Fix Required

Implement the method properly:

```typescript
static async getMonthlyTimesheetSummary(
  teacherId: string,
  month: number,
  year: number
): Promise<MonthlyTimesheetSummary | null> {
  try {
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all entries for the month (from BOTH systems)
    const entries = await this.getTeacherTimesheet(teacherId, startDate, endDate);

    // Filter completed entries
    const completedEntries = entries.filter(
      e => e.status === 'checked_out' && e.duration_minutes
    );

    // Calculate totals
    const totalMinutes = completedEntries.reduce(
      (sum, e) => sum + (e.duration_minutes || 0),
      0
    );
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

    // Group by student
    const byStudent: Record<string, any> = {};
    completedEntries.forEach(entry => {
      if (!byStudent[entry.student_id]) {
        byStudent[entry.student_id] = {
          studentName: 'Student', // TODO: Fetch student name
          sessions: 0,
          hours: 0,
        };
      }
      byStudent[entry.student_id].sessions += 1;
      byStudent[entry.student_id].hours += (entry.duration_minutes || 0) / 60;
    });

    // Group by date
    const sessionsByDate: Record<string, any[]> = {};
    completedEntries.forEach(entry => {
      const date = new Date(entry.check_in_time).toISOString().split('T')[0] || '';
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date]?.push(entry);
    });

    return {
      totalHours,
      totalSessions: completedEntries.length,
      totalEarnings: 0, // TODO: Calculate based on rate
      sessionsByDate,
      byStudent,
      bySubject: {}, // TODO: Implement if subject tracking added
      entries: completedEntries.map(e => ({
        id: e.id,
        checkInTime: new Date(e.check_in_time),
        checkOutTime: e.check_out_time ? new Date(e.check_out_time) : null,
        studentName: 'Student',
        subject: '',
        hours: (e.duration_minutes || 0) / 60,
      })),
    };
  } catch (error) {
    console.error('Error getting monthly timesheet summary:', error);
    return null;
  }
}
```

---

## Bug #5: `exportMonthlyTimesheetCSV()` - Completely Broken (P0)

### Location

`src/services/timesheet.service.ts` lines 471-480

### Current Code

```typescript
static async exportMonthlyTimesheetCSV(
  teacherId: string,
  month: number,
  year: number
): Promise<string | null> {
  console.warn(
    'exportMonthlyTimesheetCSV is a legacy method - not implemented'
  );
  return null;  // ❌ ALWAYS RETURNS NULL
}
```

### The Bug

- Method is a **stub** - always returns `null`
- CSV export button does nothing (fails silently)

### Components Affected

1. **MonthlyTimesheetReport.tsx** (lines 77-84):

   ```typescript
   const csv = await TimesheetService.exportMonthlyTimesheetCSV(
     teacherId,
     selectedMonth,
     selectedYear
   );

   if (csv) {
     // This block NEVER executes because csv is always null
     // ... download logic ...
   }
   ```

   **Impact**: "Export CSV" button is **non-functional**

### Fix Required

Implement CSV export:

```typescript
static async exportMonthlyTimesheetCSV(
  teacherId: string,
  month: number,
  year: number
): Promise<string | null> {
  try {
    const summary = await this.getMonthlyTimesheetSummary(teacherId, month, year);
    if (!summary) return null;

    // CSV header
    let csv = 'Date,Check In,Check Out,Duration (hours),Student,Subject,Notes\n';

    // CSV rows
    summary.entries.forEach(entry => {
      const date = entry.checkInTime.toLocaleDateString();
      const checkIn = entry.checkInTime.toLocaleTimeString();
      const checkOut = entry.checkOutTime?.toLocaleTimeString() || '';
      const hours = entry.hours.toFixed(2);
      const student = entry.studentName;
      const subject = entry.subject || '';
      const notes = ''; // TODO: Add notes field

      csv += `"${date}","${checkIn}","${checkOut}",${hours},"${student}","${subject}","${notes}"\n`;
    });

    // Summary row
    csv += `\nTotal Hours,,,${summary.totalHours.toFixed(2)}\n`;
    csv += `Total Sessions,,,${summary.totalSessions}\n`;

    return csv;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return null;
  }
}
```

---

## Root Cause Analysis

### Why This Happened

1. **Incremental Development**: NEW system (`teacher_sessions`) was added without updating OLD system queries
2. **Service Layer Not Updated**: Only UI component (`TimesheetView.tsx`) got the workaround, service methods ignored
3. **No Abstraction**: No data access layer to centralize "read from both tables" logic
4. **Legacy Stubs**: Two methods marked "not implemented" but still called by production components

### Why It's Critical

- **Data Loss**: Teachers' hours are underreported (financial impact)
- **Duplicate Check-ins**: Teachers can create multiple active sessions (data corruption)
- **Broken Features**: Monthly reports and CSV export completely non-functional
- **Poor UX**: Check-out button disabled when it should be enabled

---

## Recommended Fix Strategy

### Phase 1: Fix Service Layer (HIGH PRIORITY - 3-4 hours)

1. **Create Helper Function** (reusable):

   ```typescript
   private static convertTeacherSessionToTimesheetEntry(session: TeacherSession): TimesheetEntry {
     // Same logic as in TimesheetView.tsx
   }

   private static async queryBothSystems(filters: {
     teacherId?: string;
     parentId?: string;
     studentId?: string;
     startDate?: Date;
     endDate?: Date;
   }): Promise<TimesheetEntry[]> {
     // Query OLD system
     // Query NEW system
     // Convert, merge, deduplicate
     // Return unified array
   }
   ```

2. **Refactor All Query Methods**:
   - `getActiveCheckIn()` → use `queryBothSystems()`, filter by `session_end IS NULL`
   - `getParentTimesheet()` → use `queryBothSystems()` with `parentId` filter
   - `getTeacherTimesheet()` → use `queryBothSystems()` with `teacherId` filter

3. **Implement Legacy Stubs**:
   - `getMonthlyTimesheetSummary()` → implement properly using `getTeacherTimesheet()`
   - `exportMonthlyTimesheetCSV()` → implement using `getMonthlyTimesheetSummary()`

### Phase 2: Update Components (MEDIUM PRIORITY - 1-2 hours)

1. **TimesheetView.tsx**: Remove workaround, use updated service method
2. **TimesheetQRCode.tsx**: Test "Recent Sessions" displays correctly
3. **QRCheckInOut.tsx**: Verify check-in/check-out state detection works
4. **MonthlyTimesheetReport.tsx**: Verify report loads and CSV exports

### Phase 3: Add Tests (MEDIUM PRIORITY - 2 hours)

1. Unit tests for `queryBothSystems()`
2. Integration test: Check-in via NEW system → verify `getActiveCheckIn()` returns it
3. Integration test: Session in NEW system → verify appears in parent timesheet
4. E2E test: Monthly report loads, CSV exports successfully

---

## Testing Checklist

### Bug #1: getActiveCheckIn()

- [ ] Teacher checks in via NEW system (teacher_sessions)
- [ ] Call `getActiveCheckIn(teacherId)` → returns active session
- [ ] Check-out button is **enabled**
- [ ] Teacher cannot create duplicate check-in

### Bug #2: getParentTimesheet()

- [ ] Create session in NEW system
- [ ] Parent calls `getParentTimesheet(parentId)`
- [ ] Session appears in results
- [ ] TimesheetQRCode component shows session in "Recent Sessions"

### Bug #3: getTeacherTimesheet()

- [ ] Teacher creates session in NEW system
- [ ] Call `getTeacherTimesheet(teacherId)`
- [ ] Session appears in results
- [ ] `calculateTeacherHours()` includes session in totals

### Bug #4: getMonthlyTimesheetSummary()

- [ ] Create sessions in current month
- [ ] Call `getMonthlyTimesheetSummary(teacherId, month, year)`
- [ ] Returns valid summary object (not null)
- [ ] totalHours, totalSessions calculated correctly
- [ ] MonthlyTimesheetReport component displays data

### Bug #5: exportMonthlyTimesheetCSV()

- [ ] Create sessions in current month
- [ ] Call `exportMonthlyTimesheetCSV(teacherId, month, year)`
- [ ] Returns CSV string (not null)
- [ ] CSV contains all sessions
- [ ] CSV download works in UI

---

## Impact if Not Fixed

### Immediate

- Teachers underreport hours (financial loss)
- Duplicate check-ins corrupt data
- Monthly reports unusable
- CSV export broken

### Long-Term

- Data divergence between tables worsens
- Trust in system erodes
- Workarounds proliferate
- Technical debt compounds

---

## Files Requiring Changes

### Service Layer

- [src/services/timesheet.service.ts](src/services/timesheet.service.ts)
  - Add `convertTeacherSessionToTimesheetEntry()` helper
  - Add `queryBothSystems()` abstraction
  - Refactor `getActiveCheckIn()` (lines 289-310)
  - Refactor `getParentTimesheet()` (lines 350-380)
  - Refactor `getTeacherTimesheet()` (lines 315-345)
  - Implement `getMonthlyTimesheetSummary()` (lines 460-469)
  - Implement `exportMonthlyTimesheetCSV()` (lines 471-480)

### Components (Verification Only)

- [src/components/teacher/QRCheckInOut.tsx](src/components/teacher/QRCheckInOut.tsx) - Test check-in/out detection
- [src/components/parent/TimesheetQRCode.tsx](src/components/parent/TimesheetQRCode.tsx) - Test recent sessions
- [src/components/teacher/MonthlyTimesheetReport.tsx](src/components/teacher/MonthlyTimesheetReport.tsx) - Test report loads
- [src/components/shared/TimesheetView.tsx](src/components/shared/TimesheetView.tsx) - Simplify (remove workaround)

---

## Priority

**P0 - CRITICAL**

These bugs directly impact:

- Data integrity (duplicate check-ins)
- Financial accuracy (underreported hours)
- Core features (reports, export)
- User trust (broken functionality)

**Recommended**: Fix immediately before deploying any other changes.

---

## Next Steps

1. **Acknowledge** this report
2. **Prioritize** service layer refactor (Phase 1)
3. **Implement** fixes in order: getActiveCheckIn → getParentTimesheet → getTeacherTimesheet → monthly methods
4. **Test** each fix against checklist
5. **Deploy** with Migration 007 (sync trigger)
6. **Monitor** for duplicate check-ins and data inconsistencies

---

## Questions?

- Full architecture context: [ARCHITECTURE_REVIEW_REPORT.md](ARCHITECTURE_REVIEW_REPORT.md)
- Previous fixes: [FIXES_SUMMARY.md](FIXES_SUMMARY.md)
- Migration guide: [MIGRATION_007_INSTRUCTIONS.md](MIGRATION_007_INSTRUCTIONS.md)
