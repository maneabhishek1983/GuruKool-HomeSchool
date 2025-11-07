# API Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:3000/api` (development)
**Authentication:** Bearer token in `Authorization` header

---

## Table of Contents

1. [Authentication](#authentication)
2. [Students API](#students-api)
3. [Teachers API](#teachers-api)
4. [Sessions API](#sessions-api)
5. [System APIs](#system-apis)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

All protected endpoints require authentication using a Bearer token from Supabase Auth.

### Headers

```http
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

### Getting a Token

```bash
# Login via Supabase Auth
POST https://miqhtpbutevdrkyndflf.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "parent@test.com",
  "password": "password123"
}

# Response includes access_token
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

## Students API

### List Students

Get all students for the authenticated parent.

```http
GET /api/students?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "age": 10,
      "country": "UK",
      "grade": "Year 5",
      "learningStyle": "Visual",
      "specialNeeds": null,
      "interests": "Math, Science",
      "parent_id": "uuid",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Rate Limit:** 100 requests/minute

---

### Get Single Student

```http
GET /api/students/{id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    ...
  }
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Student not found

---

### Create Student

```http
POST /api/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "age": 8,
  "country": "UK",
  "grade": "Year 3",
  "learningStyle": "Kinesthetic",
  "specialNeeds": "ADHD",
  "interests": "Art, Music",
  "birthDate": "2017-03-15T00:00:00Z"
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `age`: Required, integer, 3-18
- `country`: Required, enum: `UK`, `US`, `INDIA`
- `grade`: Required, 1-50 characters
- `learningStyle`: Optional, max 500 characters
- `specialNeeds`: Optional, max 1000 characters
- `interests`: Optional, max 1000 characters
- `birthDate`: Optional, ISO 8601 datetime

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Smith",
    "age": 8,
    "country": "UK",
    "grade": "Year 3",
    "parent_id": "uuid",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  "message": "Student created successfully"
}
```

**Errors:**
- `400` - Validation failed
- `401` - Unauthorized
- `500` - Internal server error

**Rate Limit:** 20 creates/minute

---

### Update Student

```http
PUT /api/students/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "age": 9,
  "grade": "Year 4",
  "teacherNotes": "Excellent progress in reading"
}
```

**Validation:** All fields optional, same rules as create

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Smith Updated",
    ...
  },
  "message": "Student updated successfully"
}
```

**Rate Limit:** 50 updates/minute

---

### Delete Student

```http
DELETE /api/students/{id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

**Rate Limit:** 20 deletes/minute

---

## Teachers API

### List Teachers

```http
GET /api/teachers?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ms. Johnson",
      "email": "johnson@example.com",
      "phone": "+447700900123",
      "subjects": ["Mathematics", "Science"],
      "experience": 5,
      "qualifications": ["BSc Mathematics", "PGCE"],
      "hourlyRate": 45.00,
      "bio": "Experienced math and science tutor",
      "parent_id": "uuid",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

**Rate Limit:** 100 requests/minute

---

### Get Single Teacher

```http
GET /api/teachers/{id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ms. Johnson",
    ...
  }
}
```

---

### Create Teacher

```http
POST /api/teachers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mr. Smith",
  "email": "smith@example.com",
  "phone": "+447700900456",
  "subjects": ["English", "History"],
  "experience": 10,
  "qualifications": ["BA English Literature", "MA History", "PGCE"],
  "hourlyRate": 50.00,
  "bio": "Specializes in English literature and history"
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `email`: Required, valid email format
- `phone`: Optional, international format (+countrycode number)
- `subjects`: Required array, 1-20 items, each 1-100 chars
- `experience`: Required, integer, 0-50 years
- `qualifications`: Required array, max 10 items, each max 200 chars
- `hourlyRate`: Required, number, 0-1000
- `bio`: Optional, max 2000 characters

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mr. Smith",
    "email": "smith@example.com",
    ...
  },
  "message": "Teacher created successfully"
}
```

**Rate Limit:** 10 creates/minute

---

### Update Teacher

```http
PUT /api/teachers/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "hourlyRate": 55.00,
  "bio": "Updated bio with more experience"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "hourlyRate": 55.00,
    ...
  },
  "message": "Teacher updated successfully"
}
```

**Rate Limit:** 50 updates/minute

---

## Sessions API

### List Sessions

Get sessions with filtering and pagination.

```http
GET /api/sessions?page=1&limit=20&studentId=uuid&status=scheduled
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `studentId`: Filter by student (optional)
- `teacherId`: Filter by teacher (optional)
- `status`: Filter by status (optional): `scheduled`, `in-progress`, `completed`, `cancelled`
- `startDate`: Filter from date (ISO 8601) (optional)
- `endDate`: Filter to date (ISO 8601) (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "teacher_id": "uuid",
      "parent_id": "uuid",
      "subject": "Mathematics",
      "scheduled_start": "2025-01-20T10:00:00Z",
      "scheduled_end": "2025-01-20T11:00:00Z",
      "actual_start": null,
      "actual_end": null,
      "location": {
        "address": "Living Room",
        "coordinates": {
          "latitude": 51.5074,
          "longitude": -0.1278
        },
        "verified": true
      },
      "status": "scheduled",
      "notes": "Focus on algebra",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

**Rate Limit:** 100 requests/minute

---

### Get Single Session

```http
GET /api/sessions/{id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    ...
  }
}
```

---

### Create Session

```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "uuid",
  "teacherId": "uuid",
  "parentId": "uuid",
  "subject": "Mathematics",
  "scheduledStart": "2025-01-20T10:00:00Z",
  "scheduledEnd": "2025-01-20T11:00:00Z",
  "location": {
    "address": "Home - Living Room",
    "coordinates": {
      "latitude": 51.5074,
      "longitude": -0.1278
    },
    "verified": false
  },
  "notes": "Cover quadratic equations"
}
```

**Validation Rules:**
- `studentId`: Required, UUID
- `teacherId`: Required, UUID
- `parentId`: Required, UUID
- `subject`: Required, 1-100 characters
- `scheduledStart`: Required, ISO 8601 datetime
- `scheduledEnd`: Required, ISO 8601 datetime
- `location`: Optional, string (address) or object with address/coordinates
- `notes`: Optional, max 5000 characters

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "uuid",
    "status": "scheduled",
    ...
  },
  "message": "Session created successfully"
}
```

**Errors:**
- `403` - Student does not belong to authenticated parent

**Rate Limit:** 30 creates/minute

---

### Update Session

```http
PUT /api/sessions/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "actualStart": "2025-01-20T10:05:00Z",
  "actualEnd": "2025-01-20T11:10:00Z",
  "status": "completed",
  "notes": "Covered quadratic equations. Student showed good progress."
}
```

**Validation:** All fields optional, same rules as create plus:
- `actualStart`: Optional, ISO 8601 datetime
- `actualEnd`: Optional, ISO 8601 datetime
- `status`: Optional, enum: `scheduled`, `in-progress`, `completed`, `cancelled`, `rescheduled`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    ...
  },
  "message": "Session updated successfully"
}
```

