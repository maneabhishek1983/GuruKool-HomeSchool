# QR Scanner Features Explained

**Component:** `src/components/teacher/QRCheckInOut.tsx`  
**Purpose:** Understanding the two QR scanning options available to teachers

---

## 📷 Feature 1: "Open Camera Scanner" Button

### What It Does

**Purpose:** Opens your device's camera to scan a real QR code displayed by parents.

### How It Works

1. **Click the Button**
   - Button text: "📷 Open Camera Scanner"
   - Location: Check-In/Out tab → Initial screen

2. **Camera Permission Request**
   - Browser asks for camera permission (first time only)
   - You must click "Allow" to proceed
   - **Note:** Camera requires HTTPS (Vercel provides this)

3. **Camera View Opens**
   - Real-time camera feed displays
   - Scanning frame appears (250x250px box)
   - Instructions: "Position the QR code within the camera frame"

4. **Scan QR Code**
   - Point camera at parent's QR code
   - QR code can be:
     - Displayed on parent's screen
     - Printed on paper
     - Shown on mobile device
   - Scanner automatically detects QR code

5. **QR Code Detected**
   - Scanner closes automatically
   - QR data is processed
   - You proceed to "Select Action" screen (Check In/Check Out)

### Technical Details

**Library Used:** `html5-qrcode` (production-grade QR scanner)

**Features:**

- ✅ Real camera access
- ✅ Automatic QR detection
- ✅ Torch/flashlight support (mobile)
- ✅ Zoom controls (mobile)
- ✅ iOS optimizations
- ✅ Error handling
- ✅ Auto-cleanup on close

**Code Location:**

- Component: `src/components/shared/QRScanner.tsx`
- Uses: `Html5QrcodeScanner` from `html5-qrcode` library

### When to Use

✅ **Use Camera Scanner When:**

- You have a real QR code from parent
- You're on a device with camera (mobile recommended)
- You want to check in/out for actual teaching sessions
- You're in production environment

❌ **Don't Use When:**

- No camera available
- Camera permission denied
- Testing without real QR codes
- Development/testing (use mock instead)

---

## 🧪 Feature 2: "Test with Mock QR Code (Dev Only)" Button

### What It Does

**Purpose:** Generates fake QR code data for testing without needing a real QR code or camera.

### How It Works

1. **Click the Button**
   - Button text: "🧪 Test with Mock QR Code (Dev Only)"
   - Location: Check-In/Out tab → Initial screen
   - **Note:** Only visible/works in development mode

2. **Mock Data Generated**
   - Creates fake QR code data:
     ```json
     {
       "type": "check_in",
       "parentId": "parent-123",
       "studentId": "student-456",
       "timestamp": [current timestamp],
       "signature": "[mock signature]"
     }
     ```

3. **Processes Like Real QR Code**
   - Mock data is passed to `handleQRScan()`
   - System treats it like a real scanned QR code
   - You proceed to "Select Action" screen

4. **Select Check-In/Check-Out**
   - Choose your action
   - System processes the mock data
   - **Note:** May fail validation if mock data doesn't match real database records

### Technical Details

**Code Location:** `src/components/teacher/QRCheckInOut.tsx` (lines 171-189)

**Security Features:**

```typescript
if (process.env.NODE_ENV === 'production') {
  setError('Mock QR scan is disabled in production');
  return;
}
```

**Key Points:**

- ✅ Only works in development (`NODE_ENV !== 'production'`)
- ✅ Disabled in production for security
- ✅ Uses predictable mock data
- ✅ Not secure (bypasses real QR validation)
- ✅ For testing only

### When to Use

✅ **Use Mock QR When:**

- Testing the check-in/out flow
- No camera available
- No real QR codes available
- Development environment
- Quick testing without setup

❌ **Don't Use When:**

- Production environment (disabled anyway)
- Real teaching sessions
- Testing actual QR code validation
- Testing camera functionality

### Limitations

⚠️ **Mock QR Code Limitations:**

1. **May Fail Validation**
   - Mock data uses fake IDs (`parent-123`, `student-456`)
   - These IDs don't exist in database
   - Check-in/out may fail with "QR code not found" error

2. **No Real Data**
   - Doesn't test actual QR code format
   - Doesn't test signature validation
   - Doesn't test QR code expiry

3. **Development Only**
   - Completely disabled in production
   - Button may not appear in production builds

---

## 🔄 Complete Flow Comparison

### Flow 1: Real Camera Scanner

```
1. Click "Open Camera Scanner"
   ↓
2. Grant camera permission
   ↓
3. Camera view opens
   ↓
4. Point at real QR code
   ↓
5. QR code detected automatically
   ↓
6. Scanner closes
   ↓
7. QR data validated
   ↓
8. Select Check-In/Check-Out
   ↓
9. Session created in database
```

### Flow 2: Mock QR Code

```
1. Click "Test with Mock QR Code"
   ↓
2. Mock data generated instantly
   ↓
3. Mock data passed to handler
   ↓
4. Select Check-In/Check-Out
   ↓
5. May fail validation (fake IDs)
   ↓
6. OR may succeed (if validation bypassed)
```

---

## 📊 Feature Comparison Table

