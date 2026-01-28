# Face Recognition Check-In/Check-Out - Product Requirements Document

## Document Information

| Field            | Value                                           |
| ---------------- | ----------------------------------------------- |
| **Version**      | 2.0                                             |
| **Status**       | Approved                                        |
| **Author**       | GuruKool Engineering                            |
| **Created**      | January 2026                                    |
| **Last Updated** | January 2026                                    |
| **Security Rev** | Server-Side Verification (Critical Update v2.0) |

---

## Executive Summary

This PRD outlines the implementation of a **Face Recognition-based Check-In/Check-Out** system as an alternative to the existing QR code scanning method. Parents will capture their student's facial data during profile creation, and teachers will use face recognition to verify student identity during check-in and check-out sessions.

> **SECURITY UPDATE (v2.0)**: Following security review, verification logic has been moved to **Server-Side** to prevent spoofing attacks. The client captures and sends face descriptors; the server performs all verification calculations.

### Business Objectives

1. **Streamline Authentication**: Eliminate need for QR code display/scanning
2. **Prevent Proxy Attendance**: Biometric verification ensures correct student identity
3. **Improve User Experience**: Faster, more intuitive check-in process
4. **Enable Secure Verification**: Server-side matching prevents client-side tampering

---

## Problem Statement

### Current QR Code Flow Limitations

| Issue                        | Impact                                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| **Parent Dependency**        | Parent must be present with device to display QR code            |
| **Screen Quality Issues**    | QR scanning fails with low brightness, cracked screens, or glare |
| **Network Dependency**       | QR generation requires real-time server communication            |
| **No Identity Verification** | Any device with the QR code can initiate check-in                |
| **Multiple Device Handling** | Parents with multiple students need to switch QR codes           |

### Face Recognition Advantages

- **Student-Centric**: Verify the actual student, not a proxy device
- **Touchless**: No physical contact or device exchange required
- **Faster**: Sub-second recognition vs multi-second QR scan alignment
- **Tamper-Proof**: Server-side verification prevents spoofing
- **Audit Trail**: Face captures provide visual verification record

---

## User Stories

### Parent User Stories

| ID  | Story                                                                                                    | Acceptance Criteria                                                      |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| P1  | As a parent, I want to capture my student's face during profile creation so teachers can verify identity | Face capture UI during student onboarding with preview and retake option |
| P2  | As a parent, I want to update my student's face data as they grow                                        | Edit profile page with "Update Face Data" option                         |
| P3  | As a parent, I want to see face recognition check-in notifications                                       | Real-time notification when teacher checks in student via face           |
| P4  | As a parent, I want to view face capture history for security                                            | Audit log showing when face data was captured/updated                    |
| P5  | As a parent, I want to fallback to QR if face recognition fails                                          | Option to switch to QR code during failed face attempts                  |

### Teacher User Stories

| ID  | Story                                                                        | Acceptance Criteria                                           |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| T1  | As a teacher, I want to check in students using face recognition             | Camera opens, detects face, matches against enrolled students |
| T2  | As a teacher, I want confirmation of student identity before check-in        | Show student name/photo after match, require confirmation     |
| T3  | As a teacher, I want to check out students using face recognition            | Same flow as check-in with session end action                 |
| T4  | As a teacher, I want to see my assigned students' faces for manual selection | Grid of enrolled students if face match fails                 |
| T5  | As a teacher, I want offline face recognition in poor connectivity           | Local face matching with sync when online                     |
| T6  | As a teacher, I want to add session notes after face check-in                | Notes input after successful face verification                |

### Admin User Stories

| ID  | Story                                                                   | Acceptance Criteria                              |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| A1  | As an admin, I want to configure face recognition sensitivity           | Admin settings for match threshold (0.6-0.9)     |
| A2  | As an admin, I want to view face recognition audit logs                 | Dashboard showing all face verification attempts |
| A3  | As an admin, I want to enable/disable face recognition per organization | Feature flag for gradual rollout                 |

---

## Functional Requirements

### FR1: Face Enrollment (Parent Flow)

```
Enrollment Flow:
+-------------------------------------------------------------+
|                    Student Profile Creation                  |
+-------------------------------------------------------------+
|  Step 1: Basic Info (Name, Grade, Country)                  |
|  Step 2: Academic Standards Selection                        |
|  Step 3: Teacher Assignment                                  |
|  Step 4: Face Enrollment <- NEW                              |
|          +- Camera Permission Request                        |
|          +- Face Detection (Real-time)                       |
|          +- Liveness Check (Blink/Turn Head)                 |
|          +- Capture Multiple Angles (Optional)               |
|          +- Preview & Confirm                                |
|          +- Generate Face Embedding (Client)                 |
|          +- Encrypt & Store on Server                        |
|  Step 5: Complete Profile                                    |
+-------------------------------------------------------------+
```