**Rate Limit:** 50 updates/minute

---

### Delete Session

```http
DELETE /api/sessions/{id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Rate Limit:** 20 deletes/minute

---

## System APIs

### Health Check

```http
GET /api/health
```

**No authentication required**

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "version": "0.1.0",
  "environment": "development",
  "uptime": 3600.5,
  "memory": {
    "rss": 628228096,
    "heapTotal": 373268480,
    "heapUsed": 338283472,
    "external": 240025251,
    "arrayBuffers": 233559838
  },
  "checks": {
    "supabase": {
      "ok": true,
      "latencyMs": 45
    }
  }
}
```

---

### Metrics

```http
GET /api/metrics
```

**No authentication required**

**Response (200 OK) - Prometheus format:**
```
# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="v22.14.0"} 1

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds 193.71

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 224
http_requests_total{method="POST",status="200"} 416
```

---

### Contact Admin

```http
POST /api/contact-admin
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+447700900123",
  "organization": "ABC School",
  "message": "Interested in a demo of the platform",
  "requestType": "demo"
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `email`: Required, valid email
- `phone`: Optional, international format
- `organization`: Optional, max 200 characters
- `message`: Required, 10-2000 characters
- `requestType`: Optional, enum: `demo`, `support`, `partnership`, `feedback`, `other`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact request submitted successfully",
  "contactId": "contact-1234567890",
  "estimatedResponseTime": "24-48 hours"
}
```

