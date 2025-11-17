# Teacher QR Scanner Buttons Explained

**Date**: November 13, 2025
**Component**: `QRCheckInOut.tsx` (Teacher Dashboard Check-In/Out Tab)
**Location**: Teacher Dashboard → Check-In/Out Tab

---

## Overview

The Teacher Check-In/Out tab has **TWO buttons** for QR code scanning:

1. **📷 Open Camera Scanner** - Production button (REAL QR scanning)
2. **🧪 Test with Mock QR Code (Dev Only)** - Development testing button

---

## Button 1: 📷 Open Camera Scanner

### Purpose

**REAL production feature** - Opens device camera to scan physical QR codes displayed in parent's portal

### When to Use

- **Teacher visits student's home** for tutoring session
- **Parent displays QR code** on their device or printed paper
- **Teacher scans QR code** to check-in (start session) or check-out (end session)

### How It Works

#### Step 1: Open Camera

1. Teacher clicks **"📷 Open Camera Scanner"**
2. Browser requests camera permission (if not already granted)
3. Camera preview appears with QR code detection box

#### Step 2: Scan QR Code

1. Teacher points camera at parent's QR code
2. `html5-qrcode` library detects and reads QR code automatically
3. QR data is extracted (JSON string)

#### Step 3: Validate QR Code

```typescript
// Code extracts data like:
{
  "type": "teacher_auth" | "check_in",  // System identifier
  "parentId": "uuid",
  "studentId": "uuid",
  "teacherId": "uuid",  // (NEW system only)
  "timestamp": 1699876543210,
  "signature": "cryptographic-signature"
}
```

#### Step 4: Choose Action

- If QR code is valid → Show "QR Code Scanned Successfully"
- Two options:
  - **🟢 Check In** - Start teaching session
  - **🔴 Check Out** - End teaching session

#### Step 5: Create Session

- Check-in → Creates entry in `timesheet_entries` table
- Migration 007 trigger → Syncs to `teacher_sessions` table
- Session recorded with:
  - Teacher ID
  - Student ID
  - Parent ID
  - Check-in time
  - Location (GPS coordinates if available)
  - QR code used

### Technical Details

**Component**: `QRCheckInOut.tsx` (lines 269-319)

```typescript
<button
  onClick={() => setShowScanner(true)}
  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
>
  📷 Open Camera Scanner
</button>

{showScanner && (
  <QRScanner
    onScan={data => {
      handleQRScan(data);  // Process scanned QR code
      setShowScanner(false);
    }}
    onError={err => {
      setError(err);
      setShowScanner(false);
    }}
    width={400}
    qrbox={250}
    fps={10}
  />
)}
```

**QR Scanner Library**: `html5-qrcode` (production-grade QR code reader)

**Supported Formats**:

- ✅ OLD System QR codes (`parent_qr_codes` table)
- ✅ NEW System QR codes (`teacher_qr_codes` table)
- ✅ Both formats automatically detected (after compatibility fix)

### User Experience

1. **Camera Permission**: Browser will ask for camera access first time
2. **QR Detection**: Real-time scanning, detects QR code automatically
3. **Visual Feedback**: Green border when QR code detected successfully
4. **Error Handling**: Clear error messages if QR code invalid or expired

---

## Button 2: 🧪 Test with Mock QR Code (Dev Only)

### Purpose

**DEVELOPMENT TESTING ONLY** - Simulates QR code scan without physical QR code or camera

### When to Use

- **Developers testing** check-in/out flow locally
- **No physical QR code available** to scan
- **Camera not available** (e.g., desktop without webcam)
- **Testing different scenarios** (check-in, check-out, errors)

### How It Works

#### Step 1: Click Mock Button

1. Developer clicks **"🧪 Test with Mock QR Code (Dev Only)"**
2. No camera opens - it's simulated!

#### Step 2: Generate Mock Data

