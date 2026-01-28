# Face Recognition Check-In/Check-Out - Implementation Tasks (v2.0)

## Document Information

| Field            | Value                                               |
| ---------------- | --------------------------------------------------- |
| **Version**      | 2.0                                                 |
| **Status**       | Approved                                            |
| **Security Rev** | Server-Side Verification (Critical Security Update) |
| **Related Docs** | PRD v2.0, Design v2.0                               |

---

## Critical Security Update Summary

> **IMPORTANT**: This task list has been updated following a security review. Key changes:
>
> 1. **Server-Side Verification**: All face matching calculations MUST happen on the server
> 2. **Encryption**: Face descriptors are encrypted with AES-256-GCM at rest
> 3. **No Client Trust**: Server NEVER trusts client-provided confidence scores
> 4. **Model Caching**: Service Worker + IndexedDB for performance optimization

---

## Task Overview

| Phase                            | Tasks   | Priority | Focus Area         |
| -------------------------------- | ------- | -------- | ------------------ |
| 1. Setup & Infrastructure        | 7 tasks | P0       | Foundation         |
| 2. Security & Encryption         | 4 tasks | P0       | **NEW - Critical** |
| 3. Backend Implementation        | 5 tasks | P0       | Core API           |
| 4. Frontend - Shared Components  | 4 tasks | P0       | Core UI            |
| 5. Frontend - Parent Flow        | 4 tasks | P0       | Enrollment         |
| 6. Frontend - Teacher Flow       | 5 tasks | P0       | Verification       |
| 7. Integration & Polish          | 5 tasks | P1       | UX                 |
| 8. Testing & Security Validation | 6 tasks | P0       | **Security Focus** |
| 9. Documentation & Deployment    | 4 tasks | P2       | Launch             |

---

## Phase 1: Setup & Infrastructure

### Task 1.1: Install face-api.js and Dependencies

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Add face-api.js library and configure for Next.js

**Files to modify:**

- `package.json`

**Commands:**

```bash
npm install face-api.js @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl idb
```

**Dependencies Added:**

- `face-api.js` - Face detection and embedding extraction
- `@tensorflow/tfjs-core` - TensorFlow.js core
- `@tensorflow/tfjs-backend-webgl` - GPU acceleration
- `idb` - IndexedDB wrapper for model caching

**Acceptance Criteria:**

- [ ] All packages installed successfully
- [ ] No TypeScript errors
- [ ] Build passes (`npm run build`)
- [ ] No peer dependency warnings

---

### Task 1.2: Download and Host Face Detection Models

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Download face-api.js models and host in public directory

**Files to create:**

```
public/models/face-api/
├── ssd_mobilenetv1_model-weights_manifest.json
├── ssd_mobilenetv1_model-shard1
├── ssd_mobilenetv1_model-shard2
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1
└── face_recognition_model-shard2
```

**Download from:**
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

**Acceptance Criteria:**

- [ ] All model files present in `public/models/face-api/`
- [ ] Models load successfully in browser
- [ ] Total size ~13MB verified
- [ ] Models accessible at `/models/face-api/*`

---

### Task 1.3: Create Service Worker for Model Caching

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Implement Service Worker to cache face-api models for faster loading

**Files to create:**

- `public/sw.js`
- `src/lib/service-worker-registration.ts`

**Implementation:**

```typescript
// public/sw.js
const MODEL_CACHE = 'face-api-models-v1';
const MODEL_FILES = [
  '/models/face-api/ssd_mobilenetv1_model-weights_manifest.json',
  '/models/face-api/ssd_mobilenetv1_model-shard1',
  '/models/face-api/ssd_mobilenetv1_model-shard2',
  '/models/face-api/face_landmark_68_model-weights_manifest.json',
  '/models/face-api/face_landmark_68_model-shard1',
  '/models/face-api/face_recognition_model-weights_manifest.json',
  '/models/face-api/face_recognition_model-shard1',
  '/models/face-api/face_recognition_model-shard2',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(MODEL_CACHE).then(cache => cache.addAll(MODEL_FILES))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/models/face-api/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
```

**Acceptance Criteria:**

- [ ] Service Worker registered on app load
- [ ] Models cached after first download
- [ ] Subsequent loads use cached models (< 3s load time)
- [ ] Cache invalidation works on version change

---

### Task 1.4: Create IndexedDB Model Storage Fallback

