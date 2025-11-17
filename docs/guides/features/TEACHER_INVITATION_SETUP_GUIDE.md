# Teacher Invitation System - Setup Guide

## 🎯 Overview

This guide will help you set up the complete Teacher Invitation Flow, which allows:

1. **Parents** to create teacher profiles without passwords
2. **System** to automatically send secure invitation links
3. **Teachers** to set their own passwords via invitation link
4. **Teachers** to log in and use the platform

---

## 🔴 Prerequisites

Before starting, ensure you have:

- ✅ Supabase project created and configured
- ✅ Environment variables set in `.env` file
- ✅ Admin access to Supabase Dashboard
- ✅ Local development server (`npm run dev`)

---

## 📋 Step-by-Step Setup

### Step 1: Apply Migration 010 (Fix Teachers RLS)

**Problem**: Parents cannot create teachers due to missing RLS policies

**Solution**: Apply migration 010

1. Open Supabase Dashboard → SQL Editor
2. Open file: `supabase/migrations/010_fix_teachers_rls_insert_policy.sql`
3. Copy all SQL and paste into SQL Editor
4. Click "Run"
5. Verify success: ✅ "Success. No rows returned"

**What this does**:

- Adds INSERT policy for parents
- Adds SELECT, UPDATE, DELETE policies
- Allows parents to manage their own teachers

---

### Step 2: Apply Migration 011 (Invitation Tokens Table)

**Purpose**: Create database table to store invitation tokens

1. Open Supabase Dashboard → SQL Editor
2. Open file: `supabase/migrations/011_teacher_invitation_tokens.sql`
3. Copy all SQL and paste into SQL Editor
4. Click "Run"
5. Verify success: ✅ "Success. No rows returned"

**What this does**:

- Creates `invitation_tokens` table
- Adds RLS policies for secure access
- Creates indexes for performance
- Adds cleanup function for expired tokens

**Verify table created**:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'invitation_tokens'
ORDER BY ordinal_position;
```

Expected columns:

- `id` (uuid)
- `token` (varchar)
- `teacher_id` (uuid)
- `parent_id` (uuid)
- `email` (varchar)
- `status` (varchar)
- `expires_at` (timestamp)
- `accepted_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

### Step 3: Verify Code Implementation

All code has been implemented. Verify files exist:

**✅ Service Layer**:

- `src/services/invitation.service.ts` - Invitation token management

**✅ API Endpoints**:

- `src/app/api/invitations/send/route.ts` - Send invitations
- `src/app/api/invitations/accept/route.ts` - Accept invitations
- `src/app/api/teachers/route.ts` - Updated to auto-send invitations

**✅ Frontend**:

- `src/app/accept-invitation/page.tsx` - Invitation acceptance UI

---

### Step 4: Test Teacher Creation (Fixes RLS Error)

Now test that parents can create teachers:

1. **Start dev server** (if not running):

   ```bash
   npm run dev
   ```

2. **Login as parent** in your app

3. **Create a teacher profile**:
   - Navigate to "Add Teacher" page
   - Fill in teacher details:
     - Name: Test Teacher
     - Email: teacher@example.com
     - Subjects: Math, Science
     - Experience: 5 years
     - Hourly Rate: $50
   - Click "Create Teacher"

4. **Expected Result**: ✅ Success! Teacher created

5. **Check server console**:

   ```
   ✉️  Teacher Invitation Created:
      Teacher: Test Teacher (teacher@example.com)
      Invitation URL: http://localhost:3002/accept-invitation?token=...
      Expires: [date and time]
   ```

6. **Check API response**:
   ```json
   {
     "success": true,
     "data": {
       "id": "uuid",
       "name": "Test Teacher",
       "email": "teacher@example.com",
       "invitationUrl": "http://localhost:3002/accept-invitation?token=...",
       "invitationSent": true
     },
     "message": "Teacher created successfully. Invitation sent."
   }
   ```

---

### Step 5: Test Invitation Acceptance

Now test that teachers can accept invitations:

1. **Copy invitation URL** from previous step's console output

2. **Open invitation URL** in new browser window/incognito:

   ```
   http://localhost:3002/accept-invitation?token=...
   ```

3. **You should see**:
   - Welcome message: "You've been invited to join as a teacher"
   - Email displayed: "teacher@example.com"
   - Expiration date shown
   - Password creation form

4. **Create password**:
   - Enter password: `TestTeacher123!`
   - Confirm password: `TestTeacher123!`
   - Check password requirements (all should be green ✅):
     - ✅ 8+ characters
     - ✅ Uppercase
     - ✅ Lowercase
     - ✅ Number

5. **Click "Create Account"**

6. **Expected Result**:
   - ✅ "Account Created!" success message
   - Auto-redirect to login page after 3 seconds

---

### Step 6: Test Teacher Login

Now verify teacher can log in:

1. **Go to login page**: http://localhost:3002/login

