# QR Code User Validation Guide

## 🎯 Purpose

This guide provides step-by-step instructions for parents, teachers, and testers to validate QR code functionality in the GuruKool HomeSchool application.

---

## 📋 Prerequisites

Before testing QR codes, ensure you have:

- [ ] Local development server running (`npm run dev`)
- [ ] Supabase credentials configured in `.env.local`
- [ ] At least one parent account created
- [ ] At least one student profile created
- [ ] At least one teacher profile created
- [ ] Teacher assigned to student
- [ ] Smartphone with camera (iOS or Android) OR QR scanner app

---

## 🔍 Test Scenario 1: Parent Creates and Views QR Code

### Step 1: Login as Parent

1. Open browser to `http://localhost:3000/login`
2. Enter parent credentials:
   - Email: `parent@example.com`
   - Password: `parent123` (if using demo account)
3. Click **"Sign In"**
4. Verify redirect to Parent Dashboard

### Step 2: Navigate to Student Management

1. From Parent Dashboard, click **"Students"** or **"Manage Students"**
2. You should see list of your students
3. Select a student who has a teacher assigned

### Step 3: View Teacher QR Codes

1. Click on student name or **"View Details"**
2. Look for **"Teacher QR Codes"** section or **"QR Codes"** tab
3. Click **"View QR Code"** for assigned teacher

**Expected Result:**

- ✅ QR code image displays (black/white pattern, NOT text)
- ✅ QR code is 512x512 pixels
- ✅ Shows student name and teacher name
- ✅ Has download/print button

**If QR Code Does NOT Display:**

- ❌ Shows "Loading..." forever → Check browser console for errors
- ❌ Shows error message → Check Supabase connection
- ❌ Shows blank/broken image → QR generation failed (see troubleshooting)

### Step 4: Download QR Code

1. Click **"Download QR Code"** button
2. Save as `teacher-qr-[student-name].png`
3. Open downloaded file
4. Verify it's a real QR code (black/white pattern)

### Step 5: Print QR Code (Optional)

1. Right-click QR code image
2. Select **"Print Image"**
3. Print on white paper
4. Ensure printout is clear and high contrast

---

## 🔍 Test Scenario 2: Teacher Scans QR Code for Check-In

### Step 1: Login as Teacher

1. Open browser to `http://localhost:3000/login`
2. Enter teacher credentials:
   - Email: `teacher@example.com`
   - Password: `teacher123` (if using demo account)
3. Click **"Sign In"**
4. Verify redirect to Teacher Dashboard

### Step 2: Navigate to Check-In/Out Page

1. From Teacher Dashboard, click **"Check In/Out"** or **"Sessions"**
2. Look for **"Scan QR Code"** button or camera icon
3. Click **"Scan QR Code to Check In"**

**Expected Result:**

- ✅ Camera permission prompt appears
- ✅ Camera preview shows on screen
- ✅ QR scanner is active

**If Camera Does NOT Start:**

- ❌ "Camera blocked" error → Grant camera permissions in browser
- ❌ "Camera not found" → Check if camera is available/working
- ❌ Page crashes → Check browser console for errors

### Step 3: Scan Student's QR Code

1. Hold printed QR code OR display QR on another device
2. Position QR code in center of camera view
3. Ensure good lighting (not too bright, not too dark)
4. Hold steady for 2-3 seconds

**Expected Result:**

- ✅ QR code detected (beep or visual feedback)
- ✅ Scanning overlay shows "Processing..."
- ✅ Success message: "Checked in successfully!"
- ✅ Active session card appears showing:
  - Student name
  - Check-in time
  - Running timer
  - Location (if permission granted)

**If QR Code Does NOT Scan:**

- ❌ No detection after 10 seconds → See troubleshooting section
- ❌ "Invalid QR code" error → QR data format issue
- ❌ "QR code expired" error → QR code signature validation failed
- ❌ "QR code not found in database" → Database issue

### Step 4: Verify Active Session

1. Check Teacher Dashboard for active session indicator
2. Verify session details:
   - Student name matches QR code
   - Start time is accurate
   - Timer is counting up
   - Location captured (if enabled)

### Step 5: Check Out from Session

1. Click **"Check Out"** button on active session
2. (Optional) Add session notes in modal
3. Click **"Confirm Check Out"**

**Expected Result:**

- ✅ Success message: "Checked out successfully! Total time: X hours"
- ✅ Session moves to completed sessions list
- ✅ Duration calculated correctly
- ✅ Timesheet updated

---

## 🔍 Test Scenario 3: Admin Creates User with QR Code

### Step 1: Login as Admin

1. Open browser to `http://localhost:3000/login`
2. Enter admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123` (if using demo account)
3. Click **"Sign In"**
4. Verify redirect to Admin Dashboard

### Step 2: Create New User

1. Click **"Create New User"** button
2. Fill in user details:
   - Full Name: `Test Parent`
   - Email: `test.parent@example.com`
   - Account Type: **Parent**
3. Click **"Create Account"**

**Expected Result:**

- ✅ Success message with generated password
- ✅ QR code displayed for user login
- ✅ QR code contains email + password
- ✅ Download/Print buttons available

### Step 3: Save User QR Code

1. Click **"Download QR Code"**
2. OR Click **"Print QR Code"**
3. Share with new user securely

### Step 4: Test Login with QR Code

1. Open new incognito/private browser window
2. Go to `http://localhost:3000/login`
3. Look for **"Login with QR Code"** option
4. Scan the downloaded user QR code

