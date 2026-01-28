# Face Recognition Check-In/Check-Out - Product Requirements Document

## Document Information

| Field            | Value                |
| ---------------- | -------------------- |
| **Version**      | 1.0                  |
| **Status**       | Draft                |
| **Author**       | GuruKool Engineering |
| **Created**      | January 2026         |
| **Last Updated** | January 2026         |

---

## Executive Summary

This PRD outlines the implementation of a **Face Recognition-based Check-In/Check-Out** system as an alternative to the existing QR code scanning method. Parents will capture their student's facial data during profile creation, and teachers will use face recognition to verify student identity during check-in and check-out sessions.

### Business Objectives

1. **Streamline Authentication**: Eliminate need for QR code display/scanning
2. **Prevent Proxy Attendance**: Biometric verification ensures correct student identity
3. **Improve User Experience**: Faster, more intuitive check-in process
4. **Enable Offline Verification**: Local face matching without network dependency

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
- **Offline-Capable**: Local embedding comparison possible
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
┌─────────────────────────────────────────────────────────────┐
│                    Student Profile Creation                  │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Basic Info (Name, Grade, Country)                  │
│  Step 2: Academic Standards Selection                        │
│  Step 3: Teacher Assignment                                  │
│  Step 4: Face Enrollment ← NEW                              │
│          ├─ Camera Permission Request                        │
│          ├─ Face Detection (Real-time)                       │
│          ├─ Liveness Check (Blink/Turn Head)                 │
│          ├─ Capture Multiple Angles (Optional)               │
│          ├─ Preview & Confirm                                │
│          └─ Generate & Store Face Embedding                  │
│  Step 5: Complete Profile                                    │
└─────────────────────────────────────────────────────────────┘
```

**Requirements:**
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR1.1 | Camera access with user permission | P0 |
| FR1.2 | Real-time face detection overlay | P0 |
| FR1.3 | Minimum 3 face captures from different angles | P1 |
| FR1.4 | Liveness detection (blink/head turn) | P1 |
| FR1.5 | Face quality check (lighting, blur, occlusion) | P0 |
| FR1.6 | Generate 128/512-dimensional face embedding | P0 |
| FR1.7 | Encrypt face embedding at rest | P0 |
| FR1.8 | Preview captured face before confirmation | P0 |
| FR1.9 | Retake option if capture is poor | P0 |
| FR1.10 | Skip option with QR fallback | P2 |

### FR2: Face Verification (Teacher Flow)

```
Verification Flow:
┌─────────────────────────────────────────────────────────────┐
│                    Teacher Check-In Screen                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              [Camera Viewfinder]                     │   │
│  │                                                       │   │
│  │          Face Detection Box                          │   │
│  │         ┌─────────────────┐                          │   │
│  │         │    [Student]    │                          │   │
│  │         │      Face       │                          │   │
│  │         └─────────────────┘                          │   │
│  │                                                       │   │
│  │  Status: Detecting face...                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Switch to QR Scan]              [Manual Student Select]   │
└─────────────────────────────────────────────────────────────┘