| Feature                   | Camera Scanner   | Mock QR Code             |
| ------------------------- | ---------------- | ------------------------ |
| **Purpose**               | Real QR scanning | Testing without QR codes |
| **Requires Camera**       | ✅ Yes           | ❌ No                    |
| **Requires Real QR Code** | ✅ Yes           | ❌ No                    |
| **Works in Production**   | ✅ Yes           | ❌ No (disabled)         |
| **Works in Development**  | ✅ Yes           | ✅ Yes                   |
| **Validates QR Code**     | ✅ Yes           | ⚠️ May fail              |
| **Creates Real Sessions** | ✅ Yes           | ⚠️ May fail              |
| **Best For**              | Actual teaching  | Testing flow             |

---

## 🎯 Use Cases

### Use Case 1: Teacher Checking In for Real Session

**Scenario:** Teacher arrives at student's home, needs to check in.

**Steps:**

1. Open teacher dashboard on mobile
2. Go to Check-In/Out tab
3. Click "📷 Open Camera Scanner"
4. Parent shows QR code on their screen/phone
5. Point camera at QR code
6. QR code detected
7. Select "Check In"
8. Session starts ✅

**Result:** Real session created in database, timesheet entry recorded.

---

### Use Case 2: Developer Testing Check-In Flow

**Scenario:** Developer wants to test the check-in/out UI without setting up real QR codes.

**Steps:**

1. Run app in development mode (`npm run dev`)
2. Login as teacher
3. Go to Check-In/Out tab
4. Click "🧪 Test with Mock QR Code"
5. Mock data generated
6. Select "Check In"
7. See if UI flow works ✅

**Result:** UI flow tested, but actual database operation may fail (expected).

---

### Use Case 3: Testing Without Camera

**Scenario:** Developer on laptop without camera wants to test QR scanning logic.

**Steps:**

1. Use mock QR code button
2. Test the scanning flow
3. Verify error handling
4. Test UI states

**Result:** Can test logic without camera hardware.

---

## 🔍 Technical Implementation Details

### Camera Scanner Implementation

**Component:** `src/components/shared/QRScanner.tsx`

**Key Code:**

```typescript
scannerRef.current = new Html5QrcodeScanner(
  'qr-scanner-container',
  {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
  },
  false
);

scannerRef.current.render(
  decodedText => {
    onScan(decodedText); // QR code detected!
    scannerRef.current?.clear();
  },
  errorMessage => {
    // Handle scan errors
  }
);
```

**Features:**

- Real-time scanning at 10 FPS
- 250x250px scanning area
- Torch/flashlight support
- Zoom controls
- Auto-cleanup on success

---

### Mock QR Code Implementation

**Component:** `src/components/teacher/QRCheckInOut.tsx`

**Key Code:**

```typescript
const simulateQRScan = () => {
  // Security: Disabled in production
  if (process.env.NODE_ENV === 'production') {
    setError('Mock QR scan is disabled in production');
    return;
  }

  // Generate mock QR data
  const mockQRData = JSON.stringify({
    type: 'check_in',
    parentId: 'parent-123',
    studentId: 'student-456',
    timestamp: Date.now(),
    signature: btoa('parent-123-student-456-dev-test-only').slice(0, 16),
  });

  // Process like real QR code
  handleQRScan(mockQRData);
};
```

**Security:**

- ✅ Production check prevents misuse
- ✅ Clear dev-only indication
- ✅ Mock signature clearly marked

---

## ⚠️ Important Notes

### Security Considerations

1. **Mock QR Code Security**
   - Disabled in production ✅
   - Uses predictable data (not secure)
   - Only for development testing
   - Never use for real sessions

2. **Camera Scanner Security**
   - Requires HTTPS (Vercel provides)
   - Browser permission required
   - QR code validation on backend
   - Signature verification

### Browser Compatibility

**Camera Scanner:**

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (iOS)
- ⚠️ May not work on older browsers

**Mock QR Code:**

- ✅ All browsers (development only)

### Mobile vs Desktop

**Camera Scanner:**

- ✅ **Mobile:** Best experience, easier to scan
- ⚠️ **Desktop:** Requires webcam, less convenient

**Mock QR Code:**

- ✅ Works same on both (development only)

---

## 🐛 Troubleshooting

### Camera Scanner Issues

**Problem:** Camera doesn't open

**Solutions:**

1. Check browser permissions (Settings → Site Settings → Camera)
2. Ensure HTTPS (required for camera)
3. Try different browser
4. Check device camera works
5. Reload page after granting permission

---

**Problem:** QR code not detected

**Solutions:**

1. Improve lighting
2. Hold device steady
3. Move closer/farther
4. Ensure QR code is clear
5. Try refreshing QR code

---

### Mock QR Code Issues

**Problem:** "Mock QR scan is disabled in production"

**Solution:** This is expected! Mock QR only works in development. Use real camera scanner in production.

---

**Problem:** Mock QR check-in fails

**Solution:** This is expected! Mock data uses fake IDs that don't exist in database. Use real QR codes for actual check-ins.

---

## 📝 Summary

### "Open Camera Scanner" Button

- **Purpose:** Scan real QR codes with device camera
- **Use:** Production, real teaching sessions
- **Requires:** Camera, real QR code, HTTPS
- **Result:** Creates real sessions in database

### "Test with Mock QR Code" Button

- **Purpose:** Test check-in/out flow without camera/QR codes
- **Use:** Development, testing only
- **Requires:** Development environment
- **Result:** Tests UI flow (may fail database validation)

---

**Last Updated:** January 2025  
**Component:** `QRCheckInOut.tsx`  
**Status:** Both features working as designed
