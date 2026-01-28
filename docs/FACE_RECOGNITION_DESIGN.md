# Face Recognition Check-In/Check-Out - Technical Design Document

## Document Information

| Field           | Value                                                |
| --------------- | ---------------------------------------------------- |
| **Version**     | 1.0                                                  |
| **Status**      | Draft                                                |
| **Related PRD** | [FACE_RECOGNITION_PRD.md](./FACE_RECOGNITION_PRD.md) |
| **Created**     | January 2026                                         |

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FACE RECOGNITION SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CLIENT LAYER                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │    │
│  │  │ FaceScanner.tsx │  │FaceEnrollment   │  │ FaceCheckIn.tsx │      │    │
│  │  │   (Shared)      │  │     .tsx        │  │   (Teacher)     │      │    │
│  │  │                 │  │   (Parent)      │  │                 │      │    │
│  │  │ • Camera access │  │                 │  │ • Load assigned │      │    │
│  │  │ • Face detect   │  │ • Enrollment    │  │   student       │      │    │
│  │  │ • Embedding gen │  │   wizard        │  │   embeddings    │      │    │
│  │  │                 │  │ • Quality check │  │ • Client-side   │      │    │
│  │  │ face-api.js     │  │                 │  │   matching      │      │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          API LAYER                                   │    │
│  │  ┌─────────────────────────┐    ┌─────────────────────────────┐     │    │
│  │  │ /api/student/           │    │ /api/teacher-sessions/      │     │    │
│  │  │   face-enroll           │    │   check-in-face             │     │    │
│  │  │                         │    │                             │     │    │
│  │  │ POST: Save embedding    │    │ POST: Verify & create       │     │    │
│  │  │ GET: Retrieve embedding │    │       session               │     │    │
│  │  │ DELETE: Remove data     │    │                             │     │    │
│  │  └─────────────────────────┘    └─────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        DATABASE LAYER                                │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  student_face_records                                        │    │    │
│  │  │  ├─ id (UUID, PK)                                           │    │    │
│  │  │  ├─ student_id (UUID, FK → students)                        │    │    │
│  │  │  ├─ face_descriptor (JSONB - 128 floats)                    │    │    │
│  │  │  ├─ descriptor_version (VARCHAR - model version)            │    │    │
│  │  │  ├─ quality_score (FLOAT - enrollment quality)              │    │    │
│  │  │  ├─ enrollment_metadata (JSONB - device, lighting, etc.)    │    │    │
│  │  │  ├─ is_active (BOOLEAN)                                     │    │    │
│  │  │  ├─ created_at (TIMESTAMP)                                  │    │    │
│  │  │  └─ updated_at (TIMESTAMP)                                  │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  teacher_sessions (MODIFIED)                                 │    │    │
│  │  │  └─ verification_method: 'qr_code' | 'face_recognition' |   │    │    │
│  │  │                          'biometric' | 'manual'             │    │    │
│  │  │  └─ face_confidence (FLOAT - match confidence 0-1)          │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Face Recognition Library

**Selected: face-api.js**

| Aspect             | Details                                                       |
| ------------------ | ------------------------------------------------------------- |
| **Library**        | face-api.js (TensorFlow.js wrapper)                           |
| **Version**        | 0.22.2 (latest stable)                                        |
| **Models**         | SSD MobileNet V1 (detection) + FaceRecognitionNet (embedding) |
| **Embedding Size** | 128-dimensional float vector                                  |
| **Runtime**        | Client-side (browser)                                         |
| **WebGL**          | Required for GPU acceleration                                 |

**Why face-api.js:**

1. Client-side processing reduces server load
2. Privacy-first: raw images never leave device
3. Well-documented, active community
4. Compatible with React/Next.js
5. ~26MB total model size (acceptable with lazy loading)

### 2.2 Model Loading Strategy

```typescript
// Lazy load models on first use
const MODEL_URL = '/models/face-api';

async function loadModels() {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
}
```

**Model Files (to be hosted in `/public/models/face-api/`):**

- `ssd_mobilenetv1_model-weights_manifest.json` (~6MB)
- `face_landmark_68_model-weights_manifest.json` (~350KB)
- `face_recognition_model-weights_manifest.json` (~6.2MB)

