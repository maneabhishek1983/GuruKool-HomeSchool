# Face Recognition Check-In/Check-Out - Technical Design Document

## Document Information

| Field            | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| **Version**      | 2.0                                                      |
| **Status**       | Approved                                                 |
| **Related PRD**  | [FACE_RECOGNITION_PRD.md](./FACE_RECOGNITION_PRD.md)     |
| **Created**      | January 2026                                             |
| **Security Rev** | Server-Side Verification (Critical Security Update v2.0) |

---

## 1. System Architecture Overview

> **SECURITY UPDATE v2.0**: Architecture redesigned for server-side verification. Client-side matching has been removed to prevent spoofing attacks.

```
+-----------------------------------------------------------------------------+
|                        FACE RECOGNITION SYSTEM v2.0                          |
+-----------------------------------------------------------------------------+
|                                                                              |
|  +-----------------------------------------------------------------------+  |
|  |                         CLIENT LAYER                                   |  |
|  |  +-------------------+  +-------------------+  +-------------------+   |  |
|  |  | FaceScanner.tsx   |  |FaceEnrollment.tsx |  | FaceCheckIn.tsx   |   |  |
|  |  |   (Shared)        |  |    (Parent)       |  |   (Teacher)       |   |  |
|  |  |                   |  |                   |  |                   |   |  |
|  |  | - Camera access   |  | - Enrollment      |  | - Capture face    |   |  |
|  |  | - Face detect     |  |   wizard          |  | - Send descriptor |   |  |
|  |  | - Extract 128D    |  | - Quality check   |  |   to server       |   |  |
|  |  | - Send to server  |  |                   |  | - Display result  |   |  |
|  |  |                   |  |                   |  |                   |   |  |
|  |  | face-api.js       |  |                   |  | NO LOCAL MATCHING |   |  |
|  |  +-------------------+  +-------------------+  +-------------------+   |  |
|  +-----------------------------------------------------------------------+  |
|                                    |                                         |
|                                    v                                         |
|  +-----------------------------------------------------------------------+  |
|  |                          API LAYER                                     |  |
|  |  +---------------------------+    +-------------------------------+   |  |
|  |  | /api/student/face-enroll  |    | /api/teacher-sessions/        |   |  |
|  |  |                           |    |   verify-face                  |   |  |
|  |  | POST: Encrypt & save      |    |                               |   |  |
|  |  | GET: Check enrollment     |    | POST: Server-side matching    |   |  |
|  |  | DELETE: Remove data       |    |   1. Receive descriptor       |   |  |
|  |  +---------------------------+    |   2. Fetch stored descriptor  |   |  |
|  |                                   |   3. Decrypt stored           |   |  |
|  |  +---------------------------+    |   4. Calculate distance       |   |  |
|  |  | /api/teacher-sessions/    |    |   5. Return match result      |   |  |
|  |  |   check-in-face           |    +-------------------------------+   |  |
|  |  |                           |                                        |  |
|  |  | POST: Create session      |                                        |  |
|  |  | (after verify-face)       |                                        |  |
|  |  +---------------------------+                                        |  |
|  +-----------------------------------------------------------------------+  |
|                                    |                                         |
|                                    v                                         |
|  +-----------------------------------------------------------------------+  |
|  |                        DATABASE LAYER                                  |  |
|  |  +---------------------------------------------------------------+   |  |
|  |  |  student_face_records                                          |   |  |
|  |  |  +- id (UUID, PK)                                             |   |  |
|  |  |  +- student_id (UUID, FK -> students)                         |   |  |
|  |  |  +- face_descriptor_encrypted (BYTEA - AES-256-GCM encrypted) |   |  |
|  |  |  +- encryption_iv (BYTEA - Initialization vector)             |   |  |
|  |  |  +- descriptor_version (VARCHAR - model version)              |   |  |
|  |  |  +- quality_score (FLOAT - enrollment quality)                |   |  |
|  |  |  +- enrollment_metadata (JSONB - device, lighting, etc.)      |   |  |
|  |  |  +- is_active (BOOLEAN)                                       |   |  |
|  |  |  +- created_at, updated_at (TIMESTAMP)                        |   |  |
|  |  +---------------------------------------------------------------+   |  |
|  |                                                                       |  |
|  |  +---------------------------------------------------------------+   |  |
|  |  |  teacher_sessions (MODIFIED)                                   |   |  |
|  |  |  +- verification_method: 'qr_code' | 'face_recognition' |     |   |  |
|  |  |                          'biometric' | 'manual'               |   |  |
|  |  |  +- face_confidence (FLOAT - server-calculated confidence)    |   |  |
|  |  +---------------------------------------------------------------+   |  |
|  +-----------------------------------------------------------------------+  |
|                                                                              |
+-----------------------------------------------------------------------------+
```

---

## 2. Technology Stack

### 2.1 Face Recognition Library

**Selected: face-api.js (Client-Side Detection Only)**

| Aspect             | Details                                                       |
| ------------------ | ------------------------------------------------------------- |
| **Library**        | face-api.js (TensorFlow.js wrapper)                           |
| **Version**        | 0.22.2 (latest stable)                                        |
| **Models**         | SSD MobileNet V1 (detection) + FaceRecognitionNet (embedding) |
| **Embedding Size** | 128-dimensional float vector                                  |
| **Runtime**        | Client-side (browser) - Detection and extraction only         |
| **WebGL**          | Required for GPU acceleration                                 |