```typescript
const simulateQRScan = () => {
  // DISABLED in production
  if (process.env.NODE_ENV === 'production') {
    setError('Mock QR scan is disabled in production');
    return;
  }

  // Create fake QR data for testing
  const mockQRData = JSON.stringify({
    type: 'check_in',
    parentId: 'parent-123', // Fake parent ID
    studentId: 'student-456', // Fake student ID
    timestamp: Date.now(),
    signature: btoa('parent-123-student-456-dev-test-only').slice(0, 16),
  });

  // Simulate scan
  handleQRScan(mockQRData);
};
```

#### Step 3: Same Flow as Real Scan

- Mock QR data processed exactly like real scan
- Shows "QR Code Scanned Successfully" screen
- Developer chooses Check In or Check Out
- Session created in database (with fake IDs)

### Technical Details

**Component**: `QRCheckInOut.tsx` (lines 171-189)

**Mock QR Data**:

```json
{
  "type": "check_in",
  "parentId": "parent-123",
  "studentId": "student-456",
  "timestamp": 1699876543210,
  "signature": "cGFyZW50LTEyMy1zdHVkZW"
}
```

**Security Notes**:

- ✅ Disabled in production (`process.env.NODE_ENV === 'production'`)
- ✅ Uses predictable, non-secure signature (development only)
- ✅ Does NOT bypass validation - mock data still must be valid format
- ⚠️ Should NOT be used in production (will show error)

### Limitations

1. **Fake Parent/Student IDs**: Uses hardcoded `parent-123`, `student-456`
   - These IDs likely don't exist in production database
   - Check-in may fail if these IDs not found

2. **No Real Signature**: Uses simple base64 encoding
   - NOT cryptographically secure
   - Only for format testing, not security testing

3. **No Camera Testing**: Doesn't test actual camera functionality
   - Can't test camera permissions
   - Can't test QR code detection accuracy
   - Can't test lighting conditions

### When to Use Each Button

| Scenario                         | Use Open Camera          | Use Mock QR      |
| -------------------------------- | ------------------------ | ---------------- |
| **Production deployment**        | ✅ YES                   | ❌ NO (disabled) |
| **Real teacher checking in**     | ✅ YES                   | ❌ NO            |
| **Testing on local machine**     | ❌ NO (requires real QR) | ✅ YES           |
| **Development without QR code**  | ❌ NO                    | ✅ YES           |
| **Testing camera functionality** | ✅ YES                   | ❌ NO            |
| **Testing check-in/out flow**    | ✅ YES                   | ✅ YES           |

---

## Complete User Flow

### Production Flow (Open Camera Scanner)

```
1. Teacher Dashboard
   ↓
2. Click "📷 Open Camera Scanner"
   ↓
3. Browser asks for camera permission
   ↓
4. Camera opens with QR detection box
   ↓
5. Teacher points at parent's QR code
   ↓
6. QR code detected automatically
   ↓
7. Shows "QR Code Scanned Successfully"
   ↓
8. Teacher chooses:
   - 🟢 Check In (if not checked in)
   - 🔴 Check Out (if already checked in)
   ↓
9. Session created in database
   ↓
10. Success message displayed
    ↓
11. Timesheet updated
```

### Development Flow (Mock QR Code)

```
1. Teacher Dashboard (local dev environment)
   ↓
2. Click "🧪 Test with Mock QR Code"
   ↓
3. Mock QR data generated instantly
   ↓
4. Shows "QR Code Scanned Successfully"
   ↓
5. Developer chooses Check In/Out
   ↓
6. Session created with fake IDs
   ↓
7. Success or error message
```

---

## Troubleshooting

### Issue: "Mock QR scan is disabled in production"

**Cause**: Clicked Mock button in production environment

**Solution**: Use **"📷 Open Camera Scanner"** instead (production feature)

---

### Issue: Camera doesn't open

**Possible Causes**:

1. Camera permission not granted
2. No camera available on device
3. Camera in use by another application

**Solutions**:

1. Grant camera permission when browser asks
2. Use device with camera (or use Mock button in development)
3. Close other apps using camera

---

### Issue: QR code not detected

**Possible Causes**:

1. Poor lighting conditions
2. QR code too small or too far
3. QR code damaged or printed poorly
4. Wrong QR code (not from GuruKool app)

**Solutions**:

