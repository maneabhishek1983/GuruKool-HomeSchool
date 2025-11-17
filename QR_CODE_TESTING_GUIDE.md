# QR Code Testing Guide - GuruKool Teacher Mobile App

**Date**: 2025-11-17
**Purpose**: Comprehensive guide for testing QR code scanning functionality

---

## 🎯 Overview

The GuruKool Teacher mobile app uses QR codes to check-in/check-out for teaching sessions. Testing QR scanning has different approaches depending on the environment:

- **Web (Chrome)**: ⚠️ Limited - Camera API has restrictions
- **Mobile (Android/iOS)**: ✅ Full support - Native camera scanning
- **Simulator**: 🔧 Requires special setup

---

## 📋 QR Code Format

The app expects QR codes with the following JSON format:

```json
{
  "student_id": "uuid-of-student",
  "parent_id": "uuid-of-parent",
  "qr_code_id": "unique-qr-code-identifier"
}
```

**Example**:

```json
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": "550e8400-e29b-41d4-a716-446655440001",
  "qr_code_id": "QR-2025-001"
}
```

---

## 🧪 Testing Methods

### Method 1: Real Mobile Device (Recommended ✅)

**Best for**: Production-ready testing with actual camera

**Steps**:

1. **Build for mobile device**:

   ```bash
   cd gurukool_teacher

   # For Android
   flutter build apk --release
   flutter install

   # For iOS (requires Mac)
   flutter build ios --release
   ```

2. **Generate test QR codes** (see section below)

3. **Print or display QR code on another device**

4. **Open app on mobile device**:
   - Login with `teacher@example.com` / `teacher123`
   - Navigate to "QR Scanner"
   - Point camera at QR code

5. **Verify**:
   - ✅ QR code detected
   - ✅ Location captured
   - ✅ Session created in Supabase
   - ✅ "Scanned: {data}" appears at top

---

### Method 2: Chrome with Virtual Camera (Web Testing)

**Best for**: Quick testing without mobile device

**Limitations**:

- Requires HTTPS or localhost
- Camera must be enabled in browser
- May not work in all browsers

**Steps**:

1. **Enable camera in Chrome**:
   - Go to `chrome://settings/content/camera`
   - Allow localhost to access camera

2. **Run Flutter web**:

   ```bash
   cd gurukool_teacher
   flutter run -d chrome
   ```

3. **Grant camera permissions** when prompted

4. **Display QR code on screen**:
   - Open generated QR code image
   - Hold up to webcam

**Note**: The `mobile_scanner` package has limited support on web. You may see camera permissions issues.

---

### Method 3: Manual QR Code Input (Development)

**Best for**: Testing QR parsing logic without camera

**Current implementation**: The app uses mock data in `_parseQRCode()`:

```dart
// qr_scanner_screen.dart line 240
Map<String, dynamic>? _parseQRCode(String code) {
  try {
    // TODO: Implement actual QR code parsing
    return {
      'student_id': 'student-123',
      'parent_id': 'parent-456',
      'qr_code_id': code,
    };
  } catch (e) {
    return null;
  }
}
```

**To test**:

1. Temporarily add a "Test Scan" button
2. Call `_handleQRCodeDetected()` with mock data
3. Verify session creation flow

---

### Method 4: Simulator QR Upload

**Best for**: Testing on Android Emulator / iOS Simulator

**Android Emulator**:

1. Start emulator with camera support:

   ```bash
   emulator -avd Pixel_5_API_31 -camera-back webcam0
   ```

2. Run app:

   ```bash
   flutter run -d emulator-5554
   ```

3. Display QR code on screen, point webcam at it

**iOS Simulator**:

- iOS Simulator doesn't support camera
- Requires physical device for testing

---

## 🔧 Generating Test QR Codes

### Option 1: Use Web App

**If the web app has QR generation**:

1. Login to web app as parent
2. Navigate to student profile
3. Generate QR code for teacher check-in
4. Download/print QR code

### Option 2: Generate Manually with Node Script

Create `scripts/generate-test-qr.js`:

```javascript
const QRCode = require('qrcode');
const fs = require('fs');

const testQRData = {
  student_id: '550e8400-e29b-41d4-a716-446655440000',
  parent_id: '550e8400-e29b-41d4-a716-446655440001',
  qr_code_id: 'TEST-QR-001',
};

const qrString = JSON.stringify(testQRData);

QRCode.toFile(
  'test-qr-code.png',
  qrString,
  {
    width: 300,
    margin: 2,
  },
  err => {
    if (err) {
      console.error('Error generating QR code:', err);
    } else {
      console.log('✅ QR code generated: test-qr-code.png');
      console.log('Data:', qrString);
    }
  }
);
```

**Install dependency**:

```bash
npm install qrcode
```

**Run**:

```bash
node scripts/generate-test-qr.js
```

### Option 3: Online QR Generator

1. Go to https://www.qr-code-generator.com/
2. Select "Text" type
3. Paste JSON data:
   ```json
   {
     "student_id": "550e8400-e29b-41d4-a716-446655440000",
     "parent_id": "550e8400-e29b-41d4-a716-446655440001",
     "qr_code_id": "TEST-QR-001"
   }
   ```
4. Download QR code image

---

## ✅ Testing Checklist

### Pre-Scan Checks

- [ ] App is running and logged in
- [ ] Camera permissions granted
- [ ] Location permissions granted (for GPS capture)
- [ ] QR code is generated with correct format
- [ ] Supabase connection is working

### During Scan

- [ ] Camera preview loads correctly
- [ ] Scan overlay (corner markers) displays
- [ ] QR code is detected within 2-3 seconds
- [ ] "Processing..." indicator appears
- [ ] "Scanned: {data}" shows at top of screen