**Why face-api.js (Detection Only):**

1. Client-side detection reduces latency
2. Privacy-first: raw images never leave device
3. Well-documented, active community
4. Compatible with React/Next.js
5. **Verification moved to server for security**

### 2.2 Model Loading Strategy with Caching

```typescript
// Service Worker caching for model files
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

```typescript
// IndexedDB fallback for model storage
// src/lib/model-storage.ts

import { openDB } from 'idb';

const DB_NAME = 'face-api-models';
const STORE_NAME = 'models';

export async function cacheModelToIndexedDB(
  name: string,
  data: ArrayBuffer
): Promise<void> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
  await db.put(STORE_NAME, data, name);
}

export async function getModelFromIndexedDB(
  name: string
): Promise<ArrayBuffer | null> {
  const db = await openDB(DB_NAME, 1);
  return db.get(STORE_NAME, name);
}
```

**Model Files (to be hosted in `/public/models/face-api/`):**

- `ssd_mobilenetv1_model-weights_manifest.json` (~6MB)
- `face_landmark_68_model-weights_manifest.json` (~350KB)
- `face_recognition_model-weights_manifest.json` (~6.2MB)

---

## 3. Database Schema

### 3.1 New Table: `student_face_records` (with Encryption)

```sql
-- Migration: 017_student_face_records.sql

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Option A: If pgvector is available (preferred for future 1:N search)
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE student_face_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Encrypted face descriptor (AES-256-GCM)
  -- Stores: IV (12 bytes) || ciphertext || auth_tag (16 bytes)
  face_descriptor_encrypted BYTEA NOT NULL,

  -- Model version for future compatibility
  descriptor_version VARCHAR(50) DEFAULT 'face-api-v0.22.2',

  -- Enrollment quality metrics (not sensitive, stored plaintext)
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

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_face_record_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER face_record_timestamp
  BEFORE UPDATE ON student_face_records
  FOR EACH ROW
  EXECUTE FUNCTION update_face_record_timestamp();

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

-- Teachers can read face records for assigned students (for verification API)
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

-- Service role can access all (for server-side verification)
CREATE POLICY "Service role full access"
ON student_face_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 3.2 Modify `teacher_sessions` Table

```sql
-- Migration: 017_student_face_records.sql (continued)

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

### 3.3 Audit Table (for Compliance)

```sql
-- Face verification audit log
CREATE TABLE face_verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  verification_result VARCHAR(20) NOT NULL, -- 'success', 'failed', 'no_match'
  confidence_score FLOAT,
  distance FLOAT, -- Euclidean distance
  attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  device_info JSONB,
  ip_address INET,
  -- Note: Do NOT store captured descriptors for failed attempts (privacy)
  CONSTRAINT no_descriptor_storage CHECK (true) -- Reminder
);