On Successful Match:
┌─────────────────────────────────────────────────────────────┐
│                    Student Identified                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              [Student Photo]                                 │
│                                                              │
│              Ridhwan Shaik                                   │
│              Grade 5 • 98% Match Confidence                  │
│                                                              │
│  ┌────────────────────┐    ┌────────────────────┐           │
│  │     CHECK IN       │    │     CHECK OUT      │           │
│  └────────────────────┘    └────────────────────┘           │
│                                                              │
│  [Not the right student? Try again]                          │
└─────────────────────────────────────────────────────────────┘
```

**Requirements:**
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR2.1 | Real-time face detection from camera | P0 |
| FR2.2 | Match detected face against assigned students only | P0 |
| FR2.3 | Display match confidence percentage | P1 |
| FR2.4 | Require minimum 80% confidence for auto-match | P0 |
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
| FR3.5 | Store verification confidence score | P1 |
| FR3.6 | Capture verification photo (optional) | P2 |
| FR3.7 | Sync to timesheet_entries via existing trigger | P0 |
| FR3.8 | Real-time notification to parent | P0 |

### FR4: Face Data Management

**Requirements:**
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR4.1 | Store face embeddings encrypted (AES-256) | P0 |
| FR4.2 | Allow parent to update face data | P0 |
| FR4.3 | Allow parent to delete face data | P0 |
| FR4.4 | Retain face data audit history | P1 |
| FR4.5 | Auto-prompt face update every 6 months | P2 |
| FR4.6 | GDPR/CCPA compliance for biometric data | P0 |

---

## Non-Functional Requirements

### NFR1: Performance

| Metric                 | Target  | Measurement                              |
| ---------------------- | ------- | ---------------------------------------- |
| Face Detection Latency | < 200ms | Time from frame capture to box display   |
| Face Matching Latency  | < 500ms | Time from capture to match result        |
| Embedding Generation   | < 1s    | Time to generate embedding on enrollment |
| Camera Startup         | < 2s    | Time from component mount to video feed  |

### NFR2: Accuracy

| Metric                      | Target              | Notes                     |
| --------------------------- | ------------------- | ------------------------- |
| False Acceptance Rate (FAR) | < 0.1%              | Wrong person accepted     |
| False Rejection Rate (FRR)  | < 5%                | Correct person rejected   |
| Match Threshold             | 0.85 (configurable) | Cosine similarity minimum |

### NFR3: Security

| Requirement          | Implementation                                             |
| -------------------- | ---------------------------------------------------------- |
| Embedding Encryption | AES-256 at rest in database                                |
| Transport Security   | TLS 1.3 for all API calls                                  |
| No Raw Image Storage | Only embeddings stored, not photos (except audit captures) |
| Liveness Detection   | Prevent photo/video spoofing attacks                       |
| Data Isolation       | Face data linked to parent_id, RLS enforced                |

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

### Client-Side Processing

1. **face-api.js** (TensorFlow.js wrapper)
   - Face Detection: SSD MobileNet V1
   - Face Recognition: 128-dimensional embeddings
   - Liveness: Eye blink detection model

2. **Browser Requirements**
   - WebRTC support (getUserMedia)
   - WebGL 2.0 for TensorFlow.js acceleration
   - Minimum 4GB RAM for model loading

3. **Model Size**
   - Detection: ~6MB
   - Recognition: ~20MB
   - Liveness: ~5MB
   - Total: ~31MB (lazy-loaded)

### Server-Side Processing

1. **Embedding Storage**
   - PostgreSQL JSONB with pgvector extension (optional)
   - Or: Float array with manual cosine similarity

2. **Comparison Strategy**
   - Option A: Client compares embeddings (privacy-first)
   - Option B: Server compares embeddings (more secure)
   - Recommendation: Hybrid - client detects, server verifies

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
| pgvector extension             | Database       | DBA        | Optional  |

---

## Risks & Mitigations

| Risk                            | Probability | Impact | Mitigation                           |
| ------------------------------- | ----------- | ------ | ------------------------------------ |
| Poor lighting causes failures   | High        | Medium | Quality check UI, retry prompt       |
| Children's faces change quickly | Medium      | Medium | 6-month re-enrollment prompt         |
| Photo spoofing attacks          | Low         | High   | Liveness detection requirement       |
| Model loading too slow          | Medium      | Medium | Lazy loading, progress indicator     |
| Privacy concerns from parents   | Medium      | High   | Clear consent, data deletion option  |
| Browser compatibility issues    | Low         | Medium | Feature detection, graceful fallback |

---

## Open Questions

1. **Q**: Should face data be stored on-device only (more private) or server (more secure)?
   - **Recommendation**: Server with encryption, enables cross-device use

2. **Q**: What happens if multiple students have similar faces (siblings)?
   - **Recommendation**: Teacher confirms from shortlist of top matches

3. **Q**: Should we capture audit photos on every check-in?
   - **Recommendation**: Optional, configurable per organization

4. **Q**: How long to retain face embeddings after student deactivation?
   - **Recommendation**: 30 days, then auto-delete

---

## Appendix

### A. Glossary

| Term               | Definition                                                     |
| ------------------ | -------------------------------------------------------------- |
| Face Embedding     | 128/512-dimensional vector representing unique facial features |
| Cosine Similarity  | Measure of similarity between two vectors (0-1 scale)          |
| Liveness Detection | Verification that a real person is present, not a photo        |
| FAR                | False Acceptance Rate - wrong person incorrectly verified      |
| FRR                | False Rejection Rate - correct person incorrectly rejected     |

### B. Related Documents

- [FACE_RECOGNITION_DESIGN.md](./FACE_RECOGNITION_DESIGN.md) - Technical Design
- [FACE_RECOGNITION_TASKS.md](./FACE_RECOGNITION_TASKS.md) - Implementation Tasks
- [FACE_RECOGNITION_IMPLEMENTATION.md](./FACE_RECOGNITION_IMPLEMENTATION.md) - Implementation Guide

### C. References

- face-api.js: https://github.com/justadudewhohacks/face-api.js
- TensorFlow.js: https://www.tensorflow.org/js
- GDPR Biometric Data: Article 9 Special Categories
- CCPA Biometric Information: Section 1798.140(b)
