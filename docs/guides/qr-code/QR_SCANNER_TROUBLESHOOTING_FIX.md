# QR Scanner Not Reading QR Codes - Troubleshooting & Fix

**Issue:** Camera QR scanner not able to read QR codes  
**Component:** `src/components/shared/QRScanner.tsx`  
**Status:** 🔴 **INVESTIGATING**

---

## 🔍 Problem Analysis

### Current Implementation

The QRScanner component uses `html5-qrcode` library with these settings:

```typescript
html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container', {
  formatsToSupport: [0], // 0 = QR_CODE format only
  verbose: false,
});

await html5QrCodeRef.current.start(
  cameraId,
  {
    fps: 10,
    qrbox: function (viewfinderWidth, viewfinderHeight) {
      const minEdgePercentage = 0.7;
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
      return { width: qrboxSize, height: qrboxSize };
    },
    aspectRatio: 1.0,
    disableFlip: false,
    videoConstraints: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
  decodedText => {
    onScan(decodedText);
  },
  errorMessage => {
    // Silently ignore routine scanning errors
  }
);
```

---

## 🐛 Potential Issues

### Issue 1: QR Code Format Support Too Restrictive

**Problem:** `formatsToSupport: [0]` only supports QR_CODE format, but might miss some QR codes.

**Fix:** Support multiple formats or remove restriction.

### Issue 2: Error Messages Silently Ignored

**Problem:** Error callback silently ignores all errors, making debugging impossible.

**Fix:** Log errors to help diagnose issues.

### Issue 3: QR Box Size Too Large

**Problem:** 70% of viewfinder might be too large, making detection harder.

**Fix:** Reduce QR box size for better detection.

### Issue 4: Camera Resolution Too High

**Problem:** 1280x720 might be too high for some devices, causing performance issues.

**Fix:** Use adaptive resolution or lower default.

### Issue 5: No Visual Feedback

**Problem:** No indication that scanner is actively scanning.

**Fix:** Add visual feedback and debug logs.

---

## 🔧 Proposed Fixes

### Fix 1: Improve Scanner Configuration

```typescript
// Better scanner configuration
html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container', {
  // Support multiple formats for better compatibility
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
  ],
  verbose: true, // Enable verbose for debugging
});

await html5QrCodeRef.current.start(
  cameraId,
  {
    fps: 10,
    qrbox: function (viewfinderWidth, viewfinderHeight) {
      // Smaller QR box (50% instead of 70%) for better detection
      const minEdgePercentage = 0.5;
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
      return {
        width: qrboxSize,
        height: qrboxSize,
      };
    },
    aspectRatio: 1.0,
    disableFlip: false, // Enable flip for better detection
    // More flexible video constraints
    videoConstraints: {
      facingMode: { ideal: 'environment' },
      // Let browser choose optimal resolution
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 },
    },
    // Additional settings for better detection
    rememberLastUsedCamera: true,
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
  },
  decodedText => {
    // Success callback
    console.log('✅ QR Code detected:', decodedText);
    onScan(decodedText);
    // Stop scanner after successful scan
    html5QrCodeRef.current?.stop();
  },
  errorMessage => {
    // Log errors for debugging (but don't spam console)
    if (!errorMessage.includes('NotFoundException')) {
      console.debug('QR Scan:', errorMessage);
    }
  }
);
```

### Fix 2: Add Better Error Handling