**Requirements:**
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR1.1 | Camera access with user permission | P0 |
| FR1.2 | Real-time face detection overlay | P0 |
| FR1.3 | Minimum 3 face captures from different angles | P1 |
| FR1.4 | Liveness detection (blink/head turn) | P1 |
| FR1.5 | Face quality check (lighting, blur, occlusion) | P0 |
| FR1.6 | Generate 128-dimensional face embedding | P0 |
| FR1.7 | **Encrypt face embedding at rest (AES-256-GCM)** | P0 |
| FR1.8 | Preview captured face before confirmation | P0 |
| FR1.9 | Retake option if capture is poor | P0 |
| FR1.10 | Skip option with QR fallback | P2 |

### FR2: Face Verification (Teacher Flow)

```
Verification Flow (Server-Side):
+-------------------------------------------------------------+
|                    Teacher Check-In Screen                   |
+-------------------------------------------------------------+
|  +------------------------------------------------------+   |
|  |              [Camera Viewfinder]                     |   |
|  |                                                       |   |
|  |          Face Detection Box                          |   |
|  |         +-----------------+                          |   |
|  |         |    [Student]    |                          |   |
|  |         |      Face       |                          |   |
|  |         +-----------------+                          |   |
|  |                                                       |   |
|  |  Status: Detecting face...                           |   |
|  +------------------------------------------------------+   |
|                                                              |
|  [Switch to QR Scan]              [Manual Student Select]   |
+-------------------------------------------------------------+

Verification Process (SECURITY UPDATE v2.0):
1. Client captures face descriptor (128 floats)
2. Client sends descriptor + claimed studentId to server
3. Server fetches encrypted stored descriptor
4. Server decrypts stored descriptor
5. Server calculates Euclidean distance
6. Server returns match result (confidence score)
7. Client displays result for teacher confirmation

On Successful Match:
+-------------------------------------------------------------+
|                    Student Identified                        |
+-------------------------------------------------------------+
|                                                              |
|              [Student Photo]                                 |
|                                                              |
|              Ridhwan Shaik                                   |
|              Grade 5 - 98% Match Confidence                  |
|              (Server Verified)                               |
|                                                              |
|  +--------------------+    +--------------------+           |
|  |     CHECK IN       |    |     CHECK OUT      |           |
|  +--------------------+    +--------------------+           |
|                                                              |
|  [Not the right student? Try again]                          |
+-------------------------------------------------------------+
```

**Requirements:**
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR2.1 | Real-time face detection from camera | P0 |
| FR2.2 | **Server-side matching (NOT client-side)** | P0 |
| FR2.3 | Display server-calculated confidence percentage | P1 |
| FR2.4 | Require minimum 60% confidence (distance <= 0.4) for auto-match | P0 |
| FR2.5 | Show matched student name and photo | P0 |
| FR2.6 | Check-in/Check-out action buttons | P0 |
| FR2.7 | Fallback to QR scan option | P0 |
| FR2.8 | Manual student selection grid | P1 |
| FR2.9 | Session notes input after action | P2 |
| FR2.10 | Capture verification photo for audit | P1 |

### FR3: Session Management

**Requirements:**
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR3.1 | Create teacher_sessions record on check-in | P0 |
| FR3.2 | Update session with check-out time | P0 |
| FR3.3 | Calculate session duration automatically | P0 |
| FR3.4 | Record verification_method: 'face_recognition' | P0 |
| FR3.5 | Store server-calculated confidence score | P1 |
| FR3.6 | Capture verification photo (optional) | P2 |
| FR3.7 | Sync to timesheet_entries via existing trigger | P0 |
| FR3.8 | Real-time notification to parent | P0 |

### FR4: Face Data Management

**Requirements:**
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR4.1 | **Store face embeddings encrypted (AES-256-GCM)** | P0 |
| FR4.2 | Allow parent to update face data | P0 |
| FR4.3 | Allow parent to delete face data | P0 |
| FR4.4 | Retain face data audit history | P1 |
| FR4.5 | Auto-prompt face update every 6 months | P2 |
| FR4.6 | GDPR/CCPA compliance for biometric data | P0 |

---

## Non-Functional Requirements

### NFR1: Performance

| Metric                         | Target  | Measurement                               |
| ------------------------------ | ------- | ----------------------------------------- |
| Face Detection Latency         | < 200ms | Time from frame capture to box display    |
| **Server Verification**        | < 500ms | Time from descriptor send to match result |
| Embedding Generation           | < 1s    | Time to generate embedding on enrollment  |
| Camera Startup                 | < 2s    | Time from component mount to video feed   |
| **Model Loading (with cache)** | < 3s    | Cached models via Service Worker          |