**Expected Result:**

- ✅ QR scanner opens
- ✅ Scans user QR code
- ✅ Automatically fills email and password
- ✅ Auto-login OR shows filled login form
- ✅ Redirects to appropriate dashboard

---

## 🧪 Manual QR Code Testing (Desktop)

If you don't have a smartphone camera available:

### Option 1: Use Generated Test QR Codes

1. Run test script:
   ```bash
   node scripts/comprehensive-qr-test.js
   ```
2. Open generated QR codes:
   - `test-output-qr-auth.png`
   - `test-output-qr-teacher.png`
   - `test-output-qr-general.png`
3. Display on screen
4. Use QR scanner browser extension to read

### Option 2: Use Online QR Code Reader

1. Download/save QR code image
2. Go to https://webqr.com or https://qrcodescan.in
3. Upload QR code image
4. View decoded data
5. Verify data format matches expected JSON structure

**Expected Data Format (Teacher QR):**

```json
{
  "type": "teacher_auth",
  "teacherId": "uuid-here",
  "studentId": "uuid-here",
  "parentId": "uuid-here",
  "timestamp": 1234567890,
  "signature": "abc123..."
}
```

**Expected Data Format (Login QR):**

```json
{
  "token": "qr_token_id",
  "email": "user@example.com",
  "role": "parent",
  "timestamp": "2025-11-12T...",
  "version": "1.0"
}
```

### Option 3: Use Mobile Device

1. Save QR code on computer
2. Open on phone browser OR email to phone
3. Scan with phone camera app
4. Check if data is readable

---

## 🔧 Troubleshooting Guide

### Issue: QR Code Won't Scan

#### Symptom 1: Camera doesn't detect QR code

**Possible Causes:**

- QR code is too small/large
- Poor lighting conditions
- QR code is damaged/unclear
- Camera focus issues

**Solutions:**

1. **Adjust Distance:** Move QR code closer/farther (15-30cm optimal)
2. **Improve Lighting:** Use bright, even lighting (avoid glare)
3. **Clean Camera Lens:** Wipe phone camera lens
4. **Regenerate QR Code:** Request new QR code from parent
5. **Try Different Device:** Test with another phone

#### Symptom 2: "Invalid QR code" error

**Possible Causes:**

- QR code data is corrupted
- Wrong QR code type (scanning login QR on teacher page)
- QR code expired
- Signature validation failed

**Solutions:**

1. **Verify QR Type:** Ensure using correct QR for the context
   - Teacher QR → Teacher check-in page
   - Login QR → Login page
2. **Check Expiration:** Teacher QR codes may expire (check timestamp)
3. **Regenerate QR Code:** Parent can regenerate from dashboard
4. **Clear Browser Cache:** Cached data might be stale

#### Symptom 3: "QR code not found" error

**Possible Causes:**

- QR code not in database
- Database connection issue
- Teacher not assigned to student
- QR code deactivated

**Solutions:**

1. **Check Assignment:** Verify teacher is assigned to student
2. **Check Database:** Verify QR code exists in `teacher_qr_codes` table
3. **Verify Supabase Connection:** Check `.env.local` credentials
4. **Check QR Status:** Ensure QR code is `is_active = true`

### Issue: QR Code Displays as Text

**Symptom:** QR code shows JSON text instead of scannable pattern

**Cause:** Using old fake SVG QR code generation

**Solution:**

1. Verify using `QRCode.toDataURL()` (not fake SVG)
2. Check `qr-auth.service.ts` is updated
3. Check `teacher-qr.service.ts` is updated
4. Run `node scripts/comprehensive-qr-test.js` to verify

### Issue: Camera Permission Denied

**Symptom:** "Camera blocked" or "Permission denied"

**Solutions:**

1. **Chrome:** Click lock icon in address bar → Site settings → Camera → Allow
2. **Firefox:** Click shield icon → Permissions → Camera → Allow
3. **Safari:** Safari → Preferences → Websites → Camera → Allow
4. **Mobile:** Settings → Browser App → Permissions → Camera → Enable

### Issue: QR Code Won't Generate

**Symptom:** Spinning loader or error when trying to view QR code

**Possible Causes:**

- Supabase connection issue
- Missing QR code in database
- JavaScript error in QR generation

**Solutions:**

1. **Check Browser Console:** Press F12, look for errors
2. **Check Network Tab:** Verify API calls succeeding
3. **Verify Teacher Assignment:** Ensure teacher assigned to student
4. **Check Supabase:** Verify `teacher_qr_codes` table has entry
5. **Run Test Script:** `node scripts/comprehensive-qr-test.js`

---

## 📊 Validation Checklist

Use this checklist to verify all QR code functionality:

### Parent Functionality

