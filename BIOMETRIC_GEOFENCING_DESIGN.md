# Biometric Authentication + Geofencing Design

**Feature:** Secure Teacher Check-In/Out with Location Verification  
**Date:** January 22, 2026  
**Status:** Design Phase

---

## Problem Statement

**Current Issue:** Teachers can check in/out from anywhere using QR codes, which could be:
- Photographed and used remotely
- Shared with unauthorized persons
- Used from incorrect locations

**Security Requirement:** Teachers must be physically present at the student's home to check in/out.

---

## Solution Overview

Implement a **two-factor authentication system** for check-in/out:

1. **Factor 1: Biometric Authentication** (Who you are)
   - Face ID, Touch ID, or Fingerprint
   - Proves teacher identity

2. **Factor 2: Geolocation Verification** (Where you are)
   - GPS coordinates
   - Proves physical presence at student's home

**Both factors must pass** for successful check-in/out.

---

## User Flow

### Setup Phase (One-Time, Done by Parent)

```
Parent Dashboard
  ↓
Add/Edit Student Profile
  ↓
Enter Home Address
  ↓
System geocodes address → (latitude, longitude)
  ↓
Parent sets geofence radius (default: 100 meters)
  ↓
Address saved to database
```

### Teacher Registration Phase (One-Time)

```
Teacher First Login
  ↓
Prompt: "Enable biometric authentication for faster check-in?"
  ↓
Teacher accepts
  ↓
WebAuthn registration flow
  ↓
Biometric credential stored on device
  ↓
Public key stored in database
```

### Check-In Flow (Daily Use)

```
Teacher arrives at student's home
  ↓
Opens app (PWA or native)
  ↓
App detects location automatically
  ↓
Teacher taps "Check In with [Student Name]"
  ↓
┌─────────────────────────────────────┐
│ STEP 1: Location Verification      │
└─────────────────────────────────────┘
  ↓
Request GPS coordinates
  ↓
Calculate distance from student's home
  ↓
Is distance < geofence radius?
  ├─ NO → Show error: "You must be at student's home"
  │        Show map with current location vs home
  │        Offer "Request Exception" button
  └─ YES → Proceed to Step 2
  ↓
┌─────────────────────────────────────┐
│ STEP 2: Biometric Authentication   │
└─────────────────────────────────────┘
  ↓
Prompt biometric (Face ID/Touch ID/Fingerprint)
  ↓
Is biometric valid?
  ├─ NO → Show error: "Authentication failed"
  │        Offer fallback: QR code scan
  └─ YES → Proceed to Step 3
  ↓
┌─────────────────────────────────────┐
│ STEP 3: Create Session              │
└─────────────────────────────────────┘
  ↓
Send to API:
  - Teacher ID
  - Student ID
  - GPS coordinates
  - Biometric signature
  - Timestamp
  ↓
Server validates:
  ✓ Biometric signature matches
  ✓ Location within geofence
  ✓ No active session exists
  ✓ Teacher assigned to student
  ↓
Create session record
  ↓
Show success: "Checked in at [time]"
  ↓
Start session timer
```

### Check-Out Flow (Daily Use)

```
Teacher ready to leave
  ↓
Taps "Check Out"
  ↓
Same verification as check-in:
  1. Location verification
  2. Biometric authentication
  ↓
Server validates and closes session
  ↓
Calculate session duration
  ↓
Show summary:
  - Duration: 2h 30m
  - Location verified: ✓
  - Add notes (optional)
  ↓
Session complete
```

---

## Technical Architecture

### Database Schema Changes