**Status:** [ ] Not Started
**Priority:** P1

**Description:** IndexedDB fallback for browsers with limited Service Worker support

**Files to create:**

- `src/lib/model-storage.ts`

**Acceptance Criteria:**

- [ ] Models can be stored in IndexedDB
- [ ] Models can be retrieved from IndexedDB
- [ ] Works on Safari iOS (where SW support varies)

---

### Task 1.5: Create Database Migration

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Create migration for `student_face_records` table with encryption support

**Files to create:**

- `supabase/migrations/017_student_face_records.sql`

**Key Changes from v1.0:**

- `face_descriptor` → `face_descriptor_encrypted` (BYTEA)
- Added `face_verification_audit` table
- Added service role policy for server-side verification

**SQL Schema:** (See DESIGN.md Section 3.1)

**Acceptance Criteria:**

- [ ] Migration file created
- [ ] Applied successfully in Supabase Dashboard
- [ ] RLS policies working (test with parent/teacher users)
- [ ] Service role can access for verification
- [ ] Audit table created with proper policies

---

### Task 1.6: Create Face Recognition Types

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Add TypeScript types for face recognition (v2.0 with server verification)

**Files to modify:**

- `src/types/index.ts`

**Types to add:**

```typescript
// Face Recognition Types (v2.0 - Server-Side Verification)

export interface StudentFaceRecord {
  id: string;
  student_id: string;
  face_descriptor_encrypted: Buffer; // Encrypted data
  descriptor_version: string;
  quality_score: number;
  enrollment_metadata: {
    device?: string;
    lighting?: 'poor' | 'fair' | 'good' | 'excellent';
    angle?: 'frontal' | 'slight_left' | 'slight_right';
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaceDetectionResult {
  descriptor: number[]; // 128 floats - sent to server for verification
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  qualityScore: number;
  landmarks: any;
  // NO matchedStudent - matching done server-side
}

export interface FaceVerifyRequest {
  studentId: string;
  capturedDescriptor: number[];
}

export interface FaceVerifyResponse {
  success: boolean;
  matched: boolean;
  confidence: number; // Server-calculated
  distance: number;
  student?: {
    id: string;
    name: string;
    grade: string;
  };
  message: string;
}

export interface FaceScannerError {
  code:
    | 'CAMERA_DENIED'
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'MODEL_LOAD_FAILED'
    | 'LOW_QUALITY'
    | 'SERVER_VERIFY_FAILED';
  message: string;
}

export type VerificationMethod =
  | 'qr_code'
  | 'face_recognition'
  | 'biometric'
  | 'manual';
```

**Acceptance Criteria:**

- [ ] Types added to index.ts
- [ ] Exported correctly
- [ ] No TypeScript errors
- [ ] Server verification types included

---

### Task 1.7: Add Environment Variables

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Add required environment variables for face recognition

**Files to modify:**

- `.env.local`
- `.env.example`

**Variables to add:**

```bash
# Face Recognition
FACE_ENCRYPTION_KEY=<run: openssl rand -hex 32>
FACE_MATCH_THRESHOLD=0.4
FACE_VERIFY_RATE_LIMIT=10
NEXT_PUBLIC_ENABLE_FACE_RECOGNITION=true
```

**Acceptance Criteria:**

- [ ] Variables added to .env.example
- [ ] Local .env has valid encryption key
- [ ] Feature flag controls UI visibility

---

## Phase 2: Security & Encryption (NEW - Critical)

### Task 2.1: Create Face Encryption Service

**Status:** [ ] Not Started
**Priority:** P0 - **CRITICAL SECURITY**

**Description:** Implement AES-256-GCM encryption for face descriptors

**Files to create:**

- `src/lib/face-encryption.ts`

**Implementation:**

```typescript
// src/lib/face-encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.FACE_ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export async function encryptFaceDescriptor(
  descriptor: number[]
): Promise<Buffer> {
  const descriptorBuffer = Buffer.from(new Float32Array(descriptor).buffer);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(descriptorBuffer),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, authTag]);
}

export async function decryptFaceDescriptor(
  encryptedData: Buffer
): Promise<number[]> {
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(-AUTH_TAG_LENGTH);
  const ciphertext = encryptedData.subarray(IV_LENGTH, -AUTH_TAG_LENGTH);

  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  const float32Array = new Float32Array(decrypted.buffer);
  return Array.from(float32Array);
}
```