### NFR2: Accuracy

| Metric                      | Target          | Notes                               |
| --------------------------- | --------------- | ----------------------------------- |
| False Acceptance Rate (FAR) | < 0.1%          | Wrong person accepted               |
| False Rejection Rate (FRR)  | < 5%            | Correct person rejected             |
| **Match Threshold**         | Distance <= 0.4 | Euclidean distance (server-side)    |
| Confidence Display          | 1 - distance    | Converted for user-friendly display |

### NFR3: Security

| Requirement                  | Implementation                                             |
| ---------------------------- | ---------------------------------------------------------- |
| **Server-Side Verification** | All confidence calculations performed on server            |
| **Embedding Encryption**     | AES-256-GCM at rest, decrypted only during verification    |
| Transport Security           | TLS 1.3 for all API calls                                  |
| No Raw Image Storage         | Only embeddings stored, not photos (except audit captures) |
| Liveness Detection           | Prevent photo/video spoofing attacks                       |
| Data Isolation               | Face data linked to parent_id, RLS enforced                |
| **No Client Trust**          | Server NEVER trusts client-provided confidence scores      |

### NFR4: Privacy & Compliance

| Requirement        | Details                                |
| ------------------ | -------------------------------------- |
| Consent Collection | Explicit opt-in during enrollment      |
| Data Minimization  | Store only necessary embedding data    |
| Right to Deletion  | Parent can delete all face data        |
| Data Portability   | Export face data on request            |
| Retention Limit    | Auto-delete after student deactivation |

### NFR5: Accessibility

| Requirement           | Implementation                             |
| --------------------- | ------------------------------------------ |
| Screen Reader Support | Audio cues for face positioning            |
| High Contrast Mode    | Visible face detection box in all lighting |
| Alternative Method    | QR code fallback always available          |

---

## Technical Constraints

### Client-Side Processing (Detection Only)

1. **face-api.js** (TensorFlow.js wrapper)
   - Face Detection: SSD MobileNet V1
   - Face Recognition: 128-dimensional embeddings
   - Liveness: Eye blink detection model

2. **Browser Requirements**
   - WebRTC support (getUserMedia)
   - WebGL 2.0 for TensorFlow.js acceleration
   - Minimum 4GB RAM for model loading

3. **Model Size & Caching**
   - Detection: ~6MB
   - Recognition: ~20MB
   - Liveness: ~5MB
   - Total: ~31MB (lazy-loaded)
   - **Service Worker caching for offline access**
   - **IndexedDB storage for model artifacts**

### Server-Side Processing (Verification - CRITICAL)

> **SECURITY REQUIREMENT**: The server MUST perform all verification logic. The client MUST NOT be trusted to provide confidence scores.

1. **Embedding Storage**
   - **Preferred**: PostgreSQL with `pgvector` extension (`vector(128)` type)
   - **Fallback**: Encrypted JSONB (AES-256-GCM)

2. **Verification Strategy (MANDATORY)**
   - Client captures face descriptor
   - Client sends descriptor + studentId to server
   - Server fetches and decrypts stored descriptor
   - **Server calculates Euclidean distance**
   - Server returns match result
   - Client displays result for user confirmation

3. **Encryption Strategy**
   - Face descriptors encrypted at rest using AES-256-GCM
   - Encryption key managed via environment variable
   - Decryption only during verification (in-memory)
   - No plaintext descriptors in logs or responses

---

## Success Metrics

### Adoption Metrics

| Metric                              | Target (6 months) |
| ----------------------------------- | ----------------- |
| Parents enabling face recognition   | 60%               |
| Teachers using face check-in        | 50%               |
| Successful face matches per attempt | 90%               |

### Operational Metrics

| Metric                              | Target             |
| ----------------------------------- | ------------------ |
| Average check-in time reduction     | 40% faster than QR |
| Support tickets for check-in issues | 30% reduction      |
| Face recognition-related errors     | < 2% of sessions   |

### Security Metrics

| Metric                       | Target |
| ---------------------------- | ------ |
| Spoofing attempts blocked    | 100%   |
| Unauthorized access attempts | 0      |
| Successful security audits   | 100%   |

### User Satisfaction

| Metric                                | Target     |
| ------------------------------------- | ---------- |
| Parent satisfaction (face enrollment) | 4.0/5.0    |
| Teacher satisfaction (face check-in)  | 4.2/5.0    |
| NPS improvement                       | +10 points |

---

## Rollout Strategy

### Phase 1: Beta (Week 1-2)