```sql
-- Add location fields to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10, 8);
ALTER TABLE students ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(11, 8);
ALTER TABLE students ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER DEFAULT 100;

-- Add biometric credentials table
CREATE TABLE IF NOT EXISTS teacher_biometric_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(teacher_id, credential_id)
);

-- Add location tracking to teacher_sessions
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS check_in_latitude DECIMAL(10, 8);
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS check_in_longitude DECIMAL(11, 8);
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS check_in_accuracy_meters DECIMAL(8, 2);
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS check_out_latitude DECIMAL(10, 8);
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS check_out_longitude DECIMAL(11, 8);
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS check_out_accuracy_meters DECIMAL(8, 2);
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE teacher_sessions ADD COLUMN IF NOT EXISTS biometric_verified BOOLEAN DEFAULT FALSE;

-- Add geofence exceptions table (for special cases)
CREATE TABLE IF NOT EXISTS geofence_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  student_id UUID NOT NULL REFERENCES students(id),
  parent_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

#### 1. Register Biometric Credential
```typescript
POST /api/biometric/register
Body: {
  teacherId: string,
  credentialId: string,
  publicKey: string,
  deviceName: string
}
Response: {
  success: boolean,
  credentialId: string
}
```

#### 2. Verify Location
```typescript
POST /api/location/verify
Body: {
  studentId: string,
  latitude: number,
  longitude: number,
  accuracy: number
}
Response: {
  withinGeofence: boolean,
  distance: number,
  allowedRadius: number,
  studentAddress: string
}
```

#### 3. Check-In with Biometric + Location
```typescript
POST /api/teacher-sessions/check-in-biometric
Body: {
  teacherId: string,
  studentId: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  biometricSignature: string,
  credentialId: string
}
Response: {
  success: boolean,
  sessionId: string,
  checkedInAt: string,
  locationVerified: boolean,
  biometricVerified: boolean
}
```

#### 4. Check-Out with Biometric + Location
```typescript
POST /api/teacher-sessions/check-out-biometric
Body: {
  sessionId: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  biometricSignature: string,
  credentialId: string,
  notes?: string
}
Response: {
  success: boolean,
  sessionId: string,
  duration: number,
  locationVerified: boolean,
  biometricVerified: boolean
}
```

---

## Geofencing Logic

### Distance Calculation (Haversine Formula)

```typescript
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
```

### Geofence Validation

```typescript
function isWithinGeofence(
  teacherLat: number,
  teacherLon: number,
  studentHomeLat: number,
  studentHomeLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(
    teacherLat,
    teacherLon,
    studentHomeLat,
    studentHomeLon
  );
  return distance <= radiusMeters;
}
```

### Accuracy Handling

```typescript
function validateLocationAccuracy(accuracy: number): boolean {
  // GPS accuracy must be better than 50 meters
  const MAX_ACCEPTABLE_ACCURACY = 50;
  return accuracy <= MAX_ACCEPTABLE_ACCURACY;
}
```

---

## Biometric Authentication (WebAuthn)

### Registration Flow

```typescript
// Client-side: Register biometric credential
async function registerBiometric(teacherId: string) {
  // Check if WebAuthn is supported
  if (!window.PublicKeyCredential) {
    throw new Error('Biometric authentication not supported on this device');
  }

  // Request credential creation
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: new Uint8Array(32), // From server
      rp: {
        name: 'GuruKool HomeSchool',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(teacherId),
        name: teacherId,
        displayName: 'Teacher',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use device biometrics
        userVerification: 'required',
      },
      timeout: 60000,
    },
  });

  // Send public key to server
  const response = await fetch('/api/biometric/register', {
    method: 'POST',
    body: JSON.stringify({
      teacherId,
      credentialId: credential.id,
      publicKey: arrayBufferToBase64(credential.response.publicKey),
      deviceName: navigator.userAgent,
    }),
  });

  return response.json();
}
```

### Authentication Flow

```typescript
// Client-side: Authenticate with biometric
async function authenticateWithBiometric(teacherId: string) {
  // Get challenge from server
  const challengeResponse = await fetch('/api/biometric/challenge', {
    method: 'POST',
    body: JSON.stringify({ teacherId }),
  });
  const { challenge, credentialIds } = await challengeResponse.json();

  // Request authentication
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: base64ToArrayBuffer(challenge),
      allowCredentials: credentialIds.map((id: string) => ({
        type: 'public-key',
        id: base64ToArrayBuffer(id),
      })),
      userVerification: 'required',
      timeout: 60000,
    },
  });

  // Send assertion to server for verification
  const response = await fetch('/api/biometric/verify', {
    method: 'POST',
    body: JSON.stringify({
      teacherId,
      credentialId: assertion.id,
      signature: arrayBufferToBase64(assertion.response.signature),
      authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
      clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
    }),
  });

  return response.json();
}
```

---

## Fallback Mechanisms

### 1. Biometric Unavailable
- **Scenario:** Device doesn't support biometrics
- **Fallback:** QR code scan (existing system)
- **Security:** Still requires location verification

### 2. Location Services Disabled
- **Scenario:** Teacher disabled GPS
- **Action:** Show error: "Location services required"
- **Fallback:** Request exception from parent

### 3. Outside Geofence
- **Scenario:** Teacher is not at student's home
- **Action:** Show distance and map
- **Fallback:** "Request Exception" button
  - Teacher enters reason
  - Parent receives notification
  - Parent can approve/deny
  - If approved, exception valid for that session only

### 4. Poor GPS Accuracy
- **Scenario:** GPS accuracy > 50 meters
- **Action:** Show warning: "GPS signal weak, please move to open area"
- **Retry:** Allow multiple attempts
- **Fallback:** Manual verification by parent

### 5. Network Offline
- **Scenario:** No internet connection
- **Action:** Queue check-in locally
- **Sync:** Auto-sync when connection restored
- **Validation:** Server validates location/biometric retroactively

---

## Security Considerations

### 1. Spoofing Prevention

**GPS Spoofing:**
- Validate GPS accuracy (must be < 50m)
- Check for impossible movement (e.g., 100km in 5 minutes)
- Cross-reference with device sensors (accelerometer, gyroscope)
- Flag suspicious patterns for review

**Biometric Spoofing:**
- Use platform-level biometrics (Face ID, Touch ID)
- These are hardware-secured and anti-spoofing
- Store only public keys, never biometric data
- Require user presence verification

### 2. Privacy Protection

**Teacher Privacy:**
- Location tracked only during check-in/out (not continuously)
- Location data encrypted in transit and at rest
- Teacher can see their own location history
- Clear consent during onboarding

**Student Privacy:**
- Home address encrypted
- Only visible to assigned teachers
- Parents can update geofence radius
- Option to use nearby landmark instead of exact address

### 3. Data Retention

- Location data retained for 90 days (compliance)
- Biometric credentials stored indefinitely (until revoked)
- Session records retained per parent preference
- Audit logs for all location verifications

---

## UI/UX Design

### Check-In Screen

```
┌─────────────────────────────────────┐
│  GuruKool HomeSchool                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  📍 Location Verified          │ │
│  │  ✓ You are at Emma's home      │ │
│  │  Distance: 15m                 │ │
│  └───────────────────────────────┘ │
│                                     │
│  Student: Emma Johnson              │
│  Time: 9:00 AM                      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                                │ │
│  │   👆 Tap to Check In           │ │
│  │                                │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Use QR Code Instead]              │
│                                     │
└─────────────────────────────────────┘
```

### Location Error Screen

```
┌─────────────────────────────────────┐
│  GuruKool HomeSchool                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ⚠️ Location Verification      │ │
│  │  Failed                        │ │
│  └───────────────────────────────┘ │
│                                     │
│  You are 450m away from            │
│  Emma's home.                       │
│                                     │
│  ┌─────────────────┐               │
│  │                 │               │
│  │   [Map View]    │               │
│  │   • You         │               │
│  │   🏠 Home       │               │
│  │                 │               │
│  └─────────────────┘               │
│                                     │
│  [Request Exception]                │
│  [Try Again]                        │
│                                     │
└─────────────────────────────────────┘
```

### Biometric Prompt

```
┌─────────────────────────────────────┐
│                                     │
│         👤                          │
│                                     │
│  Verify Your Identity               │
│                                     │
│  Use Face ID to check in            │
│  with Emma Johnson                  │
│                                     │
│  [Cancel]                           │
│                                     │
└─────────────────────────────────────┘
```

---

## Parent Controls

### Geofence Configuration

```
┌─────────────────────────────────────┐
│  Student Settings - Emma Johnson    │
│                                     │
│  Home Address:                      │
│  123 Main St, Springfield, IL       │
│  [Edit Address]                     │
│                                     │
│  Geofence Radius:                   │
│  ○ 50 meters (strict)               │
│  ● 100 meters (recommended)         │
│  ○ 200 meters (flexible)            │
│  ○ Custom: [___] meters             │
│                                     │
│  ℹ️ Teachers must be within this    │
│     radius to check in/out          │
│                                     │
│  Location Verification:             │
│  ☑ Required for check-in            │
│  ☑ Required for check-out           │
│  ☐ Allow exceptions                 │
│                                     │
│  [Save Settings]                    │
│                                     │
└─────────────────────────────────────┘
```

### Exception Requests

```
┌─────────────────────────────────────┐
│  Exception Request                  │
│                                     │
│  From: Sarah Teacher                │
│  Student: Emma Johnson               │
│  Date: Jan 22, 2026 9:00 AM         │
│                                     │
│  Reason:                            │
│  "Session at public library for     │
│   research project"                 │
│                                     │
│  Location:                          │
│  Springfield Public Library         │
│  (2.3 km from home)                 │
│                                     │
│  [View Map]                         │
│                                     │
│  [Approve]  [Deny]                  │
│                                     │
└─────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Location Verification (Week 1)
- Add location fields to database
- Implement geofencing logic
- Create location verification API
- Update check-in/out to require location
- Add parent geofence configuration