**Acceptance Criteria:**

- [ ] Encrypt function works with 128-float arrays
- [ ] Decrypt function recovers original values
- [ ] Different IVs produce different ciphertext
- [ ] Auth tag validation prevents tampering
- [ ] Unit tests pass

---

### Task 2.2: Create Face Matching Service (Server-Side Only)

**Status:** [ ] Not Started
**Priority:** P0 - **CRITICAL SECURITY**

**Description:** Implement server-side face matching utilities

**Files to create:**

- `src/lib/face-matching.ts`

**Implementation:**

```typescript
// src/lib/face-matching.ts

export function calculateEuclideanDistance(
  descriptor1: number[],
  descriptor2: number[]
): number {
  if (descriptor1.length !== 128 || descriptor2.length !== 128) {
    throw new Error('Descriptors must be 128-dimensional');
  }

  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export function distanceToConfidence(distance: number): number {
  return Math.max(0, Math.min(1, 1 - distance));
}

export const FACE_MATCH_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.3,
  MEDIUM_CONFIDENCE: 0.4,
  LOW_CONFIDENCE: 0.5,
};
```

**Acceptance Criteria:**

- [ ] Distance calculation is mathematically correct
- [ ] Identical descriptors return 0 distance
- [ ] Different descriptors return > 0.4 distance
- [ ] Confidence conversion works correctly
- [ ] Unit tests pass

---

### Task 2.3: Create Rate Limiting for Face Verification

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Implement rate limiting for face verification API

**Files to modify:**

- `src/lib/api-security.ts`

**Implementation:**

```typescript
// Add to existing rate limiting
export const FACE_VERIFY_RATE_LIMIT = {
  keyPrefix: 'face:verify',
  max: parseInt(process.env.FACE_VERIFY_RATE_LIMIT || '10'),
  windowMs: 60 * 1000, // 1 minute
};
```

**Acceptance Criteria:**

- [ ] Rate limit enforced on verify-face endpoint
- [ ] Returns 429 after 10 attempts/minute
- [ ] Teacher-specific rate limiting (per teacher ID)
- [ ] Audit log includes rate-limited attempts

---

### Task 2.4: Create Audit Logging Service

**Status:** [ ] Not Started
**Priority:** P1

**Description:** Implement audit logging for face verification attempts

**Files to create:**

- `src/services/face-audit.service.ts`

**Implementation:**

```typescript
// src/services/face-audit.service.ts
import { getSupabaseAdmin } from '@/lib/supabase';

interface AuditEntry {
  teacherId: string;
  studentId: string;
  result: 'success' | 'failed' | 'no_match';
  confidence: number;
  distance: number;
  deviceInfo: object;
  ipAddress: string;
}

export async function logFaceVerificationAttempt(
  entry: AuditEntry
): Promise<void> {
  const adminClient = getSupabaseAdmin();
  await adminClient.from('face_verification_audit').insert({
    teacher_id: entry.teacherId,
    student_id: entry.studentId,
    verification_result: entry.result,
    confidence_score: entry.confidence,
    distance: entry.distance,
    device_info: entry.deviceInfo,
    ip_address: entry.ipAddress,
  });
}
```

**Acceptance Criteria:**

- [ ] All verification attempts logged
- [ ] Includes device info and IP
- [ ] No sensitive data (descriptors) logged
- [ ] Admin can query audit logs

---

## Phase 3: Backend Implementation

### Task 3.1: Create Face Enrollment API

**Status:** [ ] Not Started
**Priority:** P0

**Description:** API endpoint for saving encrypted face embeddings

**Files to create:**

- `src/app/api/student/face-enroll/route.ts`

**Endpoint:** `POST /api/student/face-enroll`

**Key Changes from v1.0:**

- Encrypt descriptor before storage
- Validate parent ownership
- Deactivate old records before insert

**Acceptance Criteria:**

- [ ] Validates 128-float descriptor
- [ ] Encrypts before storage
- [ ] Checks parent ownership
- [ ] Deactivates existing records
- [ ] Returns record ID on success
- [ ] Rate limited (20 req/min)

---

### Task 3.2: Create Face Verification API (CRITICAL - Server-Side)

**Status:** [ ] Not Started
**Priority:** P0 - **CRITICAL SECURITY**

**Description:** Server-side face verification endpoint

**Files to create:**

- `src/app/api/teacher-sessions/verify-face/route.ts`