---

## 3. Database Schema

### 3.1 New Table: `student_face_records`

```sql
-- Migration: 013_student_face_records.sql

CREATE TABLE student_face_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Face embedding (128-dimensional vector)
  face_descriptor JSONB NOT NULL,

  -- Model version for future compatibility
  descriptor_version VARCHAR(50) DEFAULT 'face-api-v0.22.2',

  -- Enrollment quality metrics
  quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),

  -- Metadata about enrollment conditions
  enrollment_metadata JSONB DEFAULT '{}',
  -- Example: { "device": "iPhone 13", "lighting": "good", "angle": "frontal" }

  -- Soft delete support
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one active record per student
  CONSTRAINT unique_active_face_per_student
    UNIQUE (student_id) WHERE (is_active = TRUE)
);

-- Indexes
CREATE INDEX idx_face_records_student ON student_face_records(student_id);
CREATE INDEX idx_face_records_active ON student_face_records(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE student_face_records ENABLE ROW LEVEL SECURITY;

-- Parents can manage their own students' face records
CREATE POLICY "Parents can manage student face records"
ON student_face_records
FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- Teachers can read face records for assigned students
CREATE POLICY "Teachers can read assigned student face records"
ON student_face_records
FOR SELECT
USING (
  student_id IN (
    SELECT s.id FROM students s
    JOIN teacher_qr_codes tqc ON tqc.student_id = s.id
    JOIN teachers t ON t.id = tqc.teacher_id
    WHERE t.user_id = auth.uid() AND tqc.is_active = TRUE
  )
  OR
  student_id IN (
    SELECT id FROM students
    WHERE assigned_teachers @> ARRAY[(
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )]::uuid[]
  )
);
```

### 3.2 Modify `teacher_sessions` Table

```sql
-- Migration: 013_student_face_records.sql (continued)

-- Add face recognition fields to teacher_sessions
ALTER TABLE teacher_sessions
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50) DEFAULT 'qr_code',
ADD COLUMN IF NOT EXISTS face_confidence FLOAT;

-- Add check constraint for verification_method
ALTER TABLE teacher_sessions
ADD CONSTRAINT valid_verification_method
CHECK (verification_method IN ('qr_code', 'face_recognition', 'biometric', 'manual'));

-- Index for analytics
CREATE INDEX idx_sessions_verification_method ON teacher_sessions(verification_method);
```

### 3.3 Audit Table (Optional - for compliance)

```sql
-- face_verification_audit (optional, for compliance logging)
CREATE TABLE face_verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  verification_result VARCHAR(20), -- 'success', 'failed', 'no_match'
  confidence_score FLOAT,
  attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  device_info JSONB,
  -- Note: Do NOT store captured images for privacy
  CONSTRAINT no_image_storage CHECK (true) -- Placeholder reminder
);
```

---

## 4. API Design

### 4.1 Face Enrollment API

**Endpoint:** `POST /api/student/face-enroll`

**Request:**

```typescript
interface FaceEnrollRequest {
  studentId: string;
  faceDescriptor: number[]; // 128 floats
  qualityScore: number; // 0-1
  metadata?: {
    device?: string;
    lighting?: 'poor' | 'fair' | 'good' | 'excellent';
    angle?: 'frontal' | 'slight_left' | 'slight_right';
  };
}
```

**Response:**

```typescript
interface FaceEnrollResponse {
  success: boolean;
  recordId?: string;
  message: string;
}
```

**Implementation:**

```typescript
// src/app/api/student/face-enroll/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const faceEnrollSchema = z.object({
  studentId: z.string().uuid(),
  faceDescriptor: z.array(z.number()).length(128),
  qualityScore: z.number().min(0).max(1),
  metadata: z
    .object({
      device: z.string().optional(),
      lighting: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
      angle: z.enum(['frontal', 'slight_left', 'slight_right']).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  // 1. Validate auth
  // 2. Parse and validate body
  // 3. Verify parent owns student
  // 4. Deactivate old record if exists
  // 5. Insert new face record
  // 6. Return success
}
```

### 4.2 Face Verification / Check-In API

**Endpoint:** `POST /api/teacher-sessions/check-in-face`

**Request:**