-- RLS for audit table
ALTER TABLE face_verification_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
ON face_verification_audit
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Service role can insert audit logs"
ON face_verification_audit
FOR INSERT
TO service_role
WITH CHECK (true);
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
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { encryptFaceDescriptor } from '@/lib/face-encryption';
import { cookies } from 'next/headers';

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
  try {
    // 1. Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validation = faceEnrollSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request',
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { studentId, faceDescriptor, qualityScore, metadata } =
      validation.data;

    // 3. Verify parent owns student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, parent_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student || student.parent_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student not found or access denied',
        },
        { status: 403 }
      );
    }

    // 4. Encrypt face descriptor
    const encryptedData = await encryptFaceDescriptor(faceDescriptor);

    // 5. Deactivate existing face record
    await supabase
      .from('student_face_records')
      .update({ is_active: false })
      .eq('student_id', studentId)
      .eq('is_active', true);

    // 6. Insert new face record
    const { data: record, error: insertError } = await supabase
      .from('student_face_records')
      .insert({
        student_id: studentId,
        face_descriptor_encrypted: encryptedData,
        quality_score: qualityScore,
        enrollment_metadata: metadata || {},
        is_active: true,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Face enrollment error:', insertError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to save face data',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recordId: record.id,
      message: 'Face enrolled successfully',
    });
  } catch (error) {
    console.error('Face enrollment error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
```

### 4.2 Face Verification API (Server-Side Matching - CRITICAL)

**Endpoint:** `POST /api/teacher-sessions/verify-face`

> **SECURITY CRITICAL**: This endpoint performs server-side face matching. The client sends the captured descriptor, and the server calculates the distance. The server NEVER trusts client-provided confidence scores.

**Request:**

```typescript
interface FaceVerifyRequest {
  studentId: string; // Claimed student ID
  capturedDescriptor: number[]; // 128 floats from client
}
```

**Response:**

```typescript
interface FaceVerifyResponse {
  success: boolean;
  matched: boolean;
  confidence: number; // Server-calculated (1 - distance)
  distance: number; // Euclidean distance
  student?: {
    id: string;
    name: string;
    grade: string;
  };
  message: string;
}
```

**Implementation:**

```typescript
// src/app/api/teacher-sessions/verify-face/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { decryptFaceDescriptor } from '@/lib/face-encryption';
import { calculateEuclideanDistance } from '@/lib/face-matching';
import { cookies } from 'next/headers';

const MATCH_THRESHOLD = 0.4; // Distance <= 0.4 = match (confidence >= 0.6)

const verifyFaceSchema = z.object({
  studentId: z.string().uuid(),
  capturedDescriptor: z.array(z.number()).length(128),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate teacher
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          matched: false,
          confidence: 0,
          distance: Infinity,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // 2. Verify user is a teacher
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        {
          success: false,
          matched: false,
          confidence: 0,
          distance: Infinity,
          message: 'Not a teacher',
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate body
    const body = await request.json();
    const validation = verifyFaceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          matched: false,
          confidence: 0,
          distance: Infinity,
          message: 'Invalid request',
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { studentId, capturedDescriptor } = validation.data;

    // 4. Verify teacher is assigned to this student
    const { data: assignment, error: assignmentError } = await supabase
      .from('students')
      .select(
        `
        id,
        first_name,
        last_name,
        grade,
        assigned_teachers
      `
      )
      .eq('id', studentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          matched: false,
          confidence: 0,
          distance: Infinity,
          message: 'Student not found',
        },
        { status: 404 }
      );
    }

    // Check if teacher is assigned
    const isAssigned = assignment.assigned_teachers?.includes(teacher.id);

    // Also check teacher_qr_codes for legacy assignments
    const { data: qrAssignment } = await supabase
      .from('teacher_qr_codes')
      .select('id')
      .eq('student_id', studentId)
      .eq('teacher_id', teacher.id)
      .eq('is_active', true)
      .single();

    if (!isAssigned && !qrAssignment) {
      return NextResponse.json(
        {
          success: false,
          matched: false,
          confidence: 0,
          distance: Infinity,
          message: 'Not assigned to this student',
        },
        { status: 403 }
      );
    }

    // 5. Fetch encrypted face record using admin client (bypasses RLS for service ops)
    const adminClient = getSupabaseAdmin();
    const { data: faceRecord, error: faceError } = await adminClient
      .from('student_face_records')
      .select('face_descriptor_encrypted')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single();

    if (faceError || !faceRecord) {
      return NextResponse.json(
        {
          success: false,
          matched: false,
          confidence: 0,
          distance: Infinity,
          message: 'No face enrolled for this student',
        },
        { status: 404 }
      );
    }

    // 6. Decrypt stored descriptor (SERVER-SIDE ONLY)
    const storedDescriptor = await decryptFaceDescriptor(
      faceRecord.face_descriptor_encrypted
    );

    // 7. Calculate Euclidean distance (SERVER-SIDE ONLY)
    const distance = calculateEuclideanDistance(
      capturedDescriptor,
      storedDescriptor
    );
    const confidence = Math.max(0, Math.min(1, 1 - distance));
    const matched = distance <= MATCH_THRESHOLD;

    // 8. Log verification attempt (audit)
    await adminClient.from('face_verification_audit').insert({
      teacher_id: teacher.id,
      student_id: studentId,
      verification_result: matched ? 'success' : 'failed',
      confidence_score: confidence,
      distance: distance,
      device_info: {
        userAgent: request.headers.get('user-agent'),
      },
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
    });

    // 9. Return result
    return NextResponse.json({
      success: true,
      matched,
      confidence,
      distance,
      student: matched
        ? {
            id: assignment.id,
            name: `${assignment.first_name} ${assignment.last_name}`,
            grade: assignment.grade,
          }
        : undefined,
      message: matched ? 'Face verified successfully' : 'Face does not match',
    });
  } catch (error) {
    console.error('Face verification error:', error);
    return NextResponse.json(
      {
        success: false,
        matched: false,
        confidence: 0,
        distance: Infinity,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
```

### 4.3 Face Check-In API (After Verification)

**Endpoint:** `POST /api/teacher-sessions/check-in-face`

> **NOTE**: This endpoint should only be called AFTER successful verification via `/verify-face`. It creates the session record.

**Request:**

```typescript
interface FaceCheckInRequest {
  studentId: string;
  action: 'check_in' | 'check_out';
  serverVerifiedConfidence: number; // Must match recent verify-face call
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

### 4.4 Get Assigned Students (for Teacher - No Descriptors Returned)

**Endpoint:** `GET /api/teacher/assigned-students`

> **SECURITY NOTE**: This endpoint does NOT return face descriptors. Descriptors are only accessed server-side during verification.

**Response:**

```typescript
interface AssignedStudentsResponse {
  students: Array<{
    id: string;
    name: string;
    grade: string;
    hasFaceEnrolled: boolean; // true/false only, no descriptor
    hasActiveSession: boolean;
  }>;
}
```

---

## 5. Encryption Service

### 5.1 Face Descriptor Encryption

```typescript
// src/lib/face-encryption.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.FACE_ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a face descriptor using AES-256-GCM
 * Returns: IV (12 bytes) || Ciphertext || AuthTag (16 bytes)
 */
export async function encryptFaceDescriptor(
  descriptor: number[]
): Promise<Buffer> {
  // Convert descriptor to buffer
  const descriptorBuffer = Buffer.from(new Float32Array(descriptor).buffer);

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(descriptorBuffer),
    cipher.final(),
  ]);

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Combine: IV || Ciphertext || AuthTag
  return Buffer.concat([iv, encrypted, authTag]);
}

/**
 * Decrypts a face descriptor from AES-256-GCM encrypted data
 */
export async function decryptFaceDescriptor(
  encryptedData: Buffer
): Promise<number[]> {
  // Extract IV, ciphertext, and auth tag
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(-AUTH_TAG_LENGTH);
  const ciphertext = encryptedData.subarray(IV_LENGTH, -AUTH_TAG_LENGTH);

  // Create decipher
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  // Convert back to number array
  const float32Array = new Float32Array(decrypted.buffer);
  return Array.from(float32Array);
}
```

### 5.2 Face Matching Utilities (Server-Side Only)

```typescript
// src/lib/face-matching.ts

/**
 * Calculates Euclidean distance between two face descriptors
 * Lower distance = more similar faces
 *
 * @param descriptor1 - First 128-dimensional descriptor
 * @param descriptor2 - Second 128-dimensional descriptor
 * @returns Euclidean distance (0 = identical, typically 0-1.4 range)
 */
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

/**
 * Converts distance to confidence score
 *
 * @param distance - Euclidean distance
 * @returns Confidence score (0-1, higher = more confident)
 */
export function distanceToConfidence(distance: number): number {
  // Distance typically ranges from 0 (perfect) to ~1.4 (different person)
  // We map this to confidence 0-1
  return Math.max(0, Math.min(1, 1 - distance));
}

/**
 * Verification thresholds
 */
export const FACE_MATCH_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.3, // Distance <= 0.3, confidence >= 70%
  MEDIUM_CONFIDENCE: 0.4, // Distance <= 0.4, confidence >= 60% (recommended)
  LOW_CONFIDENCE: 0.5, // Distance <= 0.5, confidence >= 50%
};
```

---

## 6. Component Design

### 6.1 FaceScanner Component (Shared - Detection Only)

**Location:** `src/components/shared/FaceScanner.tsx`

```typescript
interface FaceScannerProps {
  mode: 'enroll' | 'verify';
  onFaceDetected: (result: FaceDetectionResult) => void;
  onError: (error: FaceScannerError) => void;
  minQualityScore?: number; // Default: 0.7
  showDebug?: boolean;
}

interface FaceDetectionResult {
  descriptor: number[]; // 128 floats - sent to server
  boundingBox: { x: number; y: number; width: number; height: number };
  qualityScore: number;
  landmarks: any; // Face landmarks for quality check
  // NO matchedStudent - matching done server-side
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
+-- Model Loading State
|   +-- Progress indicator (0-100%)
|   +-- Cached model detection
+-- Camera Permission Handler
+-- Video Element (hidden)
+-- Canvas Overlay
|   +-- Face detection box
|   +-- Quality indicators
|   +-- Alignment guides
+-- Status Messages
|   +-- "Initializing camera..."
|   +-- "Loading face detection..."
|   +-- "Position your face in the frame"
|   +-- "Face detected! Hold still..."
|   +-- "Checking quality..."
+-- Quality Indicator
|   +-- Lighting score
|   +-- Face size score
|   +-- Alignment score
+-- Capture Button (for enrollment)
```

### 6.2 FaceEnrollment Component (Parent)

**Location:** `src/components/parent/FaceEnrollment.tsx`

```typescript
interface FaceEnrollmentProps {
  studentId: string;
  studentName: string;
  onComplete: () => void;
  onSkip?: () => void;
}
```

**Wizard Steps:**

```
Step 1: Consent & Prepare
+---------------------------------------+
|        Face Enrollment Setup           |
+---------------------------------------+
|                                        |
|  We'll capture facial features for     |
|  check-in verification. This helps:    |
|                                        |
|  - Quick touchless check-ins           |
|  - Secure identity verification        |
|  - No QR code needed                   |
|                                        |
|  Your data is encrypted and secure.    |
|  You can delete it anytime.            |
|                                        |
|  Tips for best capture:                |
|  - Find good lighting                  |
|  - Remove glasses if possible          |
|  - Face the camera directly            |
|                                        |
|        [I Agree - Start Camera]        |
|                                        |
|        [Skip - Use QR Code]            |
+---------------------------------------+

Step 2: Capture
+---------------------------------------+
|          Capturing Face                |
+---------------------------------------+
|  +-------------------------------+    |
|  |                               |    |
|  |    [Camera Viewfinder]        |    |
|  |         +-------+             |    |
|  |         |  :)   |             |    |
|  |         +-------+             |    |
|  |                               |    |
|  |    [Quality Indicators]       |    |
|  |    Lighting: Good             |    |
|  |    Position: Centered         |    |
|  |    Distance: OK               |    |
|  |                               |    |
|  +-------------------------------+    |
|                                        |
|  Quality: [========= ] 85%            |
|                                        |
|  Status: Face detected, hold still... |
|                                        |
|        [Capture Face]                  |
+---------------------------------------+

Step 3: Confirm
+---------------------------------------+
|        Confirm Face Capture            |
+---------------------------------------+
|                                        |
|  Captured for: {studentName}           |
|                                        |
|        [Captured Snapshot]             |
|             (preview)                  |
|                                        |
|  Quality Score: 87%                    |
|  Lighting: Good                        |
|  Position: Frontal                     |
|                                        |
|    [Retake]       [Confirm & Save]     |
|                                        |
+---------------------------------------+
```

### 6.3 FaceCheckIn Component (Teacher - Server Verification)

**Location:** `src/components/teacher/FaceCheckIn.tsx`

```typescript
interface FaceCheckInProps {
  teacherId: string;
  onSessionCreated: (session: TeacherSession) => void;
  onSwitchToQR: () => void;
}
```

**Verification Flow (Updated for Server-Side):**

```
Step 1: Load Assigned Students
+---------------------------------------+
|          Face Check-In                 |
+---------------------------------------+
|                                        |
|  Loading assigned students...          |
|  [========                    ]        |
|                                        |
+---------------------------------------+

Step 2: Camera Scanning
+---------------------------------------+
|          Face Check-In                 |
+---------------------------------------+
|  +-------------------------------+    |
|  |                               |    |
|  |    [Camera Viewfinder]        |    |
|  |                               |    |
|  |      Scanning for faces...    |    |
|  |                               |    |
|  +-------------------------------+    |
|                                        |
|  Assigned Students: 5                  |
|  With Face Data: 3                     |
|                                        |
|  Select a student to verify:           |
|  +-----+ +-----+ +-----+              |
|  | Ali | |Ridhwan| | Sara|             |
|  +-----+ +-----+ +-----+              |
|                                        |
|  [Switch to QR]                        |
+---------------------------------------+

Step 3: Face Detected - Select Student
+---------------------------------------+
|          Face Detected!                |
+---------------------------------------+
|  +-------------------------------+    |
|  |                               |    |
|  |    [Camera with Face Box]     |    |
|  |         +-------+             |    |
|  |         |  :)   |             |    |
|  |         +-------+             |    |
|  |                               |    |
|  +-------------------------------+    |
|                                        |
|  Who is this student?                  |
|  (Select to verify with server)        |
|                                        |
|  +-----+ +-----+ +-----+              |
|  | Ali | |Ridhwan| | Sara|             |
|  +-----+ +-----+ +-----+              |
|                                        |
|  [Cancel]                              |
+---------------------------------------+

Step 4: Server Verification
+---------------------------------------+
|          Verifying...                  |
+---------------------------------------+
|                                        |
|  Verifying face with server...         |
|  [============                ]        |
|                                        |
|  This ensures secure authentication    |
|                                        |
+---------------------------------------+

Step 5: Match Result
+---------------------------------------+
|          Student Verified!             |
+---------------------------------------+
|                                        |
|            [Student Photo]             |
|                                        |
|            Ridhwan Shaik               |
|            Grade 5                     |
|                                        |
|        Match: 94% (Server Verified)    |
|                                        |
|  +----------------+ +----------------+ |
|  |    CHECK IN    | |   CHECK OUT    | |
|  +----------------+ +----------------+ |
|                                        |
|  Current Status: Not checked in        |
|                                        |
|  [Not correct? Try different student]  |
|                                        |
+---------------------------------------+
```

---

## 7. Security Architecture

### 7.1 Server-Side Verification Flow

```
+------------------+     +------------------+     +------------------+
|  Teacher Device  |     |   API Server     |     |    Database      |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        | 1. Capture face        |                        |
        |    (local detection)   |                        |
        |                        |                        |
        | 2. Extract 128D        |                        |
        |    descriptor          |                        |
        |                        |                        |
        | 3. Select student      |                        |
        |    from list           |                        |
        |                        |                        |
        | 4. POST /verify-face   |                        |
        |    {studentId,         |                        |
        |     capturedDescriptor}|                        |
        |----------------------->|                        |
        |                        | 5. Validate auth       |
        |                        | 6. Check assignment    |
        |                        |                        |
        |                        | 7. Fetch encrypted     |
        |                        |    descriptor          |
        |                        |----------------------->|
        |                        |<-----------------------|
        |                        | 8. Decrypt descriptor  |
        |                        |    (in memory)         |
        |                        |                        |
        |                        | 9. Calculate distance  |
        |                        |    (Euclidean)         |
        |                        |                        |
        |                        | 10. Log audit entry    |
        |                        |----------------------->|
        |                        |                        |
        | 11. Response           |                        |
        |    {matched, confidence|                        |
        |     distance}          |                        |
        |<-----------------------|                        |
        |                        |                        |
        | 12. Display result     |                        |
        | 13. If matched:        |                        |
        |     Check-in/out       |                        |
        |                        |                        |
```

### 7.2 Data Protection Matrix

| Data Type          | Storage           | Encryption  | Access Control      |
| ------------------ | ----------------- | ----------- | ------------------- |
| Face Descriptor    | Server DB only    | AES-256-GCM | RLS + Service Role  |
| Captured Image     | Never stored      | N/A         | N/A                 |
| Confidence Score   | Server-calculated | N/A         | Returned to client  |
| Verification Audit | Server DB         | None        | Admin only          |
| Encryption Key     | Env variable      | N/A         | Server process only |

### 7.3 Anti-Spoofing Measures

1. **Liveness Detection** (Client-side)
   - Blink detection
   - Head movement tracking
   - Quality variance check

2. **Server-Side Verification** (Mandatory)
   - Client cannot provide confidence scores
   - All matching calculations on server
   - Audit logging of all attempts

3. **Rate Limiting**
   - Max 10 verification attempts per minute per teacher
   - Exponential backoff on failures

---

## 8. Error Handling

### 8.1 Error Codes and Messages

| Code                   | User Message                                                         | Recovery Action            |
| ---------------------- | -------------------------------------------------------------------- | -------------------------- |
| `CAMERA_DENIED`        | "Camera access denied. Please enable in browser settings."           | Show settings instructions |
| `NO_FACE`              | "No face detected. Please position yourself in the frame."           | Continue scanning          |
| `MULTIPLE_FACES`       | "Multiple faces detected. Please ensure only one person is visible." | Continue scanning          |
| `MODEL_LOAD_FAILED`    | "Face detection failed to load. Please refresh the page."            | Offer QR fallback          |
| `LOW_QUALITY`          | "Image quality too low. Please improve lighting."                    | Show quality tips          |
| `SERVER_VERIFY_FAILED` | "Server verification failed. Please try again."                      | Retry or QR fallback       |
| `NO_MATCH`             | "Face does not match enrolled data. Please try again."               | Try again or manual select |
| `NOT_ENROLLED`         | "No face data enrolled for this student."                            | Enroll first               |
| `ENROLLMENT_FAILED`    | "Failed to save face data. Please try again."                        | Retry button               |
| `RATE_LIMITED`         | "Too many attempts. Please wait a moment."                           | Wait and retry             |

### 8.2 Graceful Degradation

```typescript
const FaceCheckIn = ({ onSwitchToQR }) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!modelLoaded) {
    return (
      <LoadingState>
        <p>Loading face recognition models...</p>
        <ProgressBar progress={loadProgress} />
        <Button onClick={onSwitchToQR}>Use QR Code Instead</Button>
      </LoadingState>
    );
  }

  if (serverError) {
    return (
      <ErrorState>
        <p>{serverError}</p>
        <Button onClick={() => setServerError(null)}>Try Again</Button>
        <Button onClick={onSwitchToQR}>Use QR Code Instead</Button>
      </ErrorState>
    );
  }

  // Normal render...
};
```

---

## 9. Performance Optimization

### 9.1 Model Loading with Service Worker

```typescript
// src/lib/face-recognition.ts

let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function ensureModelsLoaded(
  onProgress?: (progress: number) => void
): Promise<void> {
  if (modelsLoaded) {
    onProgress?.(100);
    return;
  }

  if (!loadPromise) {
    loadPromise = loadAllModels(onProgress);
  }

  await loadPromise;
  modelsLoaded = true;
}

async function loadAllModels(
  onProgress?: (progress: number) => void
): Promise<void> {
  const MODEL_URL = '/models/face-api';
  const totalModels = 3;
  let loaded = 0;

  const updateProgress = () => {
    loaded++;
    onProgress?.(Math.round((loaded / totalModels) * 100));
  };

  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  updateProgress();

  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  updateProgress();

  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  updateProgress();
}

// Preload models during Teacher Dashboard load
export function preloadModelsInBackground(): void {
  ensureModelsLoaded().catch(console.error);
}
```

### 9.2 Frame Processing Optimization

```typescript
// Process every 3rd frame to reduce CPU load
const FRAME_SKIP = 3;
let frameCount = 0;

function processFrame(video: HTMLVideoElement) {
  frameCount++;
  if (frameCount % FRAME_SKIP !== 0) return null;

  return faceapi
    .detectSingleFace(
      video,
      new faceapi.SsdMobilenetv1Options({
        minConfidence: 0.5, // Skip low-confidence detections
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
}
```

### 9.3 Detection Resolution

```typescript
// Use lower resolution for detection, full for display
const DETECTION_SIZE = { width: 320, height: 240 };
const DISPLAY_SIZE = { width: 640, height: 480 };

function setupVideo(video: HTMLVideoElement) {
  // Request lower resolution for detection performance
  navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: DETECTION_SIZE.width },
      height: { ideal: DETECTION_SIZE.height },
      facingMode: 'user',
    },
  });
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (Developer Perspective)

```typescript
// __tests__/lib/face-matching.test.ts
describe('Face Matching (Server-Side)', () => {
  describe('calculateEuclideanDistance', () => {
    it('should return 0 for identical descriptors', () => {
      const descriptor = generateRandomDescriptor(128);
      const distance = calculateEuclideanDistance(descriptor, descriptor);
      expect(distance).toBe(0);
    });

    it('should return small distance for similar descriptors', () => {
      const descriptor1 = generateRandomDescriptor(128);
      const descriptor2 = addNoise(descriptor1, 0.1);
      const distance = calculateEuclideanDistance(descriptor1, descriptor2);
      expect(distance).toBeLessThan(0.4); // Should match
    });

    it('should return large distance for different descriptors', () => {
      const descriptor1 = generateRandomDescriptor(128);
      const descriptor2 = generateRandomDescriptor(128);
      const distance = calculateEuclideanDistance(descriptor1, descriptor2);
      expect(distance).toBeGreaterThan(0.4); // Should not match
    });

    it('should throw for invalid descriptor length', () => {
      const descriptor1 = generateRandomDescriptor(100);
      const descriptor2 = generateRandomDescriptor(128);
      expect(() =>
        calculateEuclideanDistance(descriptor1, descriptor2)
      ).toThrow('Descriptors must be 128-dimensional');
    });
  });
});

// __tests__/lib/face-encryption.test.ts
describe('Face Encryption', () => {
  it('should encrypt and decrypt descriptor correctly', async () => {
    const original = generateRandomDescriptor(128);
    const encrypted = await encryptFaceDescriptor(original);
    const decrypted = await decryptFaceDescriptor(encrypted);

    expect(decrypted).toHaveLength(128);
    original.forEach((val, i) => {
      expect(decrypted[i]).toBeCloseTo(val, 5);
    });
  });

  it('should produce different ciphertext for same input', async () => {
    const descriptor = generateRandomDescriptor(128);
    const encrypted1 = await encryptFaceDescriptor(descriptor);
    const encrypted2 = await encryptFaceDescriptor(descriptor);

    // Different IVs should produce different ciphertext
    expect(encrypted1.equals(encrypted2)).toBe(false);
  });
});
```

### 10.2 Integration Tests (API)

```typescript
// __tests__/api/verify-face.test.ts
describe('POST /api/teacher-sessions/verify-face', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('/api/teacher-sessions/verify-face', {
      method: 'POST',
      body: JSON.stringify({
        studentId: 'some-id',
        capturedDescriptor: generateRandomDescriptor(128),
      }),
    });

    expect(response.status).toBe(401);
  });

  it('should reject non-teacher users', async () => {
    const response = await authenticatedFetch(
      '/api/teacher-sessions/verify-face',
      {
        user: parentUser, // Not a teacher
        body: {
          studentId: 'some-id',
          capturedDescriptor: generateRandomDescriptor(128),
        },
      }
    );

    expect(response.status).toBe(403);
  });

  it('should reject requests for unassigned students', async () => {
    const response = await authenticatedFetch(
      '/api/teacher-sessions/verify-face',
      {
        user: teacherUser,
        body: {
          studentId: unassignedStudentId,
          capturedDescriptor: generateRandomDescriptor(128),
        },
      }
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Not assigned to this student');
  });

  it('should return match for valid face', async () => {
    // Setup: Enroll a face for the student
    const enrolledDescriptor = generateRandomDescriptor(128);
    await enrollFace(studentId, enrolledDescriptor);

    // Capture with slight variation (same person)
    const capturedDescriptor = addNoise(enrolledDescriptor, 0.05);

    const response = await authenticatedFetch(
      '/api/teacher-sessions/verify-face',
      {
        user: teacherUser,
        body: {
          studentId,
          capturedDescriptor,
        },
      }
    );

    expect(response.status).toBe(200);
    expect(response.body.matched).toBe(true);
    expect(response.body.confidence).toBeGreaterThan(0.6);
    expect(response.body.student.id).toBe(studentId);
  });

  it('should NOT match with different face', async () => {
    const enrolledDescriptor = generateRandomDescriptor(128);
    await enrollFace(studentId, enrolledDescriptor);

    // Completely different descriptor
    const capturedDescriptor = generateRandomDescriptor(128);

    const response = await authenticatedFetch(
      '/api/teacher-sessions/verify-face',
      {
        user: teacherUser,
        body: {
          studentId,
          capturedDescriptor,
        },
      }
    );

    expect(response.status).toBe(200);
    expect(response.body.matched).toBe(false);
    expect(response.body.confidence).toBeLessThan(0.6);
  });

  // SECURITY TEST: Verify client cannot spoof confidence
  it('should ignore any client-provided confidence values', async () => {
    const enrolledDescriptor = generateRandomDescriptor(128);
    await enrollFace(studentId, enrolledDescriptor);

    // Different face with spoofed confidence
    const differentDescriptor = generateRandomDescriptor(128);

    const response = await authenticatedFetch(
      '/api/teacher-sessions/verify-face',
      {
        user: teacherUser,
        body: {
          studentId,
          capturedDescriptor: differentDescriptor,
          confidence: 0.99, // Attacker trying to spoof
        },
      }
    );

    // Should still fail because server calculates distance
    expect(response.body.matched).toBe(false);
  });
});
```

### 10.3 E2E Tests (QA Perspective)

```typescript
// e2e/face-recognition.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Face Recognition E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock camera with test video containing a face
    await page.route('**/getUserMedia', async route => {
      // Return mock video stream
    });
  });

  test('Parent can enroll student face', async ({ page }) => {
    await page.goto('/parent/students/new');

    // Complete basic info steps...
    await page.getByRole('button', { name: 'Next' }).click();
    // ...

    // Face enrollment step
    await page.waitForSelector('text=Face Enrollment');
    await page.getByRole('button', { name: 'I Agree - Start Camera' }).click();

    // Wait for face detection
    await page.waitForSelector('text=Face detected');

    // Capture
    await page.getByRole('button', { name: 'Capture Face' }).click();

    // Confirm
    await page.waitForSelector('text=Quality Score');
    await page.getByRole('button', { name: 'Confirm & Save' }).click();

    // Verify success
    await expect(page.locator('text=Face enrolled successfully')).toBeVisible();
  });

  test('Teacher can verify and check-in student with face', async ({
    page,
  }) => {
    await page.goto('/teacher/dashboard');

    // Navigate to check-in
    await page.getByRole('button', { name: 'Check In/Out' }).click();
    await page.getByRole('tab', { name: 'Face Scan' }).click();

    // Wait for models to load
    await page.waitForSelector('text=Assigned Students');

    // Select student
    await page.getByRole('button', { name: 'Ridhwan' }).click();

    // Wait for server verification
    await page.waitForSelector('text=Verifying');
    await page.waitForSelector('text=Student Verified');

    // Check confidence is displayed
    await expect(page.locator('text=/Match: \\d+%/')).toBeVisible();

    // Check in
    await page.getByRole('button', { name: 'CHECK IN' }).click();

    // Verify success
    await expect(page.locator('text=Checked in successfully')).toBeVisible();
  });

  test('Face verification fails for wrong face', async ({ page }) => {
    // Use different mock face for this test
    await page.goto('/teacher/dashboard');

    await page.getByRole('button', { name: 'Check In/Out' }).click();
    await page.getByRole('tab', { name: 'Face Scan' }).click();

    await page.getByRole('button', { name: 'Ridhwan' }).click();

    // Should show no match
    await page.waitForSelector('text=Face does not match');

    // Check-in button should not be available
    await expect(
      page.getByRole('button', { name: 'CHECK IN' })
    ).not.toBeVisible();
  });

  test('Fallback to QR when face recognition fails', async ({ page }) => {
    // Mock model loading failure
    await page.route('**/models/face-api/**', route => route.abort());

    await page.goto('/teacher/dashboard');
    await page.getByRole('button', { name: 'Check In/Out' }).click();
    await page.getByRole('tab', { name: 'Face Scan' }).click();

    // Should show fallback option
    await page.waitForSelector('text=Face recognition unavailable');
    await page.getByRole('button', { name: 'Use QR Code Instead' }).click();

    // Should switch to QR scanner
    await expect(page.locator('text=Scan QR Code')).toBeVisible();
  });
});
```

### 10.4 Security Test Cases (QA Perspective)

| Test Case                   | Steps                                          | Expected Result                   |
| --------------------------- | ---------------------------------------------- | --------------------------------- |
| Spoofing with photo         | Hold up photo to camera                        | Liveness check fails              |
| Client confidence tampering | Modify API request to include high confidence  | Server ignores, calculates own    |
| Replay attack               | Reuse captured descriptor                      | Should still require live capture |
| Cross-parent access         | Try to verify face of unassigned student       | 403 Forbidden                     |
| Brute force                 | Send many random descriptors                   | Rate limited after 10 attempts    |
| SQL injection               | Send malformed studentId                       | Validation error, no DB access    |
| Encrypted data access       | Try to read face_descriptor_encrypted directly | Encrypted blob, unusable          |

### 10.5 Manual QA Checklist

| Scenario               | Chrome | Firefox | Safari | Mobile Chrome | Mobile Safari |
| ---------------------- | ------ | ------- | ------ | ------------- | ------------- |
| Model loading (cold)   | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Model loading (cached) | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Camera permission      | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Face detection         | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Quality indicators     | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Enrollment save        | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Server verification    | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Check-in creation      | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Real-time notification | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| QR fallback            | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |
| Offline indicator      | [ ]    | [ ]     | [ ]    | [ ]           | [ ]           |

---

## 11. Environment Variables

```bash
# Face Recognition Configuration
FACE_ENCRYPTION_KEY=<32-byte-hex-string>  # openssl rand -hex 32
FACE_MATCH_THRESHOLD=0.4                   # Distance threshold (lower = stricter)
FACE_VERIFY_RATE_LIMIT=10                  # Max attempts per minute per teacher
NEXT_PUBLIC_ENABLE_FACE_RECOGNITION=true   # Feature flag
```

---

## 12. Related Files

| File                                                | Purpose                      |
| --------------------------------------------------- | ---------------------------- |
| `docs/FACE_RECOGNITION_PRD.md`                      | Product requirements         |
| `docs/FACE_RECOGNITION_TASKS.md`                    | Implementation tasks (v2.0)  |
| `supabase/migrations/017_student_face_records.sql`  | Database migration           |
| `src/lib/face-encryption.ts`                        | Encryption service           |
| `src/lib/face-matching.ts`                          | Server-side matching         |
| `src/components/shared/FaceScanner.tsx`             | Camera & detection component |
| `src/components/parent/FaceEnrollment.tsx`          | Parent enrollment wizard     |
| `src/components/teacher/FaceCheckIn.tsx`            | Teacher verification UI      |
| `src/app/api/student/face-enroll/route.ts`          | Enrollment API               |
| `src/app/api/teacher-sessions/verify-face/route.ts` | Server verification API      |
| `public/sw.js`                                      | Service Worker for caching   |