**Endpoint:** `POST /api/teacher-sessions/verify-face`

> **SECURITY CRITICAL**: This endpoint performs ALL matching logic server-side.
> The client sends `capturedDescriptor`, NOT `confidence`.

**Request Schema:**

```typescript
const verifyFaceSchema = z.object({
  studentId: z.string().uuid(),
  capturedDescriptor: z.array(z.number()).length(128),
  // NO confidence field - server calculates this
});
```

**Implementation Flow:**

1. Authenticate teacher
2. Validate teacher is assigned to student
3. Fetch encrypted descriptor using admin client
4. Decrypt descriptor (server-side only)
5. Calculate Euclidean distance (server-side only)
6. Log audit entry
7. Return match result with server-calculated confidence

**Acceptance Criteria:**

- [ ] Authenticates teacher
- [ ] Validates student assignment
- [ ] Fetches and decrypts descriptor
- [ ] Calculates distance server-side
- [ ] Logs verification attempt
- [ ] Returns match result
- [ ] IGNORES any client-provided confidence
- [ ] Rate limited (10 req/min per teacher)

---

### Task 3.3: Create Face Check-In API (After Verification)

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Create session after successful face verification

**Files to create:**

- `src/app/api/teacher-sessions/check-in-face/route.ts`

**Endpoint:** `POST /api/teacher-sessions/check-in-face`

> **NOTE**: Should only be called after successful verify-face response

**Acceptance Criteria:**

- [ ] Creates session on check-in
- [ ] Updates session on check-out
- [ ] Records `verification_method: 'face_recognition'`
- [ ] Records server-calculated confidence
- [ ] Triggers real-time notification to parent

---

### Task 3.4: Create Get Assigned Students API (No Descriptors)

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Get assigned students with enrollment status (NO descriptors returned)

**Files to create:**

- `src/app/api/teacher/assigned-students/route.ts`

**Endpoint:** `GET /api/teacher/assigned-students`

> **SECURITY NOTE**: This endpoint does NOT return face descriptors.
> Descriptors are only accessed server-side during verification.

**Response:**

```typescript
{
  students: [
    {
      id: string;
      name: string;
      grade: string;
      hasFaceEnrolled: boolean; // true/false only
      hasActiveSession: boolean;
    }
  ]
}
```

**Acceptance Criteria:**

- [ ] Returns assigned students
- [ ] Indicates face enrollment status (boolean only)
- [ ] Does NOT return descriptors
- [ ] Indicates active session status

---

### Task 3.5: Create Face Delete API

**Status:** [ ] Not Started
**Priority:** P1

**Description:** API for parents to delete face data

**Files to modify:**

- `src/app/api/student/face-enroll/route.ts` (add DELETE handler)

**Endpoint:** `DELETE /api/student/face-enroll?studentId={id}`

**Acceptance Criteria:**

- [ ] Verifies parent ownership
- [ ] Soft deletes face record (is_active = false)
- [ ] Returns confirmation
- [ ] Logs deletion for audit

---

## Phase 4: Frontend - Shared Components

### Task 4.1: Create Face Recognition Service (Client)

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Client-side service for model loading and face detection

**Files to create:**

- `src/services/face-recognition.service.ts`

**Key Methods:**

```typescript
export class FaceRecognitionService {
  private static modelsLoaded = false;

  // Load face-api.js models (with caching)
  static async loadModels(onProgress?: (p: number) => void): Promise<void>;

  // Check if models are loaded
  static isReady(): boolean;

  // Detect face and extract descriptor (client-side)
  static async detectFace(
    videoElement: HTMLVideoElement
  ): Promise<FaceDetectionResult | null>;

  // Calculate quality score
  static calculateQualityScore(detection: faceapi.FaceDetection): number;

  // Preload models in background
  static preloadModelsInBackground(): void;
}
```

**Acceptance Criteria:**

- [ ] Models load with progress callback
- [ ] Uses Service Worker cache when available
- [ ] Face detection works
- [ ] Quality score calculation works
- [ ] Background preload available

---

### Task 4.2: Create FaceScanner Component (Detection Only)

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Camera component with face detection (no matching - server-side only)

**Files to create:**

- `src/components/shared/FaceScanner.tsx`

**Props:**

```typescript
interface FaceScannerProps {
  mode: 'enroll' | 'verify';
  onFaceDetected: (result: FaceDetectionResult) => void;
  onError: (error: FaceScannerError) => void;
  minQualityScore?: number; // Default: 0.7
  showDebug?: boolean;
}
```