```typescript
interface FaceCheckInRequest {
  studentId: string; // Matched student ID
  faceDescriptor: number[]; // Captured descriptor for audit
  confidence: number; // Match confidence (0-1)
  action: 'check_in' | 'check_out';
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}
```

**Response:**

```typescript
interface FaceCheckInResponse {
  success: boolean;
  session?: {
    id: string;
    studentName: string;
    action: string;
    timestamp: string;
    duration_minutes?: number; // For check-out
  };
  error?: string;
}
```

### 4.3 Get Student Face Embeddings (Teacher)

**Endpoint:** `GET /api/teacher/assigned-faces`

**Response:**

```typescript
interface AssignedFacesResponse {
  students: Array<{
    id: string;
    name: string;
    grade: string;
    faceDescriptor: number[] | null; // null if not enrolled
    hasActiveSession: boolean;
  }>;
}
```

---

## 5. Component Design

### 5.1 FaceScanner Component (Shared)

**Location:** `src/components/shared/FaceScanner.tsx`

```typescript
interface FaceScannerProps {
  mode: 'enroll' | 'verify';
  onFaceDetected: (result: FaceDetectionResult) => void;
  onError: (error: FaceScannerError) => void;
  assignedStudents?: StudentFaceData[]; // For verify mode
  minConfidence?: number; // Default: 0.6
}

interface FaceDetectionResult {
  descriptor: Float32Array;
  boundingBox: { x: number; y: number; width: number; height: number };
  qualityScore: number;
  matchedStudent?: {
    id: string;
    name: string;
    confidence: number;
  };
}

interface FaceScannerError {
  code:
    | 'CAMERA_DENIED'
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'MODEL_LOAD_FAILED'
    | 'LOW_QUALITY';
  message: string;
}
```

**Component Structure:**

```
FaceScanner
├── Camera Permission Handler
├── Video Element (hidden)
├── Canvas Overlay (face box drawing)
├── Status Indicator
│   ├── "Initializing camera..."
│   ├── "Loading face detection..."
│   ├── "Position your face in the frame"
│   ├── "Face detected! Hold still..."
│   └── "Match found: [Name] (95%)"
├── Quality Indicator (lighting, distance)
└── Debug Overlay (optional)
```

### 5.2 FaceEnrollment Component (Parent)

**Location:** `src/components/parent/FaceEnrollment.tsx`

```typescript
interface FaceEnrollmentProps {
  studentId: string;
  studentName: string;
  onComplete: () => void;
  onSkip?: () => void;
}
```

**UI States:**

```
┌─────────────────────────────────────────┐
│         Face Enrollment Wizard          │
├─────────────────────────────────────────┤
│                                         │
│  Step 1/3: Prepare                      │
│  ───────────────────                    │
│  • Find good lighting                   │
│  • Remove glasses/hat if possible       │
│  • Position face in center of frame     │
│                                         │
│           [Start Camera]                │
│                                         │
│  [Skip - Use QR Code Instead]           │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Face Enrollment Wizard          │
├─────────────────────────────────────────┤
│                                         │
│  Step 2/3: Capture                      │
│  ───────────────────                    │
│  ┌─────────────────────────────┐        │
│  │                             │        │
│  │    [Camera Viewfinder]      │        │
│  │         ┌─────┐             │        │
│  │         │ 😊  │             │        │
│  │         └─────┘             │        │
│  │    ✓ Face Detected          │        │
│  │    ✓ Good Lighting          │        │
│  │    ⚠ Move closer            │        │
│  │                             │        │
│  └─────────────────────────────┘        │
│                                         │
│  Quality: ████████░░ 80%                │
│                                         │
│           [Capture Face]                │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Face Enrollment Wizard          │
├─────────────────────────────────────────┤
│                                         │
│  Step 3/3: Confirm                      │
│  ───────────────────                    │
│                                         │
│  Face captured for: Ridhwan Shaik       │
│                                         │
│         [Captured Snapshot]             │
│              (preview)                  │
│                                         │
│  Quality Score: 85% ✓                   │
│                                         │
│    [Retake]         [Confirm & Save]    │
│                                         │
└─────────────────────────────────────────┘
```

### 5.3 FaceCheckIn Component (Teacher)