2. **Enter credentials**:
   - Email: `teacher@example.com`
   - Password: `TestTeacher123!`

3. **Click "Sign In"**

4. **Expected Result**:
   - ✅ Successfully logged in
   - ✅ Redirected to Teacher Dashboard
   - ✅ Can access teacher features

---

### Step 7: Verify Database Records

Check that all records were created correctly:

**1. Check teacher record**:

```sql
SELECT id, user_id, parent_id, name, email, status
FROM teachers
WHERE email = 'teacher@example.com';
```

Expected:

- `user_id` should NOT be null (linked to Supabase Auth user)
- `status` should be 'available'

**2. Check invitation token**:

```sql
SELECT id, email, status, expires_at, accepted_at
FROM invitation_tokens
WHERE email = 'teacher@example.com';
```

Expected:

- `status` should be 'accepted'
- `accepted_at` should have a timestamp

**3. Check auth user**:

```sql
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'teacher@example.com';
```

Expected:

- User exists with `role` = 'teacher'

**4. Check users table**:

```sql
SELECT id, email, name, role
FROM users
WHERE email = 'teacher@example.com';
```

Expected:

- User record exists with `role` = 'teacher'

---

## 🎯 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PARENT CREATES TEACHER                                   │
│    ↓                                                         │
│    POST /api/teachers                                        │
│    ↓                                                         │
│    DatabaseService.createTeacher()                           │
│    ├─ Creates teacher record (user_id = null)               │
│    └─ Calls InvitationService.createInvitationToken()       │
│        ├─ Generates secure token                            │
│        ├─ Stores in invitation_tokens table                 │
│        ├─ Returns invitation URL                            │
│        └─ Logs URL to console                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 2. PARENT SHARES INVITATION URL                             │
│    (Parent can copy URL from response and send via email)   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 3. TEACHER OPENS INVITATION URL                             │
│    ↓                                                         │
│    GET /accept-invitation?token=xxx                          │
│    ↓                                                         │
│    Page validates token via GET /api/invitations/accept     │
│    ├─ Checks token exists                                   │
│    ├─ Checks status is 'pending'                            │
│    ├─ Checks not expired                                    │
│    └─ Shows password creation form                          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 4. TEACHER CREATES PASSWORD                                 │
│    ↓                                                         │
│    POST /api/invitations/accept                              │
│    ├─ Validates password strength                           │
│    └─ Calls InvitationService.acceptInvitation()            │
│        ├─ Creates Supabase Auth user                        │
│        ├─ Creates users table record                        │
│        ├─ Updates teacher.user_id                           │
│        ├─ Marks invitation as 'accepted'                    │
│        └─ Returns success                                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 5. TEACHER LOGS IN                                          │
│    ↓                                                         │
│    POST /api/auth/login (Supabase Auth)                     │
│    ├─ Email: teacher@example.com                            │
│    ├─ Password: [teacher's password]                        │
│    └─ Returns auth token                                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 6. TEACHER USES PLATFORM                                    │
│    ├─ Check in/out with QR codes                            │
│    ├─ View assigned students                                │
│    ├─ Manage sessions                                       │
│    └─ Track timesheets                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Features

### 1. Secure Token Generation

- 32 random bytes from `crypto.randomBytes()`
- Base64url encoded (URL-safe)
- Collision-resistant (2^256 possible tokens)

### 2. Token Expiration

- Default: 7 days from creation
- Auto-expired via database function
- Cannot be used after expiration

### 3. One-Time Use

- Token status changes from 'pending' to 'accepted'
- Cannot reuse accepted tokens
- Cannot reuse revoked tokens

### 4. Parent Isolation

- Parents can only create invitations for their own teachers
- RLS policies enforce `parent_id = auth.uid()`
- Cannot create invitations for other parents' teachers

### 5. Password Strength Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Validated on both client and server

### 6. Email Verification

- Email auto-confirmed on invitation acceptance
- No separate verification email needed
- Invitation link serves as email verification

---

## 📧 Email Integration (Optional)

Currently, invitation URLs are logged to console. To send actual emails:

### Option A: SendGrid

1. **Install SendGrid**:

   ```bash
   npm install @sendgrid/mail
   ```

2. **Add env variable**:

   ```
   SENDGRID_API_KEY=your_key_here
   ```

3. **Update `invitation.service.ts`**:

   ```typescript
   import sgMail from '@sendgrid/mail';

   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

   const msg = {
     to: invitation.email,
     from: 'noreply@gurukool.com',
     subject: 'Welcome to GuruKool - Teacher Invitation',
     text: `Click here to accept: ${invitationUrl}`,
     html: `<a href="${invitationUrl}">Accept Invitation</a>`,
   };

   await sgMail.send(msg);
   ```

### Option B: AWS SES

1. **Install AWS SDK**:

   ```bash
   npm install @aws-sdk/client-ses
   ```

2. **Add env variables**:

   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   ```

3. **Send email via SES**

### Option C: Resend (Recommended - simplest)

1. **Install Resend**:

   ```bash
   npm install resend
   ```

2. **Add env variable**:

   ```
   RESEND_API_KEY=your_key_here
   ```

3. **Update `invitation.service.ts`**:

   ```typescript
   import { Resend } from 'resend';

   const resend = new Resend(process.env.RESEND_API_KEY);

   await resend.emails.send({
     from: 'noreply@gurukool.com',
     to: invitation.email,
     subject: 'Welcome to GuruKool - Teacher Invitation',
     html: `<a href="${invitationUrl}">Accept Invitation</a>`,
   });
   ```

---

## 🧪 Testing Checklist

### ✅ Migration 010 Applied

- [ ] Run SQL in Supabase Dashboard
- [ ] No errors returned
- [ ] Verify policies: `SELECT * FROM pg_policies WHERE tablename = 'teachers';`

### ✅ Migration 011 Applied

- [ ] Run SQL in Supabase Dashboard
- [ ] No errors returned
- [ ] Verify table exists: `SELECT * FROM invitation_tokens LIMIT 1;`

### ✅ Teacher Creation Works

- [ ] Parent can create teacher profile
- [ ] No "42501" RLS error
- [ ] Teacher record created in database
- [ ] Invitation URL appears in console
- [ ] API response includes `invitationUrl`

### ✅ Invitation Validation Works

- [ ] Open invitation URL in browser
- [ ] Page shows "Welcome to GuruKool"
- [ ] Email displayed correctly
- [ ] Expiration date shown
- [ ] Password form displayed

### ✅ Password Creation Works

- [ ] Enter password with requirements
- [ ] All checkmarks turn green
- [ ] Confirm password matches
- [ ] Click "Create Account"
- [ ] Success message appears
- [ ] Redirects to login page

### ✅ Teacher Login Works

- [ ] Use email and password to log in
- [ ] Redirected to Teacher Dashboard
- [ ] Teacher menu items visible
- [ ] Can access teacher features

### ✅ Database Records Correct

- [ ] teacher.user_id is NOT null
- [ ] invitation_tokens.status is 'accepted'
- [ ] auth.users record exists
- [ ] users table record exists with role='teacher'

---

## ❓ Troubleshooting

### Error: "Failed to create user profile"

**Cause**: Migration 010 not applied

**Fix**: Apply `010_fix_teachers_rls_insert_policy.sql` in Supabase Dashboard

---

### Error: "relation 'invitation_tokens' does not exist"

**Cause**: Migration 011 not applied

**Fix**: Apply `011_teacher_invitation_tokens.sql` in Supabase Dashboard

---

### Error: "Invalid or expired invitation"

**Possible Causes**:

1. Token not found in database
2. Token status is not 'pending'
3. Token has expired

**Debug**:

```sql
SELECT * FROM invitation_tokens WHERE token = 'your_token_here';
```

Check `status` and `expires_at` fields.

---

### Error: "User with this email already exists"

**Cause**: Teacher email already registered in Supabase Auth

**Fix**: Either:

1. Use a different email
2. Delete existing user: Supabase Dashboard → Authentication → Users → Delete
3. Link existing user to teacher (manual process)

---

### Invitation URL not appearing

**Cause**: Console logs not visible

**Fix**:

1. Check terminal/console where `npm run dev` is running
2. Look for "✉️ Teacher Invitation Created:"
3. Or check API response in browser Network tab

---

## 📊 Success Criteria

After completing this setup, you should have:

- ✅ Parents can create teachers without errors
- ✅ Invitation URLs generated automatically
- ✅ Teachers can accept invitations and set passwords
- ✅ Teachers can log in with email/password
- ✅ Teachers can access teacher features
- ✅ All database records linked correctly

---

## 🚀 Next Steps

1. **Integrate Email Service**: Send real emails instead of console logs
2. **Add Email Templates**: Create beautiful HTML email templates
3. **Add Invitation Management UI**: Let parents view/resend/revoke invitations
4. **Add Notification System**: Notify parents when teachers accept invitations
5. **Add Bulk Invitations**: Allow parents to invite multiple teachers at once

---

## 📁 Files Created/Modified

### New Files:

- `supabase/migrations/010_fix_teachers_rls_insert_policy.sql`
- `supabase/migrations/011_teacher_invitation_tokens.sql`
- `src/services/invitation.service.ts`
- `src/app/api/invitations/send/route.ts`
- `src/app/api/invitations/accept/route.ts`
- `src/app/accept-invitation/page.tsx`

### Modified Files:

- `src/app/api/teachers/route.ts` - Added auto-invitation on teacher creation

---

**Setup Date**: 2025-11-12
**Status**: ✅ Complete and Ready to Test
**Next Action**: Apply migrations 010 and 011 in Supabase Dashboard