**Key Features:**

- [ ] Camera permission handling
- [ ] Model loading with progress
- [ ] Real-time face detection box
- [ ] Quality indicators
- [ ] Status messages
- [ ] Frame skip optimization (every 3rd frame)
- [ ] **NO local matching** - sends descriptor to parent component

**Acceptance Criteria:**

- [ ] Camera opens with permission
- [ ] Face detection box visible
- [ ] Quality score displayed
- [ ] Callback fires with descriptor
- [ ] Works on mobile browsers

---

### Task 4.3: Create Model Loading Hook

**Status:** [ ] Not Started
**Priority:** P0

**Description:** React hook for loading face-api.js models with progress

**Files to create:**

- `src/hooks/useFaceRecognition.ts`

**Interface:**

```typescript
function useFaceRecognition() {
  return {
    isLoading: boolean;
    isReady: boolean;
    error: string | null;
    loadProgress: number; // 0-100
    loadModels: () => Promise<void>;
  };
}
```

**Acceptance Criteria:**

- [ ] Lazy model loading
- [ ] Progress tracking (0-100%)
- [ ] Error handling
- [ ] Singleton pattern (no reload if loaded)

---

### Task 4.4: Create Face Quality Indicator Component

**Status:** [ ] Not Started
**Priority:** P1

**Description:** Visual indicator for face capture quality

**Files to create:**

- `src/components/shared/FaceQualityIndicator.tsx`

**UI:**

```
Quality: [========= ] 85%
- Lighting: Good
- Position: Centered
- Distance: OK
```

**Acceptance Criteria:**

- [ ] Progress bar display
- [ ] Individual quality metrics
- [ ] Color coding (red/yellow/green)
- [ ] Accessible labels

---

## Phase 5: Frontend - Parent Flow (Enrollment)

### Task 5.1: Create FaceEnrollment Component

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Wizard component for face enrollment

**Files to create:**

- `src/components/parent/FaceEnrollment.tsx`

**Steps:**

1. Consent & Prepare
2. Camera Capture
3. Preview & Confirm

**Acceptance Criteria:**

- [ ] Three-step wizard works
- [ ] Consent dialog shown first
- [ ] Skip option available
- [ ] Quality check before save
- [ ] API call on confirm
- [ ] Error handling with retry

---

### Task 5.2: Create Face Consent Dialog

**Status:** [ ] Not Started
**Priority:** P0

**Description:** GDPR-compliant consent dialog before enrollment

**Files to create:**

- `src/components/parent/FaceConsentDialog.tsx`

**Content:**

- Data usage explanation
- Encryption statement
- Deletion rights
- Skip option

**Acceptance Criteria:**

- [ ] Clear consent text
- [ ] Agree/Skip buttons
- [ ] Skip bypasses enrollment

---

### Task 5.3: Integrate Enrollment into Student Profile

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Add FaceEnrollment as optional step in student creation

**Files to modify:**

- `src/app/parent/students/new/page.tsx`
- Related profile components

**Acceptance Criteria:**

- [ ] Face enrollment step in wizard
- [ ] Optional (can skip)
- [ ] Profile shows enrollment status

---

### Task 5.4: Create Face Data Management UI

**Status:** [ ] Not Started
**Priority:** P1

**Description:** Allow parents to update/delete face data

**Files to modify:**

- `src/app/parent/students/[id]/page.tsx`

**Features:**

- [ ] Show enrollment status
- [ ] "Update Face" button
- [ ] "Remove Face Data" button
- [ ] Confirmation dialog

---

## Phase 6: Frontend - Teacher Flow (Server Verification)

### Task 6.1: Create FaceCheckIn Component (Server Verification)

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Face verification component with server-side matching

**Files to create:**

- `src/components/teacher/FaceCheckIn.tsx`

**Flow:**

1. Load assigned students (with `hasFaceEnrolled` status)
2. Start camera and detect face
3. Teacher selects student from list
4. Send captured descriptor to server for verification
5. Display server response (match/no match)
6. Check-in/out on confirmation

**Key Differences from v1.0:**

- NO local matching
- Always shows student selection first
- Server verifies face match
- Displays "Server Verified" badge

**Acceptance Criteria:**