```typescript
const startScanning = async (cameraId: string) => {
  try {
    addDebugLog('Starting scanner...');

    html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: true, // Enable for debugging
    });

    await html5QrCodeRef.current.start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }, // Fixed size for consistency
        aspectRatio: 1.0,
        disableFlip: false,
      },
      decodedText => {
        addDebugLog(`✅ QR SCANNED: ${decodedText.substring(0, 50)}...`);
        setError(null);
        onScan(decodedText);
        stopScanning();
      },
      errorMessage => {
        // Only log actual errors, not routine scanning messages
        if (
          !errorMessage.includes('NotFoundException') &&
          !errorMessage.includes('No MultiFormat Readers')
        ) {
          addDebugLog(`⚠️ Scan: ${errorMessage}`);
        }
      }
    );

    addDebugLog('✅ Scanner ready - scanning...');
    setCameraStarted(true);
    setIsScanning(true);
    setError(null);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to start camera';
    addDebugLog(`❌ ERROR: ${errorMessage}`);

    // Better error messages
    if (
      errorMessage.includes('NotAllowedError') ||
      errorMessage.includes('Permission')
    ) {
      setError(
        'Camera permission denied. Please allow camera access in browser settings.'
      );
      onError?.('Camera permission denied');
    } else if (errorMessage.includes('NotFoundError')) {
      setError('No camera found on this device.');
      onError?.('No camera found');
    } else if (errorMessage.includes('NotReadableError')) {
      setError(
        'Camera is already in use by another application. Please close other apps using the camera.'
      );
      onError?.('Camera in use');
    } else {
      setError(`Failed to start camera: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }
};
```

### Fix 3: Add Manual Entry Fallback

```typescript
// Add manual entry option if camera fails
{error && (
  <div className="mt-4 space-y-3">
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      {error}
    </div>
    <button
      onClick={() => setShowManualEntry(true)}
      className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm"
    >
      📝 Enter QR Code Manually
    </button>
  </div>
)}
```

---

## 🧪 Testing Steps

### Test 1: Verify QR Code Format

1. Generate a QR code from parent dashboard
2. Check QR code data format:
   ```json
   {
     "type": "teacher_auth",
     "teacherId": "...",
     "studentId": "...",
     "parentId": "...",
     "timestamp": 1234567890,
     "signature": "..."
   }
   ```
3. Verify QR code is valid JSON when decoded

### Test 2: Test Scanner Detection

1. Open camera scanner
2. Point at QR code
3. Check browser console for:
   - "QR Code detected" messages
   - Error messages
   - Debug logs
4. Try different:
   - Distances (closer/farther)
   - Angles
   - Lighting conditions

### Test 3: Test QR Code Size

1. Display QR code on screen
2. Try scanning at different sizes:
   - Small (200x200px)
   - Medium (400x400px)
   - Large (800x800px)
3. Note which sizes work best

### Test 4: Test Different Devices

1. Test on mobile device (recommended)
2. Test on desktop with webcam
3. Compare detection rates

---

## 🔍 Debugging Checklist

### Check Browser Console

Open browser console (F12) and look for:

- ✅ "Scanner ready - scanning..." message
- ✅ "QR Code detected" messages
- ❌ Error messages (NotAllowedError, NotFoundError, etc.)
- ❌ "No MultiFormat Readers" warnings

### Check Camera Permissions

1. Browser Settings → Site Settings → Camera
2. Verify permission is "Allow"
3. Try reloading page after granting permission

### Check QR Code Quality

1. Ensure QR code is clear and not pixelated
2. Check QR code has proper margins (quiet zone)
3. Verify QR code is not too small
4. Ensure good lighting

### Check Network/HTTPS

1. Verify site is using HTTPS (required for camera)
2. Check for network errors
3. Verify Supabase connection

---

## 🛠️ Immediate Fixes to Try

### Fix A: Simplify QR Box Size

Change from dynamic 70% to fixed size:

```typescript
qrbox: { width: 250, height: 250 } // Fixed size
```

Instead of:

```typescript
qrbox: function (viewfinderWidth, viewfinderHeight) {
  const minEdgePercentage = 0.7;
  // ...
}
```

### Fix B: Enable Verbose Logging

```typescript
html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container', {
  formatsToSupport: [0],
  verbose: true, // Change to true for debugging
});
```

### Fix C: Add Error Logging

```typescript
errorMessage => {
  // Log all errors for debugging
  console.log('QR Scanner Error:', errorMessage);

  // Only show user-friendly errors
  if (errorMessage.includes('NotAllowedError')) {
    setError('Camera permission denied');
  }
};
```

### Fix D: Test with Different FPS

Try different FPS values:

- `fps: 5` (slower, more accurate)
- `fps: 10` (current)
- `fps: 20` (faster, less accurate)

---

## 📋 Quick Diagnostic Steps

1. **Open Browser Console** (F12)
2. **Click "Open Camera Scanner"**
3. **Check Console Output:**
   - ✅ "Found X cameras" - Camera detected
   - ✅ "Scanner ready" - Scanner started
   - ❌ "No cameras found" - Camera issue
   - ❌ "Permission denied" - Permission issue

4. **Point Camera at QR Code**
5. **Check Console:**
   - ✅ "QR Code detected" - Working!
   - ❌ No messages - Scanner not detecting
   - ❌ Error messages - Check error type

6. **Try Different QR Code:**
   - Use test QR code generator
   - Try parent's QR code
   - Try mock QR code (dev only)

---

## 🎯 Most Likely Causes

### 1. QR Code Too Small or Too Far

**Solution:**

- Move closer to QR code
- Make QR code larger on screen
- Ensure QR code fills scanning frame

### 2. Poor Lighting

**Solution:**

- Move to better lit area
- Use device flashlight if available
- Ensure QR code is well-lit

### 3. Camera Permission Not Granted

**Solution:**

- Check browser settings
- Grant camera permission
- Reload page

### 4. QR Code Format Issue

**Solution:**

- Verify QR code contains valid JSON
- Check QR code type is "teacher_auth"
- Regenerate QR code if needed

### 5. Scanner Configuration Issue

**Solution:**

- Try fixes above
- Simplify scanner config
- Test with different settings

---

## 🚀 Recommended Immediate Actions

1. **Enable Verbose Logging**
   - Change `verbose: false` to `verbose: true`
   - Check console for detailed logs

2. **Add Error Logging**
   - Log all errors to console
   - Show user-friendly error messages

3. **Simplify QR Box**
   - Use fixed size instead of dynamic
   - Try smaller size (200x200)

4. **Test with Test QR Code**
   - Use test QR code generator page
   - Verify scanner works with known-good QR code

5. **Check QR Code Format**
   - Verify QR code contains expected JSON
   - Check signature is valid

---

## 📝 Next Steps

1. **Apply Fixes Above**
2. **Test on Multiple Devices**
3. **Check Browser Console Logs**
4. **Test with Different QR Codes**
5. **Report Specific Error Messages**

---

**Status:** 🔴 **NEEDS FIX**  
**Priority:** P0 CRITICAL  
**Next Action:** Apply fixes and test