**Location:** `src/components/teacher/FaceCheckIn.tsx`

```typescript
interface FaceCheckInProps {
  teacherId: string;
  onSessionCreated: (session: Session) => void;
  onSwitchToQR: () => void;
}
```

**UI Flow:**

```
┌─────────────────────────────────────────┐
│           Face Check-In/Out             │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────┐        │
│  │                             │        │
│  │    [Camera Viewfinder]      │        │
│  │                             │        │
│  │      Scanning for faces...  │        │
│  │                             │        │
│  │    Assigned Students: 3     │        │
│  │    With Face Data: 2        │        │
│  │                             │        │
│  └─────────────────────────────┘        │
│                                         │
│  [Switch to QR]   [Manual Select]       │
│                                         │
└─────────────────────────────────────────┘

On Face Match:
┌─────────────────────────────────────────┐
│           Student Identified!           │
├─────────────────────────────────────────┤
│                                         │
│            [Student Photo]              │
│                                         │
│            Ridhwan Shaik                │
│            Grade 5                      │
│            Match: 94%                   │
│                                         │
│  ┌───────────────┐  ┌───────────────┐   │
│  │   CHECK IN    │  │   CHECK OUT   │   │
│  │    (green)    │  │    (red)      │   │
│  └───────────────┘  └───────────────┘   │
│                                         │
│  Current Status: Not checked in         │
│                                         │
│  [Not this student? Scan again]         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. Face Matching Algorithm

### 6.1 Client-Side Matching (Recommended)

```typescript
// FaceCheckIn.tsx - Client-side matching logic

import * as faceapi from 'face-api.js';

interface StudentFaceData {
  id: string;
  name: string;
  descriptor: Float32Array;
}

function findBestMatch(
  capturedDescriptor: Float32Array,
  assignedStudents: StudentFaceData[],
  minConfidence: number = 0.6
): { student: StudentFaceData; confidence: number } | null {
  let bestMatch: StudentFaceData | null = null;
  let bestDistance = Infinity;

  for (const student of assignedStudents) {
    // Euclidean distance (lower = better match)
    const distance = faceapi.euclideanDistance(
      capturedDescriptor,
      student.descriptor
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = student;
    }
  }

  // Convert distance to confidence (0-1 scale)
  // Distance typically ranges from 0 (perfect) to ~1.4 (different person)
  // Threshold of 0.6 distance ≈ 0.57 confidence is commonly used
  const confidence = Math.max(0, 1 - bestDistance);

  if (confidence >= minConfidence && bestMatch) {
    return { student: bestMatch, confidence };
  }

  return null;
}
```

### 6.2 Confidence Thresholds

| Distance  | Confidence | Interpretation                           |
| --------- | ---------- | ---------------------------------------- |
| 0.0 - 0.3 | 1.0 - 0.7  | Very high confidence (same person)       |
| 0.3 - 0.5 | 0.7 - 0.5  | Good confidence (likely same person)     |
| 0.5 - 0.6 | 0.5 - 0.4  | Marginal (verify manually)               |
| > 0.6     | < 0.4      | Low confidence (likely different person) |

**Recommended Thresholds:**

- Auto-match: confidence ≥ 0.6 (distance ≤ 0.4)
- Show match with confirmation: confidence 0.4 - 0.6
- No match: confidence < 0.4

---

## 7. Security Considerations

### 7.1 Liveness Detection (Anti-Spoofing)

**Basic Implementation (Phase 1):**

```typescript
// Require multiple frames with slight head movement
interface LivenessCheck {
  frameCount: number; // Minimum 5 frames
  headMovement: boolean; // Detected head position change
  blinkDetected: boolean; // Eye blink detected (optional)
  qualityConsistent: boolean; // Quality doesn't suddenly change
}