- [ ] Loads students without descriptors
- [ ] Camera detects face
- [ ] Sends descriptor to verify-face API
- [ ] Displays server-calculated confidence
- [ ] Check-in creates session
- [ ] QR fallback available

---

### Task 6.2: Create Face Match Result Card

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Display server verification result

**Files to create:**

- `src/components/teacher/FaceMatchCard.tsx`

**Props:**

```typescript
interface FaceMatchCardProps {
  student: { id: string; name: string; grade: string };
  confidence: number; // Server-calculated
  matched: boolean;
  hasActiveSession: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onTryAgain: () => void;
}
```

**Acceptance Criteria:**

- [ ] Shows student info
- [ ] Shows "Server Verified" badge
- [ ] Confidence percentage with color
- [ ] Check-in/out buttons
- [ ] Disabled states based on session

---

### Task 6.3: Create Manual Student Select Fallback

**Status:** [ ] Not Started
**Priority:** P1

**Description:** Manual selection when face verification fails

**Files to create:**

- `src/components/teacher/ManualStudentSelect.tsx`

**Acceptance Criteria:**

- [ ] Grid of assigned students
- [ ] Shows face enrollment status
- [ ] Selection proceeds to check-in
- [ ] Records `verification_method: 'manual'`

---

### Task 6.4: Integrate Face Check-In into Teacher Dashboard

**Status:** [ ] Not Started
**Priority:** P0

**Description:** Add Face Scan tab to check-in interface

**Files to modify:**

- `src/components/teacher/QRCheckInOut.tsx` or
- Create: `src/components/teacher/UnifiedCheckIn.tsx`

**UI:**

```
[QR Scan] | [Face Scan]
```

**Acceptance Criteria:**

- [ ] Toggle between QR and Face
- [ ] Both methods work
- [ ] Preference saved in localStorage
- [ ] Preload models when tab visible

---

### Task 6.5: Add Session Notes Input

**Status:** [ ] Not Started
**Priority:** P2

**Description:** Optional notes after face check-in

**Acceptance Criteria:**

- [ ] Notes input after action
- [ ] Can skip or add
- [ ] Saved with session

---

## Phase 7: Integration & Polish

### Task 7.1: Implement Model Preloading

**Status:** [ ] Not Started
**Priority:** P1

**Description:** Preload face-api models when teacher dashboard loads

**Files to modify:**

- `src/app/teacher/dashboard/page.tsx`

**Implementation:**

```typescript
useEffect(() => {
  // Preload models in background on dashboard load
  FaceRecognitionService.preloadModelsInBackground();
}, []);
```

**Acceptance Criteria:**

- [ ] Models preload on dashboard visit
- [ ] No blocking of UI
- [ ] Face Scan tab loads instantly

---

### Task 7.2: Add Loading States and Animations

**Status:** [ ] Not Started
**Priority:** P1

**Description:** Smooth loading states throughout flow

**Animations:**

- [ ] Model loading progress bar
- [ ] Face detection pulse animation
- [ ] Server verification spinner
- [ ] Match success animation
- [ ] Error shake animation

---

### Task 7.3: Optimize Camera Performance

**Status:** [ ] Not Started
**Priority:** P1

**Description:** Ensure smooth camera on mobile

**Optimizations:**

- [ ] Process every 3rd frame
- [ ] Lower detection resolution (320x240)
- [ ] Debounce detection callbacks
- [ ] Clean up on unmount
- [ ] Handle orientation changes

---

### Task 7.4: Add Offline Indicator

**Status:** [ ] Not Started
**Priority:** P2

**Description:** Show offline status (face detection works, server verification fails)

**Acceptance Criteria:**

- [ ] Detects offline status
- [ ] Shows "Offline - Server verification unavailable"
- [ ] Offers QR fallback

---

### Task 7.5: Apply GuruKool Theme

**Status:** [ ] Not Started
**Priority:** P2

**Description:** Apply brand theme to face recognition UI

**Theme elements:**