- Feature flag: `ENABLE_FACE_RECOGNITION=true`
- Limited to 10% of users
- Collect feedback and error rates
- **Security testing and penetration testing**

### Phase 2: Gradual Rollout (Week 3-4)

- Expand to 50% of users
- Monitor performance metrics
- Tune match threshold if needed

### Phase 3: General Availability (Week 5+)

- Enable for all users
- QR code remains as fallback
- Marketing communication

---

## Dependencies

| Dependency                     | Type           | Owner      | Status    |
| ------------------------------ | -------------- | ---------- | --------- |
| face-api.js library            | External       | TensorFlow | Stable    |
| WebRTC browser support         | Platform       | Browsers   | Available |
| Supabase Storage (model files) | Infrastructure | DevOps     | Required  |
| GDPR consent flow              | Legal          | Legal Team | Required  |
| **pgvector extension**         | Database       | DBA        | Preferred |
| **AES-256-GCM encryption**     | Security       | Backend    | Required  |

---

## Risks & Mitigations

| Risk                            | Probability | Impact   | Mitigation                                 |
| ------------------------------- | ----------- | -------- | ------------------------------------------ |
| Poor lighting causes failures   | High        | Medium   | Quality check UI, retry prompt             |
| Children's faces change quickly | Medium      | Medium   | 6-month re-enrollment prompt               |
| Photo spoofing attacks          | Low         | High     | Liveness detection + server verification   |
| Model loading too slow          | Medium      | Medium   | Service Worker caching, progress indicator |
| Privacy concerns from parents   | Medium      | High     | Clear consent, data deletion option        |
| Browser compatibility issues    | Low         | Medium   | Feature detection, graceful fallback       |
| **Client-side tampering**       | Medium      | Critical | **Server-side verification (mandatory)**   |

---

## Open Questions

1. **Q**: Should face data be stored on-device only (more private) or server (more secure)?
   - **Decision**: Server with encryption, enables cross-device use and secure verification

2. **Q**: What happens if multiple students have similar faces (siblings)?
   - **Recommendation**: Teacher confirms from shortlist of top matches (server returns top 3)

3. **Q**: Should we capture audit photos on every check-in?
   - **Recommendation**: Optional, configurable per organization

4. **Q**: How long to retain face embeddings after student deactivation?
   - **Recommendation**: 30 days, then auto-delete

5. **Q**: Should verification happen client-side or server-side?
   - **Decision**: **Server-side ONLY** - Critical security requirement

---

## Appendix

### A. Glossary

| Term                     | Definition                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| Face Embedding           | 128-dimensional vector representing unique facial features       |
| Euclidean Distance       | Measure of similarity between two vectors (lower = more similar) |
| Liveness Detection       | Verification that a real person is present, not a photo          |
| FAR                      | False Acceptance Rate - wrong person incorrectly verified        |
| FRR                      | False Rejection Rate - correct person incorrectly rejected       |
| Server-Side Verification | All matching logic runs on server, not client                    |

### B. Security Architecture

```
+-------------------+     +-------------------+     +-------------------+
|   Client Device   |     |   API Server      |     |   Database        |
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
| 1. Capture face   |     |                   |     |                   |
| 2. Extract 128D   |     |                   |     |                   |
|    descriptor     |     |                   |     |                   |
| 3. Send to server |---->| 4. Receive req    |     |                   |
|    (descriptor +  |     | 5. Validate auth  |     |                   |
|    studentId)     |     | 6. Fetch stored   |---->| 7. Return         |
|                   |     |    descriptor     |<----| encrypted data    |
|                   |     | 8. Decrypt        |     |                   |
|                   |     | 9. Calculate      |     |                   |
|                   |     |    distance       |     |                   |
|                   |     | 10. Return result |     |                   |
| 11. Display       |<----|    (match/no)     |     |                   |
|     confirmation  |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+

CRITICAL: Steps 8-10 MUST happen on server.
          Client NEVER calculates confidence.
```

### C. Related Documents

- [FACE_RECOGNITION_DESIGN.md](./FACE_RECOGNITION_DESIGN.md) - Technical Design (v2.0)
- [FACE_RECOGNITION_TASKS.md](./FACE_RECOGNITION_TASKS.md) - Implementation Tasks (v2.0)
- [FACE_RECOGNITION_IMPLEMENTATION.md](./FACE_RECOGNITION_IMPLEMENTATION.md) - Implementation Guide

### D. References

- face-api.js: https://github.com/justadudewhohacks/face-api.js
- TensorFlow.js: https://www.tensorflow.org/js
- GDPR Biometric Data: Article 9 Special Categories
- CCPA Biometric Information: Section 1798.140(b)
- pgvector: https://github.com/pgvector/pgvector