function checkLiveness(frames: FaceDetection[]): boolean {
  // Check for natural micro-movements
  // Static images won't have these variations
  const movements = calculateMovements(frames);
  return movements.variance > LIVENESS_THRESHOLD;
}
```

### 7.2 Data Protection

| Concern               | Mitigation                                              |
| --------------------- | ------------------------------------------------------- |
| Raw image leakage     | Never store raw face images, only 128-float descriptors |
| Embedding theft       | Encrypt face_descriptor column with pgcrypto            |
| Unauthorized access   | RLS policies restrict to parent/teacher                 |
| Network interception  | TLS 1.3 for all API calls                               |
| Client-side tampering | Server-side validation of studentId ownership           |

### 7.3 Consent Flow

```typescript
// Before face enrollment, show consent dialog
interface ConsentDialog {
  title: 'Face Recognition Enrollment';
  points: [
    'We will capture facial features (not images) for check-in verification',
    'Data is encrypted and stored securely',
    'You can delete this data anytime from settings',
    'This is optional - QR code check-in is always available',
  ];
  actions: ['I Agree', 'Skip - Use QR Code'];
}
```

---

## 8. Integration with Existing System

### 8.1 UnifiedCheckIn Component Modification

**File:** `src/components/teacher/UnifiedCheckIn.tsx` (or `QRCheckInOut.tsx`)

```typescript
// Add tab/toggle for check-in method
type CheckInMethod = 'qr' | 'face';

const UnifiedCheckIn: React.FC = () => {
  const [method, setMethod] = useState<CheckInMethod>('qr');

  return (
    <div>
      {/* Method Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMethod('qr')}
          className={method === 'qr' ? 'active' : ''}
        >
          QR Scan
        </button>
        <button
          onClick={() => setMethod('face')}
          className={method === 'face' ? 'active' : ''}
        >
          Face Scan
        </button>
      </div>

      {/* Render appropriate scanner */}
      {method === 'qr' ? (
        <QRCheckInOut />
      ) : (
        <FaceCheckIn
          teacherId={teacherId}
          onSwitchToQR={() => setMethod('qr')}
        />
      )}
    </div>
  );
};
```

### 8.2 Student Profile Creation Integration

**File:** `src/app/parent/students/new/page.tsx` (or similar)

```typescript
// Add FaceEnrollment step to profile wizard

const StudentProfileWizard = () => {
  const [step, setStep] = useState(1);
  const STEPS = ['Basic Info', 'Standards', 'Teachers', 'Face Setup', 'Complete'];

  return (
    <WizardContainer>
      {step === 1 && <BasicInfoStep onNext={() => setStep(2)} />}
      {step === 2 && <AcademicStandardsStep onNext={() => setStep(3)} />}
      {step === 3 && <TeacherAssignmentStep onNext={() => setStep(4)} />}
      {step === 4 && (
        <FaceEnrollment
          studentId={createdStudentId}
          studentName={studentName}
          onComplete={() => setStep(5)}
          onSkip={() => setStep(5)}
        />
      )}
      {step === 5 && <CompletionStep />}
    </WizardContainer>
  );
};
```

---

## 9. Error Handling

### 9.1 Error Codes and Messages

| Code                | User Message                                                         | Recovery Action            |
| ------------------- | -------------------------------------------------------------------- | -------------------------- |
| `CAMERA_DENIED`     | "Camera access denied. Please enable in browser settings."           | Show settings instructions |
| `NO_FACE`           | "No face detected. Please position yourself in the frame."           | Continue scanning          |
| `MULTIPLE_FACES`    | "Multiple faces detected. Please ensure only one person is visible." | Continue scanning          |
| `MODEL_LOAD_FAILED` | "Face detection failed to load. Please refresh the page."            | Offer QR fallback          |
| `LOW_QUALITY`       | "Image quality too low. Please improve lighting."                    | Show quality tips          |
| `NO_MATCH`          | "Face not recognized. Please try again or use QR code."              | Offer manual select        |
| `ENROLLMENT_FAILED` | "Failed to save face data. Please try again."                        | Retry button               |

### 9.2 Graceful Degradation

```typescript
// Always offer fallback
const FaceCheckIn = ({ onSwitchToQR }) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  if (loadError) {
    return (
      <ErrorState>
        <p>Face recognition unavailable</p>
        <Button onClick={onSwitchToQR}>Use QR Code Instead</Button>
      </ErrorState>
    );
  }

  // ... normal render
};
```

---

## 10. Performance Optimization

### 10.1 Model Loading

```typescript
// Preload models on app start (not component mount)
// src/lib/face-recognition.ts