- Watermorphism effects
- Brand colors (#C9A227, #2E3A3E)
- Consistent typography

---

## Phase 8: Testing & Security Validation

### Task 8.1: Unit Tests - Encryption Service

**Status:** [ ] Not Started
**Priority:** P0

**Files to create:**

- `__tests__/lib/face-encryption.test.ts`

**Test cases:**

- [ ] Encrypt/decrypt round-trip preserves data
- [ ] Different IVs produce different ciphertext
- [ ] Invalid auth tag throws error
- [ ] Invalid key throws error

---

### Task 8.2: Unit Tests - Face Matching Service

**Status:** [ ] Not Started
**Priority:** P0

**Files to create:**

- `__tests__/lib/face-matching.test.ts`

**Test cases:**

- [ ] Identical descriptors → distance 0
- [ ] Similar descriptors → distance < 0.4
- [ ] Different descriptors → distance > 0.4
- [ ] Invalid length throws error
- [ ] Confidence conversion correct

---

### Task 8.3: Integration Tests - Verify Face API

**Status:** [ ] Not Started
**Priority:** P0 - **SECURITY CRITICAL**

**Files to create:**

- `__tests__/api/verify-face.test.ts`

**Test cases:**

- [ ] Unauthenticated → 401
- [ ] Non-teacher → 403
- [ ] Unassigned student → 403
- [ ] Valid face → matched: true
- [ ] Different face → matched: false
- [ ] **Client-provided confidence IGNORED** (security test)
- [ ] Rate limiting works

---

### Task 8.4: Integration Tests - Enrollment API

**Status:** [ ] Not Started
**Priority:** P0

**Files to create:**

- `__tests__/api/face-enroll.test.ts`

**Test cases:**

- [ ] Valid enrollment saves encrypted data
- [ ] Non-parent access denied
- [ ] Invalid descriptor rejected
- [ ] Old record deactivated

---

### Task 8.5: E2E Tests with Camera Mock

**Status:** [ ] Not Started
**Priority:** P1

**Files to create:**

- `e2e/face-enrollment.spec.ts`
- `e2e/face-checkin.spec.ts`

**Test cases:**

- [ ] Parent can enroll student face
- [ ] Teacher can verify and check-in
- [ ] Wrong face shows no match
- [ ] QR fallback works

---

### Task 8.6: Security Penetration Testing

**Status:** [ ] Not Started
**Priority:** P0

**Test cases:**

| Test Case                  | Expected Result                |
| -------------------------- | ------------------------------ |
| Spoofing confidence value  | Server ignores, calculates own |
| Cross-parent access        | 403 Forbidden                  |
| Unassigned student access  | 403 Forbidden                  |
| Brute force descriptors    | Rate limited after 10 attempts |
| SQL injection in studentId | Validation error               |
| Reading encrypted data     | Unusable without key           |

**Acceptance Criteria:**

- [ ] All security tests pass
- [ ] No way to bypass server verification
- [ ] Audit logs capture all attempts

---

## Phase 9: Documentation & Deployment

### Task 9.1: Update CLAUDE.md

**Status:** [ ] Not Started
**Priority:** P1

**Sections to add:**

- Face recognition overview
- Security architecture summary
- API endpoints
- Environment variables
- Testing commands

---

### Task 9.2: Create User Guide

**Status:** [ ] Not Started
**Priority:** P2

**Files to create:**

- `docs/USER_GUIDE_FACE_RECOGNITION.md`

**Sections:**

- Parent: How to enroll
- Teacher: How to check-in
- Troubleshooting
- Privacy information

---

### Task 9.3: Feature Flag Setup

**Status:** [ ] Not Started
**Priority:** P1

**Implementation:**

- `NEXT_PUBLIC_ENABLE_FACE_RECOGNITION=true/false`
- Conditional rendering in UI
- Default: disabled in production initially

**Acceptance Criteria:**

- [ ] Feature hidden when disabled
- [ ] Full functionality when enabled
- [ ] No errors when disabled

---

### Task 9.4: Production Deployment Checklist

**Status:** [ ] Not Started
**Priority:** P0

**Checklist:**

- [ ] `FACE_ENCRYPTION_KEY` set in production
- [ ] Database migration applied
- [ ] Service Worker deployed
- [ ] Models cached in CDN
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Feature flag off initially
- [ ] Security tests pass in staging

---

## Summary Checklist

### Phase 1: Setup & Infrastructure

- [ ] 1.1 Install dependencies
- [ ] 1.2 Download models
- [ ] 1.3 Create Service Worker
- [ ] 1.4 Create IndexedDB storage
- [ ] 1.5 Create database migration
- [ ] 1.6 Create TypeScript types
- [ ] 1.7 Add environment variables

### Phase 2: Security & Encryption (CRITICAL)

- [ ] 2.1 Create encryption service
- [ ] 2.2 Create matching service (server-side)
- [ ] 2.3 Create rate limiting
- [ ] 2.4 Create audit logging

### Phase 3: Backend Implementation

- [ ] 3.1 Create face enrollment API
- [ ] 3.2 Create face verification API (CRITICAL)
- [ ] 3.3 Create face check-in API
- [ ] 3.4 Create assigned students API
- [ ] 3.5 Create face delete API

### Phase 4: Frontend - Shared

- [ ] 4.1 Create face recognition service
- [ ] 4.2 Create FaceScanner component
- [ ] 4.3 Create model loading hook
- [ ] 4.4 Create quality indicator

### Phase 5: Frontend - Parent

- [ ] 5.1 Create FaceEnrollment component
- [ ] 5.2 Create consent dialog
- [ ] 5.3 Integrate into student profile
- [ ] 5.4 Create face data management UI

### Phase 6: Frontend - Teacher

- [ ] 6.1 Create FaceCheckIn component
- [ ] 6.2 Create FaceMatchCard
- [ ] 6.3 Create manual select fallback
- [ ] 6.4 Integrate into dashboard
- [ ] 6.5 Add session notes

### Phase 7: Integration & Polish

- [ ] 7.1 Implement model preloading
- [ ] 7.2 Add loading animations
- [ ] 7.3 Optimize camera performance
- [ ] 7.4 Add offline indicator
- [ ] 7.5 Apply GuruKool theme

### Phase 8: Testing & Security (CRITICAL)

- [ ] 8.1 Unit tests - encryption
- [ ] 8.2 Unit tests - matching
- [ ] 8.3 Integration tests - verify API
- [ ] 8.4 Integration tests - enrollment
- [ ] 8.5 E2E tests
- [ ] 8.6 Security penetration testing

### Phase 9: Documentation & Deployment

- [ ] 9.1 Update CLAUDE.md
- [ ] 9.2 Create user guide
- [ ] 9.3 Feature flag setup
- [ ] 9.4 Production deployment checklist

---

## Dependencies Graph

```
Phase 1 (Setup)
├── 1.1 Install ──┬──> 1.5 Migration ──> Phase 3 (Backend)
├── 1.2 Models ───┤
├── 1.3 SW ───────┤
├── 1.4 IndexedDB ┤
├── 1.6 Types ────┴──> All phases
└── 1.7 Env vars ────> Phase 2

Phase 2 (Security) - CRITICAL PATH
├── 2.1 Encryption ──> 3.1, 3.2
├── 2.2 Matching ────> 3.2
├── 2.3 Rate limit ──> 3.2
└── 2.4 Audit ───────> 3.2

Phase 3 (Backend)
├── 3.1 Enroll ──> 5.1 (Parent enrollment)
├── 3.2 Verify ──> 6.1 (Teacher check-in) - CRITICAL
├── 3.3 Check-in -> 6.1
└── 3.4 Assigned -> 6.1

Phase 4 (Shared Components)
├── 4.1 Service ──> 4.2, 5.1, 6.1
├── 4.2 Scanner ──> 5.1, 6.1
└── 4.3 Hook ─────> 5.1, 6.1

Phase 5 (Parent) ──> Phase 6 (Teacher) ──> Phase 7 (Polish)
                                             |
                                             v
                                      Phase 8 (Testing)
                                             |
                                             v
                                      Phase 9 (Deploy)
```

---

## Risk Mitigation

| Risk                      | Mitigation                                    |
| ------------------------- | --------------------------------------------- |
| Model loading slow        | Service Worker cache, preload on dashboard    |
| Camera denied             | Clear error message, QR fallback              |
| Low match accuracy        | Server-side threshold tuning, manual fallback |
| Client-side tampering     | **Server-side verification (mandatory)**      |
| Privacy concerns          | Encryption, clear consent, deletion option    |
| Browser compatibility     | Feature detection, graceful degradation       |
| Network failures          | Offline indicator, QR fallback                |
| Encryption key compromise | Key rotation procedure, audit logging         |

---

## Version History

| Version | Date         | Changes                                       |
| ------- | ------------ | --------------------------------------------- |
| 1.0     | January 2026 | Initial draft with client-side matching       |
| 2.0     | January 2026 | **Security update**: Server-side verification |
|         |              | Added encryption service                      |
|         |              | Added audit logging                           |
|         |              | Added Service Worker caching                  |
|         |              | Removed client-side matching                  |
