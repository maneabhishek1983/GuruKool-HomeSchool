# Face Recognition Check-In/Check-Out - Implementation Tasks

## Task Overview

| Phase                           | Tasks   | Priority | Estimated Effort |
| ------------------------------- | ------- | -------- | ---------------- |
| 1. Setup & Infrastructure       | 5 tasks | P0       | Foundation       |
| 2. Backend Implementation       | 4 tasks | P0       | Core API         |
| 3. Frontend - Shared Components | 3 tasks | P0       | Core UI          |
| 4. Frontend - Parent Flow       | 4 tasks | P0       | Enrollment       |
| 5. Frontend - Teacher Flow      | 5 tasks | P0       | Verification     |
| 6. Integration & Polish         | 4 tasks | P1       | UX               |
| 7. Testing & QA                 | 5 tasks | P1       | Quality          |
| 8. Documentation & Deployment   | 3 tasks | P2       | Launch           |

---

## Phase 1: Setup & Infrastructure

### Task 1.1: Install face-api.js and Dependencies

**Status:** [ ] Not Started

**Description:** Add face-api.js library and configure for Next.js

**Files to modify:**

- `package.json`

**Commands:**

```bash
npm install face-api.js @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl
```

**Acceptance Criteria:**

- [ ] face-api.js installed successfully
- [ ] No TypeScript errors
- [ ] Build passes

---

### Task 1.2: Download and Host Face Detection Models

**Status:** [ ] Not Started

**Description:** Download face-api.js models and host in public directory

**Files to create:**

- `public/models/face-api/ssd_mobilenetv1_model-weights_manifest.json`
- `public/models/face-api/ssd_mobilenetv1_model-shard1`
- `public/models/face-api/face_landmark_68_model-weights_manifest.json`
- `public/models/face-api/face_landmark_68_model-shard1`
- `public/models/face-api/face_recognition_model-weights_manifest.json`
- `public/models/face-api/face_recognition_model-shard1`
- `public/models/face-api/face_recognition_model-shard2`

**Download from:**
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

**Acceptance Criteria:**

- [ ] All model files present in `public/models/face-api/`
- [ ] Models load successfully in browser
- [ ] Total size ~13MB verified

---

### Task 1.3: Create Database Migration

**Status:** [ ] Not Started

**Description:** Create migration for `student_face_records` table

**Files to create:**

- `supabase/migrations/013_student_face_records.sql`

**SQL Schema:**

```sql
CREATE TABLE student_face_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  face_descriptor JSONB NOT NULL,
  descriptor_version VARCHAR(50) DEFAULT 'face-api-v0.22.2',
  quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),
  enrollment_metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_active_face_per_student UNIQUE (student_id) WHERE (is_active = TRUE)
);

-- Indexes
CREATE INDEX idx_face_records_student ON student_face_records(student_id);
CREATE INDEX idx_face_records_active ON student_face_records(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE student_face_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage student face records"
ON student_face_records FOR ALL
USING (
  student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
);

CREATE POLICY "Teachers can read assigned student face records"
ON student_face_records FOR SELECT
USING (
  student_id IN (
    SELECT s.id FROM students s
    JOIN teacher_qr_codes tqc ON tqc.student_id = s.id
    JOIN teachers t ON t.id = tqc.teacher_id
    WHERE t.user_id = auth.uid() AND tqc.is_active = TRUE
  )
  OR student_id IN (
    SELECT id FROM students
    WHERE assigned_teachers @> ARRAY[(SELECT id FROM teachers WHERE user_id = auth.uid())]::uuid[]
  )
);

-- Modify teacher_sessions
ALTER TABLE teacher_sessions
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50) DEFAULT 'qr_code',
ADD COLUMN IF NOT EXISTS face_confidence FLOAT;
```

**Acceptance Criteria:**

- [ ] Migration file created
- [ ] Applied successfully in Supabase Dashboard
- [ ] RLS policies working (test with parent/teacher users)