### Post-Scan Verification

- [ ] Session created in `teacher_sessions` table in Supabase
- [ ] Session has correct:
  - `teacher_id` (logged-in teacher)
  - `student_id` (from QR code)
  - `parent_id` (from QR code)
  - `session_start` (current timestamp)
  - `location` (GPS coordinates)
  - `qr_code_used` (QR code data)
- [ ] App navigates to success screen (or shows success message)

---

## 🐛 Common Issues & Fixes

### Issue 1: "Camera permission denied"

**Cause**: App doesn't have camera access

**Fix**:

- **Android**: Settings → Apps → GuruKool Teacher → Permissions → Camera → Allow
- **iOS**: Settings → Privacy → Camera → GuruKool Teacher → Enable
- **Chrome**: chrome://settings/content/camera → Allow localhost

### Issue 2: "Location permission denied"

**Cause**: App doesn't have GPS access

**Fix**:

- **Android**: Settings → Apps → GuruKool Teacher → Permissions → Location → Allow
- **iOS**: Settings → Privacy → Location Services → GuruKool Teacher → While Using

### Issue 3: QR code not detected

**Possible causes**:

- QR code too small (increase size)
- QR code blurry (use high-quality image)
- Poor lighting (improve lighting conditions)
- Wrong camera selected (switch to back camera)

**Fix**:

- Print QR code at least 2x2 inches
- Ensure good lighting
- Hold steady for 2-3 seconds
- Try tapping screen to focus

### Issue 4: "Invalid QR code format"

**Cause**: QR code data doesn't match expected JSON format

**Fix**:

- Verify QR code contains valid JSON
- Check JSON has required fields: `student_id`, `parent_id`, `qr_code_id`
- Ensure UUIDs are valid format

### Issue 5: Session not created in Supabase

**Possible causes**:

- Not authenticated
- Database permissions (RLS policies)
- Network connection issue

**Fix**:

- Check user is logged in
- Verify `teacher_sessions` table exists
- Check RLS policies allow INSERT
- Test network connection

---

## 📱 Mobile Device Testing (Recommended)

### Android

1. **Connect device via USB**:

   ```bash
   adb devices
   ```

2. **Run on device**:

   ```bash
   cd gurukool_teacher
   flutter run
   ```

3. **Generate test QR code** (see above)

4. **Test scanning**:
   - Open app
   - Navigate to QR Scanner
   - Scan QR code
   - Verify session created

### iOS

1. **Connect iPhone via cable**

2. **Run on device**:

   ```bash
   cd gurukool_teacher
   flutter run
   ```

3. **Generate test QR code**

4. **Test scanning** (same as Android)

---

## 🔬 Advanced Testing

### Test Multiple QR Codes

Create multiple test QR codes with different student IDs:

```javascript
// scripts/generate-multiple-qr.js
const QRCode = require('qrcode');

const students = [
  { id: 'student-001', name: 'John Doe' },
  { id: 'student-002', name: 'Jane Smith' },
  { id: 'student-003', name: 'Bob Johnson' },
];

students.forEach(async (student, index) => {
  const qrData = {
    student_id: student.id,
    parent_id: 'parent-001',
    qr_code_id: `QR-${student.id}`,
  };

  await QRCode.toFile(
    `qr-${student.name.replace(' ', '-')}.png`,
    JSON.stringify(qrData)
  );
  console.log(`✅ Generated QR for ${student.name}`);
});
```

### Performance Testing

Test scanning speed and accuracy:

1. Scan 10 QR codes in succession
2. Measure time from scan to session creation
3. Verify all sessions created correctly
4. Check for duplicate sessions

### Location Accuracy Testing

Verify GPS coordinates are captured:

1. Scan QR code at different locations
2. Check `location` field in `teacher_sessions` table
3. Verify coordinates are accurate
4. Test with location services disabled (should error gracefully)

---

## 📊 Expected Results

### Successful Scan

```
1. QR code detected ✅
2. Location captured ✅
3. Session created in Supabase ✅
4. Success message displayed ✅
5. Total time: < 5 seconds ✅
```

### Sample Session Data

```json
{
  "id": "session-uuid",
  "teacher_id": "550e8400-e29b-41d4-a716-446655440001",
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": "550e8400-e29b-41d4-a716-446655440002",
  "session_start": "2025-11-17T10:00:00Z",
  "session_end": null,
  "location": "37.7749,-122.4194",
  "qr_code_used": "{\"student_id\":\"...\",\"parent_id\":\"...\",\"qr_code_id\":\"...\"}",
  "duration_minutes": null,
  "created_at": "2025-11-17T10:00:00Z"
}
```

---

## 🚀 Next Steps

1. ✅ **Test on Android device** (recommended)
2. ✅ **Generate test QR codes** with real student IDs from Supabase
3. ✅ **Verify session creation** in Supabase dashboard
4. ✅ **Test session history** to see created sessions
5. ✅ **Test check-out flow** (scan again to end session)

---

## 📖 Related Documentation

- **QR Scanner Implementation**: `gurukool_teacher/lib/screens/qr_scanner_screen.dart`
- **Session Management**: `gurukool_teacher/lib/screens/session_history_screen.dart`
- **Database Schema**: `supabase/migrations/`
- **Mobile Scanner Package**: https://pub.dev/packages/mobile_scanner

---

**Status**: 📱 **Best tested on real Android/iOS device**
**Web Support**: ⚠️ Limited (camera API restrictions)
**Production Ready**: ✅ Yes (on mobile devices)