### Phase 2: Biometric Authentication (Week 2)
- Implement WebAuthn registration
- Create biometric credentials table
- Add biometric verification to check-in/out
- Create fallback to QR code
- Test on iOS and Android

### Phase 3: Exception Handling (Week 3)
- Create exception request system
- Add parent approval workflow
- Implement push notifications
- Add exception history tracking

### Phase 4: UI/UX Polish (Week 4)
- Design and implement new check-in screens
- Add map visualization
- Create parent control panel
- Add location history view
- Comprehensive testing

---

## Testing Checklist

### Location Verification
- [ ] Check-in succeeds when within geofence
- [ ] Check-in fails when outside geofence
- [ ] Distance calculation is accurate
- [ ] GPS accuracy validation works
- [ ] Poor GPS signal handled gracefully

### Biometric Authentication
- [ ] Registration works on iOS (Face ID)
- [ ] Registration works on Android (Fingerprint)
- [ ] Authentication succeeds with valid biometric
- [ ] Authentication fails with invalid biometric
- [ ] Fallback to QR code works

### Exception Handling
- [ ] Teacher can request exception
- [ ] Parent receives notification
- [ ] Parent can approve/deny
- [ ] Approved exception allows check-in
- [ ] Exception expires after session

### Edge Cases
- [ ] Network offline during check-in
- [ ] GPS disabled
- [ ] Biometric not enrolled
- [ ] Multiple active sessions
- [ ] Teacher at wrong student's home

---

## Success Metrics

**Security:**
- 99% of check-ins verified by location
- 95% of check-ins verified by biometric
- 0 fraudulent check-ins

**User Experience:**
- Check-in time < 5 seconds
- 90% teacher adoption of biometric
- < 5% exception requests

**Reliability:**
- 99.9% location verification success rate
- < 1% false negatives (valid check-ins rejected)

---

## Next Steps

1. Review and approve this design
2. Create database migration
3. Implement location verification API
4. Implement biometric authentication
5. Update mobile UI
6. Test on real devices
7. Deploy to production

---

**Status:** ✅ Design Complete - Ready for Implementation