---

### Task 1.4: Create Face Recognition Types

**Status:** [ ] Not Started

**Description:** Add TypeScript types for face recognition

**Files to modify:**

- `src/types/index.ts`

**Types to add:**

```typescript
// Face Recognition Types
export interface FaceDescriptor {
  data: number[]; // 128 floats
  version: string;
}

export interface StudentFaceRecord {
  id: string;
  student_id: string;
  face_descriptor: number[];
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
  descriptor: Float32Array | number[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  qualityScore: number;
  matchedStudent?: {
    id: string;
    name: string;
    confidence: number;
  };
}

export interface FaceScannerError {
  code:
    | 'CAMERA_DENIED'
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'MODEL_LOAD_FAILED'
    | 'LOW_QUALITY';
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

---

### Task 1.5: Create Face Recognition Service

**Status:** [ ] Not Started

**Description:** Create service for face recognition operations

**Files to create:**

- `src/services/face-recognition.service.ts`

**Methods:**

```typescript
export class FaceRecognitionService {
  private static modelsLoaded = false;

  // Load face-api.js models
  static async loadModels(): Promise<void>;

  // Check if models are loaded
  static isReady(): boolean;

  // Detect face and extract descriptor
  static async detectFace(
    videoElement: HTMLVideoElement
  ): Promise<FaceDetectionResult | null>;

  // Compare two descriptors
  static compareDescriptors(
    descriptor1: number[],
    descriptor2: number[]
  ): number; // Returns confidence 0-1

  // Find best match from list
  static findBestMatch(
    capturedDescriptor: number[],
    studentDescriptors: Array<{
      id: string;
      name: string;
      descriptor: number[];
    }>,
    minConfidence?: number
  ): { student: { id: string; name: string }; confidence: number } | null;