**Rate Limit:** 5 requests/hour

---

## Error Codes

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": ["Validation error message"]
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### Common Errors

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_REQUIRED` | 401 | No authorization header provided |
| `AUTH_INVALID` | 401 | Invalid or expired token |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 403 | User not authorized for this resource |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `DB_ERROR` | 500 | Database operation failed |

---

## Rate Limiting

### Per-Endpoint Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /api/students` | 100 | 1 minute |
| `POST /api/students` | 20 | 1 minute |
| `PUT /api/students/{id}` | 50 | 1 minute |
| `DELETE /api/students/{id}` | 20 | 1 minute |
| `GET /api/teachers` | 100 | 1 minute |
| `POST /api/teachers` | 10 | 1 minute |
| `PUT /api/teachers/{id}` | 50 | 1 minute |
| `GET /api/sessions` | 100 | 1 minute |
| `POST /api/sessions` | 30 | 1 minute |
| `PUT /api/sessions/{id}` | 50 | 1 minute |
| `DELETE /api/sessions/{id}` | 20 | 1 minute |
| `POST /api/contact-admin` | 5 | 1 hour |

### Rate Limit Headers

Responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

### 429 Response

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## Example Usage

### JavaScript/TypeScript

```typescript
const API_URL = 'http://localhost:3000/api';
const token = 'your_supabase_jwt_token';

// Fetch students
const response = await fetch(`${API_URL}/students?page=1&limit=10`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data); // Array of students
```

### Create Student

```typescript
const response = await fetch(`${API_URL}/students`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Alice Johnson',
    age: 12,
    country: 'UK',
    grade: 'Year 7',
    learningStyle: 'Visual',
    interests: 'Science, Mathematics'
  })
});

const result = await response.json();
console.log(result.data); // Created student
```

### Update Session

```typescript
const sessionId = 'abc-123-def';
const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'completed',
    actualStart: '2025-01-20T10:05:00Z',
    actualEnd: '2025-01-20T11:10:00Z',
    notes: 'Excellent session! Student grasped concepts quickly.'
  })
});

const result = await response.json();
```

---

## Testing with cURL

### Get Students

```bash
curl -X GET "http://localhost:3000/api/students?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Student

```bash
curl -X POST "http://localhost:3000/api/students" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "age": 10,
    "country": "UK",
    "grade": "Year 5"
  }'
```

### Create Session

```bash
curl -X POST "http://localhost:3000/api/sessions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-uuid",
    "teacherId": "teacher-uuid",
    "parentId": "parent-uuid",
    "subject": "Mathematics",
    "scheduledStart": "2025-01-20T10:00:00Z",
    "scheduledEnd": "2025-01-20T11:00:00Z",
    "notes": "Algebra practice"
  }'
```

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Never expose service role key** - use anon key for client apps
3. **Validate all input** - Zod schemas handle this automatically
4. **Handle rate limits** - implement exponential backoff
5. **Store tokens securely** - use httpOnly cookies or secure storage
6. **Refresh tokens** - handle 401 errors and refresh expired tokens
7. **Log API usage** - monitor for suspicious activity

---

**Last Updated:** 2025-10-13
**API Version:** 1.0.0
**Maintained by:** GuruKool HomeSchool Team

For issues or questions, contact: abhishekumane@gmail.com
