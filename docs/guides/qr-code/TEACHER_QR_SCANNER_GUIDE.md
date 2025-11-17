# Teacher QR Scanner Guide - Mobile Setup & Usage

## Prerequisites for Teachers

### 1. **Teacher Account Setup** ✅ REQUIRED

**Before scanning QR codes, teachers MUST:**

#### Step 1: Accept Invitation

1. Parent creates teacher profile in GuruKool
2. Teacher receives invitation URL (via email or manual sharing)
3. Teacher opens invitation URL: `https://yourapp.com/accept-invitation?token=...`
4. Teacher sets password and creates account

#### Step 2: Verify Account Created

- Check that you can login at: `https://yourapp.com/login`
- Email: [teacher's email from parent]
- Password: [password you set during invitation]

#### Step 3: Verify Teacher Dashboard Access

- After login, you should see "Teacher Dashboard"
- Check that "Check-In/Out" tab is visible

---

### 2. **Mobile Device Requirements** 📱

#### Supported Devices

✅ **iOS Devices** (iPhone, iPad)

- iOS 11+ (for camera API support)
- Safari browser (recommended)
- Chrome browser (alternative)

✅ **Android Devices**

- Android 7+ (for camera API support)
- Chrome browser (recommended)
- Firefox browser (alternative)

❌ **Not Supported**

- Older devices without camera access
- Browsers without camera API (IE, old Safari)

#### Browser Permissions

**Camera Access MUST be enabled:**

**iOS Safari:**

1. Open Settings → Safari
2. Scroll to "Camera" setting
3. Set to "Ask" or "Allow"
4. When prompted on website, tap "Allow"

**iOS Chrome:**

1. Open Settings → Chrome
2. Tap "Content Settings"
3. Tap "Camera"
4. Enable camera access

**Android Chrome:**

1. Open Settings → Apps → Chrome
2. Tap "Permissions"
3. Enable "Camera"

---

### 3. **Network Requirements** 🌐

#### Internet Connection

- **WiFi** or **Mobile Data** required
- QR scanning requires API call to validate
- Offline scanning NOT supported yet

#### HTTPS Requirement

- Camera API requires secure connection (HTTPS)
- ✅ Production: `https://yourapp.com` (HTTPS)
- ✅ Development: `http://localhost:3002` (localhost exception)
- ❌ HTTP on remote IP: Camera won't work

**For Testing on Local Network:**
If testing locally on mobile (not localhost):

1. Use tunneling service (ngrok, localtunnel)
2. Or deploy to Vercel preview environment
3. HTTP on remote IPs will block camera access

---

## How to Use QR Scanner (Step-by-Step)

### For Teachers: Check-In/Check-Out Flow

#### Step 1: Get QR Code from Parent

**Option A: Parent Shows QR Code**

- Parent opens GuruKool app
- Parent navigates to Teacher Management → Teacher [Name]
- Parent clicks "View QR Code" for student
- Parent displays QR code on their screen

**Option B: Download QR Code**

- Parent clicks "📥 Download QR Code"
- Saves PNG file
- Sends file to teacher (email, WhatsApp, etc.)
- Teacher can print or display on screen

#### Step 2: Login to Teacher Dashboard

1. Open browser on mobile device
2. Go to: `https://yourapp.com/login` (or `http://localhost:3002/login` for dev)
3. Enter teacher email and password
4. Tap "Login"
5. Verify you see "Teacher Dashboard"

#### Step 3: Navigate to Check-In/Out

1. On Teacher Dashboard, tap **"Check-In/Out"** tab
2. You should see:
   - "Ready to scan QR code" screen
   - "📷 Open Camera Scanner" button
   - "🧪 Test with Mock QR Code (Dev Only)" button (dev mode only)

#### Step 4: Scan QR Code

**Option A: Camera Scan (Recommended)**

1. Tap **"📷 Open Camera Scanner"**
2. Browser will prompt for camera permission
   - **First time**: Tap "Allow" to grant camera access
   - **Denied**: Go to browser settings and enable camera
3. Camera view opens with scanning box
4. Position QR code in the scanning box:
   - Hold device 6-12 inches from QR code
   - Ensure good lighting (not too dark)
   - Keep steady (avoid shaking)
   - Wait 1-2 seconds for auto-detection
5. **Success**: Screen changes to "Select Action"
6. **Failure**: Error message appears, try again

**Option B: Mock QR (Development Only)**

1. Tap **"🧪 Test with Mock QR Code (Dev Only)"**
2. System generates mock QR data
3. Proceeds to "Select Action" screen
4. ⚠️ Only works in development (NODE_ENV=development)

#### Step 5: Select Check-In or Check-Out

1. **Check-In** (🟢 Green button):
   - Available when: NOT currently checked in
   - Starts new session
   - Records check-in timestamp

2. **Check-Out** (🔴 Red button):
   - Available when: Currently checked in
   - Ends active session
   - Records check-out timestamp
   - Calculates session duration
   - Optional: Add session notes

3. Tap your desired action

#### Step 6: Verify Success

1. "Processing..." screen appears briefly
2. "Checked In!" or "Checked Out!" success screen
3. Timestamp displayed
4. Screen auto-resets after 3 seconds
5. Ready to scan next QR code

---

## Troubleshooting

### Issue: "Camera Permission Denied"

**Symptoms**: Scanner button does nothing or shows error

**Solution**:

1. Check browser settings (see "Mobile Device Requirements" above)
2. Reload page after granting permission
3. Try different browser (Safari vs Chrome)
4. Clear browser cache and try again

---

### Issue: "Invalid QR Code"

**Symptoms**: Error message "Invalid QR code. Please scan a valid QR code."

**Possible Causes**:

1. **Wrong QR Code Type**
   - Solution: Use QR codes from Teacher Management section (not parent/admin QR codes)
   - Check: QR should say "Type: teacher_auth"

2. **Expired QR Code**
   - Solution: Ask parent to regenerate QR code
   - Old QR codes may use different signature

3. **Signature Mismatch**
   - Solution: Ensure `NEXT_PUBLIC_QR_SECRET` is set correctly
   - Check: Server should have restarted after adding env var

4. **Corrupted QR Code Image**
   - Solution: Download fresh QR code from parent portal
   - Ensure image is clear and not pixelated

---

### Issue: "QR Code Won't Scan"

**Symptoms**: Camera opens but doesn't detect QR code

**Solutions**:

1. **Improve Lighting**
   - Move to brighter area
   - Avoid glare/reflections on screen
   - Don't use flash (can cause glare)

2. **Adjust Distance**
   - Too close: Move back 6-12 inches
   - Too far: Move closer
   - Find optimal focus distance

3. **Check QR Code Quality**
   - Ensure QR code is not blurry
   - Use high-resolution QR code (512x512px)
   - Print on white paper (better contrast)

4. **Hold Steady**
   - Avoid shaking camera
   - Rest phone on stable surface if needed
   - Wait 2-3 seconds for detection

---

### Issue: "Already Checked In" Error

**Symptoms**: Can't check in, button disabled

**Solution**:

- You have an active check-in session
- Must check out first before new check-in
- Ask parent to verify your session status in dashboard

---

### Issue: "Not Checked In" Error

**Symptoms**: Can't check out, button disabled

**Solution**:

- You don't have an active check-in session
- Must check in first before checking out
- Scan QR code and tap "Check In" first

---

### Issue: "Network Error" / "Failed to Process"

**Symptoms**: Error message after selecting action

**Possible Causes**:

1. **No Internet Connection**
   - Check WiFi or mobile data
   - Try loading other websites

2. **Server Down**
   - Contact admin
   - Try again in a few minutes

3. **Rate Limit Exceeded**
   - Too many scan attempts (20/minute limit)
   - Wait 1 minute and try again

---

### Issue: Camera Shows Black Screen

**Symptoms**: Camera permission granted but screen is black

**Solutions**:

1. **Reload Page**: Close and reopen browser
2. **Restart Browser**: Force quit and relaunch
3. **Check Camera**: Test camera in native camera app
4. **Clear Cache**: Clear browser cache and cookies
5. **Try Different Browser**: Switch to Safari/Chrome

---

## Best Practices

### For Optimal Scanning Experience

1. **Good Lighting** 💡
   - Natural daylight is best
   - Avoid direct sunlight (creates glare)
   - Indoor lighting should be bright

2. **Clean QR Codes** 🖼️
   - Use high-resolution downloads (not screenshots)
   - Print on white paper with good printer
   - Avoid wrinkled or damaged QR codes

3. **Steady Hands** 🤲
   - Hold device with both hands
   - Rest elbows on table for stability
   - Wait for auto-detection (don't rush)

4. **Test Before First Use** 🧪
   - Use "Test QR Code Format" button
   - Verify QR code is valid before printing
   - Practice scanning in good lighting

5. **Multiple QR Codes** 📚
   - Each student has unique QR code
   - Teachers assigned to multiple students get multiple QR codes
   - Always scan correct QR for current student

---

## Technical Details

### QR Code Contains:

```json
{
  "type": "teacher_auth",
  "teacherId": "UUID",
  "studentId": "UUID",
  "parentId": "UUID",
  "timestamp": 1234567890000,
  "signature": "HMAC-SHA256-hash"
}
```

### Security Features:

- ✅ Cryptographically signed (HMAC-SHA256)
- ✅ Each QR code is student-specific
- ✅ QR codes can be revoked by parent
- ✅ Usage tracked (count + last used timestamp)
- ✅ Session logs stored for parent review

### Session Data Captured:

- Teacher ID (who checked in/out)
- Student ID (which student)
- Parent ID (who owns the QR code)
- Timestamp (exact time of scan)
- Session type (sign_in or sign_out)
- Location (optional, if enabled)
- Notes (optional, added at check-out)
- QR code used (reference to QR code ID)

---

## Quick Reference Card

### ✅ Before First Use:

1. [ ] Accept teacher invitation
2. [ ] Create password and login
3. [ ] Verify Teacher Dashboard access
4. [ ] Enable camera permissions in browser
5. [ ] Test internet connection

### ✅ Each Time You Check In/Out:

1. [ ] Login to Teacher Dashboard
2. [ ] Tap "Check-In/Out" tab
3. [ ] Tap "📷 Open Camera Scanner"
4. [ ] Allow camera permission (first time)
5. [ ] Position QR code in scanning box
6. [ ] Wait for auto-detection
7. [ ] Select "Check In" or "Check Out"
8. [ ] Verify success message

### ✅ If Something Goes Wrong:

1. [ ] Check camera permissions
2. [ ] Improve lighting
3. [ ] Hold device steady
4. [ ] Try different browser
5. [ ] Ask parent to regenerate QR code
6. [ ] Contact admin for support

---

## Support Contacts

**For Technical Issues:**

- Admin Dashboard → Contact Support
- Email: [admin email]

**For QR Code Issues:**

- Contact parent who assigned you
- Parent can regenerate QR codes
- Parent can view session logs

**For Account Issues:**

- Use "Forgot Password" on login page
- Contact parent who invited you
- Admin can reset account

---

## Appendix: Development Testing

### For Developers Testing Locally

**Option 1: Mock QR Code (No Camera Needed)**

```javascript
// QRCheckInOut.tsx already has this button
// Click "🧪 Test with Mock QR Code (Dev Only)"
// Works only when NODE_ENV=development
```

**Option 2: Test Real QR Code (On Same Device)**

```bash
# 1. Login as parent
# 2. View QR code modal
# 3. Download QR code
# 4. Open in new tab/window
# 5. Login as teacher in another tab
# 6. Scan displayed QR code with camera
```

**Option 3: Test on Mobile (Local Network)**

```bash
# Use ngrok for HTTPS tunnel
ngrok http 3002

# Open ngrok URL on mobile
https://abc123.ngrok.io

# Camera will work (HTTPS)
```

**Verify API Response:**

```bash
# Check browser Network tab
# POST /api/teacher-sessions/scan
# Should return 200 with session object

# Check database
# SELECT * FROM teacher_sessions ORDER BY created_at DESC LIMIT 1;
```

---

## Changelog

**v1.0 (Current)**

- ✅ QR code generation with HMAC-SHA256
- ✅ Camera scanner integration (html5-qrcode)
- ✅ Teacher check-in/out flow
- ✅ Session logging and tracking
- ✅ Rate limiting (20/minute)
- ✅ Error handling and validation
- ✅ Parent QR code management
- ✅ Test QR code format button

**v2.0 (Planned)**

- [ ] Geofencing (location-based restrictions)
- [ ] Time-based restrictions (scheduled hours only)
- [ ] Photo verification (selfie on check-in)
- [ ] Offline queue (scan when offline, sync later)
- [ ] Push notifications (notify parent)
- [ ] QR code expiration (auto-expire after X days)