  // Calculate quality score
  static calculateQualityScore(detection: faceapi.FaceDetection): number;
}
```

**Acceptance Criteria:**

- [ ] Service created with all methods
- [ ] Models load successfully
- [ ] Face detection works
- [ ] Matching algorithm accurate

---

## Phase 2: Backend Implementation

### Task 2.1: Create Face Enrollment API

**Status:** [ ] Not Started

**Description:** API endpoint for saving face embeddings

**Files to create:**

- `src/app/api/student/face-enroll/route.ts`

**Endpoint:** `POST /api/student/face-enroll`

**Implementation:**

```typescript
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
  // 1. Authenticate user
  // 2. Validate request body
  // 3. Verify parent owns student
  // 4. Deactivate existing face record
  // 5. Insert new face record
  // 6. Return success
}
```

**Acceptance Criteria:**

- [ ] Endpoint responds to POST
- [ ] Validates 128-float descriptor
- [ ] Checks parent ownership
- [ ] Saves to database
- [ ] Returns appropriate errors

---

### Task 2.2: Create Face Check-In API

**Status:** [ ] Not Started

**Description:** API endpoint for face-based check-in/check-out

**Files to create:**

- `src/app/api/teacher-sessions/check-in-face/route.ts`

**Endpoint:** `POST /api/teacher-sessions/check-in-face`

**Request Schema:**

```typescript
const faceCheckInSchema = z.object({
  studentId: z.string().uuid(),
  confidence: z.number().min(0).max(1),
  action: z.enum(['check_in', 'check_out']),
  notes: z.string().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number(),
    })
    .optional(),
});
```

**Implementation:**

- Reuse session creation logic from `TeacherQRService.validateQRCodeAndCreateSession()`
- Set `verification_method: 'face_recognition'`
- Store `face_confidence` in session record

**Acceptance Criteria:**

- [ ] Creates session on check-in
- [ ] Updates session on check-out
- [ ] Records verification_method
- [ ] Records confidence score
- [ ] Real-time notification works

---

### Task 2.3: Create Get Assigned Faces API

**Status:** [ ] Not Started

**Description:** API for teachers to get face data of assigned students

**Files to create:**

- `src/app/api/teacher/assigned-faces/route.ts`

**Endpoint:** `GET /api/teacher/assigned-faces`

**Response:**

```typescript
{
  students: [
    {
      id: string;
      name: string;
      grade: string;
      faceDescriptor: number[] | null;
      hasFaceEnrolled: boolean;
      hasActiveSession: boolean;
    }
  ]
}
```

**Implementation:**

- Get teacher's assigned students (use existing dashboard logic)
- Join with `student_face_records`
- Return face descriptors for enrolled students

**Acceptance Criteria:**

- [ ] Returns assigned students
- [ ] Includes face descriptors where available
- [ ] RLS prevents unauthorized access
- [ ] Indicates active session status

---

### Task 2.4: Create Face Delete API

**Status:** [ ] Not Started

**Description:** API for parents to delete face data

**Files to create:**

- `src/app/api/student/face-enroll/route.ts` (add DELETE handler)

**Endpoint:** `DELETE /api/student/face-enroll?studentId={id}`

**Implementation:**

- Verify parent owns student
- Soft delete (set is_active = false) or hard delete
- Return confirmation

**Acceptance Criteria:**

- [ ] Deletes face record
- [ ] Verifies ownership
- [ ] Returns appropriate response

---

## Phase 3: Frontend - Shared Components

### Task 3.1: Create FaceScanner Component

**Status:** [ ] Not Started

**Description:** Reusable camera component with face detection

**Files to create:**

- `src/components/shared/FaceScanner.tsx`

**Props Interface:**

```typescript
interface FaceScannerProps {
  mode: 'enroll' | 'verify';
  onFaceDetected: (result: FaceDetectionResult) => void;
  onError: (error: FaceScannerError) => void;
  assignedStudents?: Array<{ id: string; name: string; descriptor: number[] }>;
  minConfidence?: number;
  showDebug?: boolean;
}
```

**Features:**

- [ ] Camera permission handling
- [ ] Real-time face detection box overlay
- [ ] Quality indicators (lighting, distance)
- [ ] Status messages
- [ ] Frame processing optimization (skip frames)
- [ ] Error handling with user-friendly messages

**Acceptance Criteria:**

- [ ] Camera opens with permission
- [ ] Face detection box visible
- [ ] Quality score calculated
- [ ] Callback fires on detection
- [ ] Works on mobile browsers

---

### Task 3.2: Create Model Loading Hook

**Status:** [ ] Not Started

**Description:** React hook for loading face-api.js models

**Files to create:**

- `src/hooks/useFaceRecognition.ts`

**Hook Interface:**

```typescript
function useFaceRecognition() {
  return {
    isLoading: boolean;
    isReady: boolean;
    error: string | null;
    loadProgress: number; // 0-100
  };
}
```

**Features:**

- [ ] Lazy model loading
- [ ] Progress tracking
- [ ] Error handling
- [ ] Singleton pattern (don't reload if already loaded)

**Acceptance Criteria:**

- [ ] Models load on first use
- [ ] Progress indicator works
- [ ] Error state handled
- [ ] Doesn't reload unnecessarily

---

### Task 3.3: Create Face Quality Indicator Component

**Status:** [ ] Not Started

**Description:** Visual indicator for face capture quality

**Files to create:**

- `src/components/shared/FaceQualityIndicator.tsx`

**Props:**

```typescript
interface FaceQualityIndicatorProps {
  qualityScore: number; // 0-1
  issues?: Array<'lighting' | 'distance' | 'angle' | 'blur'>;
}
```

**UI:**

```
Quality: ████████░░ 80%
✓ Good lighting
✓ Face centered
⚠ Move closer
```

**Acceptance Criteria:**

- [ ] Shows progress bar
- [ ] Lists quality issues
- [ ] Color coded (red/yellow/green)

---

## Phase 4: Frontend - Parent Flow (Enrollment)

### Task 4.1: Create FaceEnrollment Component

**Status:** [ ] Not Started

**Description:** Wizard component for face enrollment during student creation

**Files to create:**

- `src/components/parent/FaceEnrollment.tsx`

**Props:**

```typescript
interface FaceEnrollmentProps {
  studentId: string;
  studentName: string;
  onComplete: () => void;
  onSkip?: () => void;
}
```

**Wizard Steps:**

1. **Prepare** - Instructions, lighting tips
2. **Capture** - Camera view with face detection
3. **Confirm** - Preview captured face, confirm or retake

**UI States:**

- [ ] Instruction screen
- [ ] Camera active with detection
- [ ] Capturing (brief freeze)
- [ ] Preview with quality score
- [ ] Success confirmation
- [ ] Error state with retry

**Acceptance Criteria:**

- [ ] Three-step wizard works
- [ ] Skip option available
- [ ] Quality check before save
- [ ] API call on confirm
- [ ] Error handling

---

### Task 4.2: Integrate Enrollment into Student Profile Creation

**Status:** [ ] Not Started

**Description:** Add FaceEnrollment step to student profile wizard

**Files to modify:**

- `src/app/parent/students/new/page.tsx` (or equivalent)
- `src/components/parent/StudentProfileForm.tsx` (if exists)

**Changes:**

- Add FaceEnrollment as step 4 (after teacher assignment)
- Make it optional (skip button)
- Show success indicator in profile after enrollment

**Acceptance Criteria:**

- [ ] Face enrollment step visible in wizard
- [ ] Can skip to complete without face
- [ ] Face data saved on complete
- [ ] Profile shows face enrollment status

---

### Task 4.3: Create Face Data Management UI

**Status:** [ ] Not Started

**Description:** Allow parents to view/update/delete face data

**Files to modify:**

- `src/app/parent/students/[id]/page.tsx` (or profile edit page)

**Features:**

- [ ] Show face enrollment status
- [ ] "Update Face" button (re-enrollment)
- [ ] "Remove Face Data" button with confirmation
- [ ] Last updated timestamp

**Acceptance Criteria:**

- [ ] Status visible on student profile
- [ ] Update triggers re-enrollment flow
- [ ] Delete removes face record
- [ ] Confirmation dialog for delete

---

### Task 4.4: Add Consent Dialog

**Status:** [ ] Not Started

**Description:** Consent dialog before face enrollment

**Files to create:**

- `src/components/parent/FaceConsentDialog.tsx`

**Content:**

```
Face Recognition Enrollment