1. Ensure good lighting
2. Move camera closer to QR code (optimal distance: 15-30cm)
3. Use digital QR code (parent's device screen) instead of printed
4. Verify QR code generated from parent's portal

---

### Issue: "Invalid QR code" error after scan

**Possible Causes**:

1. QR code expired (24-hour expiry for OLD system)
2. QR code from wrong system
3. QR code signature validation failed
4. QR code not in database

**Solutions**:

1. Ask parent to regenerate QR code
2. Verify QR code generated from correct parent portal
3. Check QR code is active in database
4. Ensure parent and student IDs match database records

---

## Code References

### QRCheckInOut Component

- **File**: [src/components/teacher/QRCheckInOut.tsx](src/components/teacher/QRCheckInOut.tsx)
- **Open Camera Button**: Lines 269-274
- **Mock QR Button**: Lines 276-281
- **simulateQRScan Function**: Lines 171-189
- **handleQRScan Function**: Lines 45-73

### QR Scanner Library

- **File**: [src/components/shared/QRScanner.tsx](src/components/shared/QRScanner.tsx)
- **Library**: `html5-qrcode` (npm package)
- **Camera Initialization**: Lines 31-71
- **QR Detection**: Lines 49-60

### Service Layer

- **File**: [src/services/timesheet.service.ts](src/services/timesheet.service.ts)
- **validateQRCode**: Lines 294-338 (supports both OLD and NEW systems)
- **checkIn**: Lines 340-418 (creates timesheet entry)
- **checkOut**: Lines 420+ (ends session)

---

## Security Considerations

### Open Camera Scanner

✅ **Secure** - Uses cryptographic signature validation
✅ **Production-ready** - Validates QR code signature
✅ **Tamper-proof** - Cannot be faked without valid signature

### Mock QR Button

⚠️ **Development Only** - Disabled in production
⚠️ **Insecure Signature** - Uses simple base64 (not HMAC-SHA256)
⚠️ **Fake Data** - Uses hardcoded IDs that may not exist

---

## Best Practices

### For Teachers (Production)

1. ✅ **Always use "Open Camera Scanner"** for real check-ins
2. ✅ **Ensure good lighting** when scanning
3. ✅ **Ask parent to display QR code** on device screen (better than printed)
4. ✅ **Check for "Scanned Successfully"** message before selecting action
5. ✅ **Verify correct student** before checking in

### For Developers (Development)

1. ✅ **Use Mock button** for quick testing without camera
2. ✅ **Test both buttons** to ensure camera functionality works
3. ✅ **Create real QR codes** in parent dashboard for integration testing
4. ✅ **Test with expired QR codes** to verify error handling
5. ✅ **Never commit Mock button enabled in production**

---

## Summary

| Feature                  | Open Camera Scanner            | Mock QR Code             |
| ------------------------ | ------------------------------ | ------------------------ |
| **Purpose**              | Real production QR scanning    | Development testing only |
| **Requires Camera**      | ✅ YES                         | ❌ NO                    |
| **Requires Physical QR** | ✅ YES                         | ❌ NO                    |
| **Secure Signature**     | ✅ YES (HMAC-SHA256 or base64) | ❌ NO (fake base64)      |
| **Works in Production**  | ✅ YES                         | ❌ NO (disabled)         |
| **Tests Camera**         | ✅ YES                         | ❌ NO                    |
| **Quick Testing**        | ❌ NO (need QR)                | ✅ YES                   |
| **Real Data**            | ✅ YES                         | ❌ NO (fake IDs)         |

---

## Quick Answer

### "What is purpose of OPEN Camera Scanner?"

**To scan physical QR codes displayed by parents** using the device camera. This is the real production feature teachers use to check-in/out of tutoring sessions at student's homes.

### "What is Test with Mock QR code?"

**Development testing tool** that simulates a QR scan without needing a camera or physical QR code. It's disabled in production and only used by developers for testing the check-in/out flow locally.

**TL;DR**:

- **📷 Open Camera Scanner** = Production feature (real QR scanning)
- **🧪 Test with Mock QR Code** = Dev tool (fake QR for testing)

---

**Last Updated**: November 13, 2025
**Component Version**: After QR System Compatibility Fix
**Status**: ✅ Both buttons working correctly