let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function ensureModelsLoaded(): Promise<void> {
  if (modelsLoaded) return;

  if (!loadPromise) {
    loadPromise = loadAllModels();
  }

  await loadPromise;
  modelsLoaded = true;
}

// Call during app initialization
// Not during FaceScanner mount (too late)
```

### 10.2 Frame Processing

```typescript
// Process every 3rd frame to reduce CPU load
const FRAME_SKIP = 3;
let frameCount = 0;

function processFrame(video: HTMLVideoElement) {
  frameCount++;
  if (frameCount % FRAME_SKIP !== 0) return;

  // Detect face
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
    .withFaceLandmarks()
    .withFaceDescriptor();
}
```

### 10.3 Canvas Resolution

```typescript
// Use lower resolution for detection, full for display
const DETECTION_SIZE = { width: 320, height: 240 };
const DISPLAY_SIZE = { width: 640, height: 480 };
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// __tests__/face-recognition/matching.test.ts
describe('Face Matching', () => {
  it('should match same person with high confidence', () => {
    const descriptor1 = generateTestDescriptor();
    const descriptor2 = addNoise(descriptor1, 0.1); // Same person with slight variation

    const result = findBestMatch(descriptor2, [
      { id: '1', descriptor: descriptor1 },
    ]);
    expect(result?.confidence).toBeGreaterThan(0.8);
  });

  it('should not match different persons', () => {
    const descriptor1 = generateTestDescriptor();
    const descriptor2 = generateTestDescriptor(); // Different random descriptor

    const result = findBestMatch(
      descriptor2,
      [{ id: '1', descriptor: descriptor1 }],
      0.6
    );
    expect(result).toBeNull();
  });
});
```

### 11.2 E2E Tests

```typescript
// e2e/face-recognition.spec.ts
test('Parent can enroll student face', async ({ page }) => {
  // Mock camera with test video
  await page.route('**/getUserMedia', mockCameraStream);

  await page.goto('/parent/students/new');
  // ... complete other steps
  await page.click('text=Start Camera');
  await page.waitForSelector('text=Face Detected');
  await page.click('text=Capture Face');
  await page.click('text=Confirm & Save');

  await expect(page.locator('text=Face enrolled successfully')).toBeVisible();
});
```

### 11.3 Manual Test Cases

| Test                       | Steps                                             | Expected                                      |
| -------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Enrollment - Happy Path    | Create student → Start camera → Capture → Confirm | Success, record in DB                         |
| Enrollment - Poor Lighting | Dim room, attempt capture                         | Quality warning shown                         |
| Enrollment - Photo Attack  | Hold up photo to camera                           | Should fail liveness (Phase 2)                |
| Check-In - Happy Path      | Teacher scans enrolled student                    | Match shown, check-in successful              |
| Check-In - Unknown Face    | Teacher scans non-enrolled person                 | "Face not recognized"                         |
| Check-In - Low Confidence  | Teacher scans with partial occlusion              | Show match with warning, require confirmation |
| Fallback - Model Fail      | Block model download                              | QR fallback offered                           |

---

## 12. Appendix

### A. face-api.js Models Required

| Model            | Purpose                   | Size   |
| ---------------- | ------------------------- | ------ |
| ssd_mobilenetv1  | Face detection            | ~6MB   |
| face_landmark_68 | Facial landmark detection | ~350KB |
| face_recognition | 128D embedding extraction | ~6.2MB |

### B. Browser Support

| Browser        | Supported | Notes               |
| -------------- | --------- | ------------------- |
| Chrome 70+     | ✅        | Full support        |
| Firefox 65+    | ✅        | Full support        |
| Safari 14+     | ✅        | Requires HTTPS      |
| Edge 79+       | ✅        | Full support        |
| Mobile Safari  | ✅        | iOS 14.3+ for WebGL |
| Chrome Android | ✅        | Full support        |

### C. Related Files

| File                                               | Purpose                   |
| -------------------------------------------------- | ------------------------- |
| `docs/FACE_RECOGNITION_PRD.md`                     | Product requirements      |
| `docs/FACE_RECOGNITION_TASKS.md`                   | Implementation tasks      |
| `docs/FACE_RECOGNITION_IMPLEMENTATION.md`          | Code implementation guide |
| `supabase/migrations/013_student_face_records.sql` | Database migration        |