By proceeding, you agree to:
• We capture facial features (not images) for check-in verification
• Data is encrypted and stored securely
• You can delete this data anytime from settings
• This is optional - QR code check-in is always available

[I Agree]  [Skip - Use QR Code]
```

**Acceptance Criteria:**

- [ ] Dialog shows before enrollment
- [ ] Can agree or skip
- [ ] Skip bypasses enrollment
- [ ] Agree proceeds to camera

---

## Phase 5: Frontend - Teacher Flow (Verification)

### Task 5.1: Create FaceCheckIn Component

**Status:** [ ] Not Started

**Description:** Face verification component for teachers

**Files to create:**

- `src/components/teacher/FaceCheckIn.tsx`

**Props:**

```typescript
interface FaceCheckInProps {
  teacherId: string;
  onSessionCreated: (session: TeacherSession) => void;
  onSwitchToQR: () => void;
}
```

**Flow:**

1. Load assigned students with face data
2. Start camera and continuous scanning
3. On match, show student info + confidence
4. Check-in/Check-out buttons
5. Confirmation and session creation

**UI States:**

- [ ] Loading assigned students
- [ ] Camera scanning (no match yet)
- [ ] Match found (show student card)
- [ ] Processing check-in
- [ ] Success
- [ ] No match / low confidence

**Acceptance Criteria:**

- [ ] Loads face data for assigned students only
- [ ] Real-time face matching
- [ ] Shows confidence percentage
- [ ] Check-in/out creates session
- [ ] Real-time notification to parent

---

### Task 5.2: Create Manual Student Select Fallback

**Status:** [ ] Not Started

**Description:** Allow teacher to manually select student if face fails

**Files to create:**

- `src/components/teacher/ManualStudentSelect.tsx`

**UI:**

```
Face not recognized? Select manually:

┌─────┐  ┌─────┐  ┌─────┐
│ 👤  │  │ 👤  │  │ 👤  │
│ Ali │  │Ridhwan│ │ Sara│
└─────┘  └─────┘  └─────┘
```

**Features:**

- [ ] Grid of assigned students
- [ ] Click to select
- [ ] Proceed to check-in/out

**Acceptance Criteria:**

- [ ] Shows all assigned students
- [ ] Selection triggers check-in flow
- [ ] Records verification_method as 'manual'

---

### Task 5.3: Integrate Face Check-In into Teacher Dashboard

**Status:** [ ] Not Started

**Description:** Add Face Check-In option to teacher check-in interface

**Files to modify:**

- `src/components/teacher/QRCheckInOut.tsx`
- Or create new: `src/components/teacher/UnifiedCheckIn.tsx`

**Changes:**

- Add toggle/tabs: "QR Scan" | "Face Scan"
- Render appropriate component based on selection
- Remember user's preferred method

**UI:**

```
┌──────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐          │
│  │ QR Scan  │  │Face Scan │          │
│  └──────────┘  └──────────┘          │
│                                       │
│  [Selected scanner component here]    │
│                                       │
└──────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Toggle between QR and Face
- [ ] Both methods work
- [ ] Preference persisted (localStorage)

---

### Task 5.4: Add Face Match Confidence Display

**Status:** [ ] Not Started

**Description:** Show match confidence and student info on detection

**Files to create:**

- `src/components/teacher/FaceMatchCard.tsx`

**Props:**

```typescript
interface FaceMatchCardProps {
  student: { id: string; name: string; grade: string };
  confidence: number;
  hasActiveSession: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onReject: () => void;
}
```

**UI:**