- [ ] Can view student list
- [ ] Can see assigned teachers
- [ ] Can view QR code for each teacher-student pair
- [ ] QR code displays as scannable image (not text)
- [ ] Can download QR code as PNG
- [ ] Can print QR code
- [ ] QR code is clear and high contrast

### Teacher Functionality

- [ ] Can access check-in/out page
- [ ] "Scan QR Code" button works
- [ ] Camera permission prompt appears
- [ ] Camera preview shows
- [ ] Can scan student QR code
- [ ] QR code detected within 5 seconds
- [ ] Check-in creates active session
- [ ] Session shows correct student name
- [ ] Timer counts correctly
- [ ] Location captured (if enabled)
- [ ] Can add session notes
- [ ] Check-out calculates duration correctly
- [ ] Timesheet updates

### Admin Functionality

- [ ] Can create new users
- [ ] Password auto-generated
- [ ] QR code generated for new user
- [ ] QR code contains login credentials
- [ ] Can download/print user QR code

### QR Code Quality

- [ ] QR code is 512x512 pixels
- [ ] Pure black/white (high contrast)
- [ ] Error correction level H
- [ ] 4-pixel margin (quiet zone)
- [ ] PNG format (not SVG)
- [ ] File size 6-8 KB
- [ ] Scannable on iOS devices
- [ ] Scannable on Android devices

---

## 🚨 Known Issues & Workarounds

### Issue 1: NEXT_PUBLIC_QR_SECRET Not Set

**Status:** ⚠️ WARNING
**Impact:** Default secret used for HMAC signatures (INSECURE)
**Workaround:** Set environment variable immediately

```bash
NEXT_PUBLIC_QR_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
```

### Issue 2: QR Code Expiration

**Status:** By Design
**Impact:** Teacher QR codes may expire for security
**Workaround:** Regenerate QR code from parent dashboard

### Issue 3: iOS Camera Scanning

**Status:** Known Issue (some devices)
**Impact:** Some iOS devices struggle with QR scanning in low light
**Workaround:**

- Use bright, even lighting
- Increase screen brightness if displaying QR digitally
- Print QR code for better scanning

---

## 📞 Support & Debugging

### Where to Check for Errors

1. **Browser Console (F12)**
   - Look for red error messages
   - Check Network tab for failed API calls
   - Verify QR generation doesn't throw errors

2. **Supabase Logs**
   - Check Supabase Dashboard → Logs
   - Look for failed queries
   - Verify RLS policies not blocking access

3. **Test Script Output**
   ```bash
   node scripts/comprehensive-qr-test.js
   ```

   - Should show 15/16 tests passed
   - Generates sample QR codes for testing

### Common Error Messages

| Error Message           | Cause                       | Solution                   |
| ----------------------- | --------------------------- | -------------------------- |
| "Invalid QR code type"  | Wrong QR on wrong page      | Use correct QR type        |
| "QR code expired"       | Timestamp validation failed | Regenerate QR code         |
| "QR code not found"     | Not in database             | Check teacher assignment   |
| "Invalid signature"     | HMAC validation failed      | Check QR secret configured |
| "Camera blocked"        | No camera permission        | Grant camera access        |
| "Failed to generate QR" | QRCode library error        | Check browser console      |

---

## 📝 Test Report Template

Use this template to document your testing:

```
QR CODE TESTING REPORT
Date: ___________
Tester: ___________
Environment: [ ] Local Dev [ ] Staging [ ] Production

PARENT TESTING:
[ ] Login successful
[ ] QR code displayed: [ ] Yes [ ] No
[ ] QR code format: [ ] PNG [ ] SVG [ ] Other: ______
[ ] Download works: [ ] Yes [ ] No
[ ] Print works: [ ] Yes [ ] No

TEACHER TESTING:
[ ] Camera access: [ ] Granted [ ] Denied
[ ] QR scan detection: [ ] < 5 sec [ ] > 5 sec [ ] Failed
[ ] Check-in successful: [ ] Yes [ ] No
[ ] Session created: [ ] Yes [ ] No
[ ] Check-out successful: [ ] Yes [ ] No

DEVICE TESTING:
Device: ___________
OS: ___________
Browser: ___________
[ ] QR scannable: [ ] Yes [ ] No
[ ] Lighting conditions: ___________

ISSUES FOUND:
1. ___________
2. ___________
3. ___________

SCREENSHOTS ATTACHED: [ ] Yes [ ] No
```

---

## 🎯 Next Steps

After validating QR functionality:

1. **If All Tests Pass:**
   - Document as working
   - Proceed with real user testing
   - Monitor production usage

2. **If Tests Fail:**
   - Document specific failure points
   - Collect error messages/screenshots
   - Share with development team
   - Review troubleshooting guide

3. **For Production Deployment:**
   - Set `NEXT_PUBLIC_QR_SECRET` in Vercel
   - Test with real iOS/Android devices
   - Verify RLS policies
   - Monitor Supabase logs

---

**Need Help?** Check the troubleshooting section or contact the development team with:

- Specific error messages
- Screenshots
- Browser console logs
- Steps to reproduce