```
┌─────────────────────────────────────┐
│          Student Identified!         │
│                                      │
│            [Photo/Avatar]            │
│                                      │
│           Ridhwan Shaik              │
│           Grade 5                    │
│           Match: 94% ✓               │
│                                      │
│  ┌──────────┐    ┌──────────┐       │
│  │ CHECK IN │    │CHECK OUT │       │
│  └──────────┘    └──────────┘       │
│                                      │
│  [Not this student?]                 │
└─────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Shows student info
- [ ] Confidence percentage with color coding
- [ ] Check-in disabled if already active
- [ ] Check-out disabled if not active
- [ ] Reject/retry option

---

### Task 5.5: Add Session Notes Input

**Status:** [ ] Not Started

**Description:** Optional notes input after face check-in

**Files to modify:**

- `src/components/teacher/FaceCheckIn.tsx`

**Feature:**

- After selecting check-in/out action
- Show optional notes textarea
- Include notes in session creation

**Acceptance Criteria:**

- [ ] Notes input shown after action select
- [ ] Can skip or add notes
- [ ] Notes saved with session

---

## Phase 6: Integration & Polish

### Task 6.1: Add Loading States and Animations

**Status:** [ ] Not Started

**Description:** Smooth loading states throughout face recognition flow

**Files to modify:**

- All face recognition components

**Animations:**

- [ ] Model loading progress
- [ ] Face detection pulse
- [ ] Match success celebration
- [ ] Error shake

**Acceptance Criteria:**

- [ ] No jarring state changes
- [ ] Clear progress indicators
- [ ] Smooth transitions

---

### Task 6.2: Optimize Camera Performance

**Status:** [ ] Not Started

**Description:** Ensure smooth camera performance on mobile

**Optimizations:**

- [ ] Skip frames (process every 3rd)
- [ ] Lower detection resolution
- [ ] Debounce match callbacks
- [ ] Clean up on unmount
- [ ] Handle orientation changes

**Acceptance Criteria:**

- [ ] 30+ FPS on mid-range mobile
- [ ] No memory leaks
- [ ] Works in landscape/portrait

---

### Task 6.3: Add Offline Indicator

**Status:** [ ] Not Started

**Description:** Warn when offline (face matching works, but session save fails)

**Files to modify:**

- Face recognition components

**Behavior:**

- Show "Offline" indicator
- Face detection still works
- Queue session creation for later
- Or show warning that online required

**Acceptance Criteria:**

- [ ] Offline state detected
- [ ] User warned appropriately
- [ ] Graceful degradation

---

### Task 6.4: GuruKool Theme Integration

**Status:** [ ] Not Started

**Description:** Apply GuruKool brand theme to face recognition UI

**Files to modify:**

- All face recognition components

**Theme elements:**

- Watermorphism effects
- Brand colors (#C9A227, #2E3A3E)
- Consistent typography
- Motion design

**Acceptance Criteria:**

- [ ] Matches existing UI style
- [ ] Consistent with parent/teacher dashboards
- [ ] Accessible color contrast

---

## Phase 7: Testing & QA

### Task 7.1: Unit Tests for Face Matching

**Status:** [ ] Not Started

**Description:** Test face matching algorithm

**Files to create:**

- `__tests__/services/face-recognition.test.ts`

**Test cases:**

- [ ] Same person matches with high confidence
- [ ] Different people don't match
- [ ] Edge case: similar faces
- [ ] Quality score calculation
- [ ] Error handling

---

### Task 7.2: Integration Tests for APIs

**Status:** [ ] Not Started

**Description:** Test face recognition API endpoints

**Files to create:**

- `__tests__/api/face-enroll.test.ts`
- `__tests__/api/check-in-face.test.ts`

**Test cases:**

- [ ] Enrollment saves descriptor
- [ ] Unauthorized access blocked
- [ ] Invalid descriptor rejected
- [ ] Check-in creates session
- [ ] Check-out updates session

---

### Task 7.3: E2E Tests with Camera Mock

**Status:** [ ] Not Started

**Description:** End-to-end tests for face recognition flows

**Files to create:**

- `e2e/face-enrollment.spec.ts`
- `e2e/face-checkin.spec.ts`

**Test cases:**

- [ ] Parent enrollment flow
- [ ] Teacher check-in flow
- [ ] Fallback to QR
- [ ] Error handling

**Note:** Use Playwright camera mocking

---

### Task 7.4: Manual QA Checklist

**Status:** [ ] Not Started

**Test Matrix:**

| Scenario               | Chrome | Safari | Mobile Chrome | Mobile Safari |
| ---------------------- | ------ | ------ | ------------- | ------------- |
| Model loading          | [ ]    | [ ]    | [ ]           | [ ]           |
| Camera permission      | [ ]    | [ ]    | [ ]           | [ ]           |
| Face detection         | [ ]    | [ ]    | [ ]           | [ ]           |
| Enrollment save        | [ ]    | [ ]    | [ ]           | [ ]           |
| Teacher matching       | [ ]    | [ ]    | [ ]           | [ ]           |
| Check-in creation      | [ ]    | [ ]    | [ ]           | [ ]           |
| Real-time notification | [ ]    | [ ]    | [ ]           | [ ]           |

---

### Task 7.5: Security Testing

**Status:** [ ] Not Started

**Tests:**

- [ ] RLS policies prevent cross-parent access
- [ ] Teacher can only access assigned students
- [ ] Invalid descriptors rejected
- [ ] Rate limiting on enrollment
- [ ] No face images stored

---

## Phase 8: Documentation & Deployment

### Task 8.1: Update CLAUDE.md

**Status:** [ ] Not Started

**Description:** Document face recognition in project README

**Sections to add:**

- [ ] Face recognition overview
- [ ] API endpoints
- [ ] Component locations
- [ ] Configuration options

---

### Task 8.2: Create User Guide

**Status:** [ ] Not Started

**Description:** User-facing documentation

**Files to create:**

- `docs/USER_GUIDE_FACE_RECOGNITION.md`

**Sections:**

- [ ] How to enroll face (parents)
- [ ] How to check-in with face (teachers)
- [ ] Troubleshooting
- [ ] Privacy information

---

### Task 8.3: Feature Flag Setup

**Status:** [ ] Not Started

**Description:** Add feature flag for gradual rollout

**Implementation:**

- Environment variable: `NEXT_PUBLIC_ENABLE_FACE_RECOGNITION=true`
- Conditional rendering in UI
- Default: disabled

**Acceptance Criteria:**

- [ ] Feature hidden when flag is false
- [ ] Full functionality when flag is true
- [ ] No errors when disabled

---

## Summary Checklist

### Phase 1: Setup & Infrastructure

- [ ] 1.1 Install face-api.js
- [ ] 1.2 Download and host models
- [ ] 1.3 Create database migration
- [ ] 1.4 Create TypeScript types
- [ ] 1.5 Create face recognition service

### Phase 2: Backend Implementation

- [ ] 2.1 Create face enrollment API
- [ ] 2.2 Create face check-in API
- [ ] 2.3 Create get assigned faces API
- [ ] 2.4 Create face delete API

### Phase 3: Frontend - Shared Components

- [ ] 3.1 Create FaceScanner component
- [ ] 3.2 Create model loading hook
- [ ] 3.3 Create quality indicator component

### Phase 4: Frontend - Parent Flow

- [ ] 4.1 Create FaceEnrollment component
- [ ] 4.2 Integrate into student profile creation
- [ ] 4.3 Create face data management UI
- [ ] 4.4 Add consent dialog

### Phase 5: Frontend - Teacher Flow

- [ ] 5.1 Create FaceCheckIn component
- [ ] 5.2 Create manual student select fallback
- [ ] 5.3 Integrate into teacher dashboard
- [ ] 5.4 Add face match confidence display
- [ ] 5.5 Add session notes input

### Phase 6: Integration & Polish

- [ ] 6.1 Add loading states and animations
- [ ] 6.2 Optimize camera performance
- [ ] 6.3 Add offline indicator
- [ ] 6.4 GuruKool theme integration

### Phase 7: Testing & QA

- [ ] 7.1 Unit tests for face matching
- [ ] 7.2 Integration tests for APIs
- [ ] 7.3 E2E tests with camera mock
- [ ] 7.4 Manual QA checklist
- [ ] 7.5 Security testing

### Phase 8: Documentation & Deployment

- [ ] 8.1 Update CLAUDE.md
- [ ] 8.2 Create user guide
- [ ] 8.3 Feature flag setup

---

## Dependencies Graph

```
1.1 Install ──┬──> 1.5 Service ──> 3.1 Scanner ──┬──> 4.1 Enrollment
1.2 Models ───┘                                   │
                                                  └──> 5.1 FaceCheckIn
1.3 Migration ──> 2.1 Enroll API ──> 4.2 Profile Integration
              ──> 2.2 CheckIn API ──> 5.3 Dashboard Integration
              ──> 2.3 AssignedFaces ─┘

1.4 Types ──> All components
```

---

## Risk Mitigation

| Risk                  | Mitigation                                    |
| --------------------- | --------------------------------------------- |
| Model loading slow    | Show progress indicator, preload on app start |
| Camera denied         | Clear error message, QR fallback              |
| Low accuracy          | Allow manual fallback, tune threshold         |
| Privacy concerns      | Clear consent, no image storage               |
| Browser compatibility | Feature detection, graceful degradation       |
