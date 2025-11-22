# Flutter Mobile App Troubleshooting Guide

## Issue: Supabase Authentication Error (HTTP 400)

### Error Message

```
Failed to load resource: the server responded with a status of 400
miqhtpbutevdrkyndflf.supabase.co/auth/v1/token?grant_type=password
```

### Root Cause

HTTP 400 error from Supabase means **invalid credentials** - the email/password combination doesn't exist or is incorrect.

---

## Solution 1: Create Test Teacher User in Supabase

### Option A: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/miqhtpbutevdrkyndflf
   - Login with your Supabase account

2. **Navigate to Authentication → Users**
   - Click "Invite user" or "Add user"

3. **Create Teacher User**

   ```
   Email: teacher@example.com
   Password: teacher123
   Email Confirm: Yes (auto-confirm)
   ```

4. **Verify User Created**
   - Check that user appears in user list
   - Note the User ID (UUID format)

### Option B: Via SQL Editor (Advanced)

1. **Open SQL Editor** in Supabase Dashboard

2. **Run SQL to Create User**

   ```sql
   -- Create auth user (automatically generates UUID)
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     confirmation_token,
     email_change,
     email_change_token_new,
     recovery_token
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(), -- Auto-generate UUID
     'authenticated',
     'authenticated',
     'teacher@example.com',
     crypt('teacher123', gen_salt('bf')), -- Hash password with bcrypt
     NOW(),
     NOW(),
     NOW(),
     '',
     '',
     '',
     ''
   );
   ```

3. **Verify User Created**
   ```sql
   SELECT id, email, created_at
   FROM auth.users
   WHERE email = 'teacher@example.com';
   ```

---

## Solution 2: Use Existing User Credentials

If you've already created a teacher user in the web app or Supabase:

### Check Existing Users

1. **Via Supabase Dashboard**
   - Go to Authentication → Users
   - Copy email of existing teacher user
   - Reset password if needed

2. **Via SQL Query**

   ```sql
   SELECT id, email, created_at
   FROM auth.users
   WHERE email LIKE '%teacher%'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Use Those Credentials in Flutter App**
   - Email: [found email]
   - Password: [your password]

---

## Solution 3: Reset Password for Existing User

### Via Supabase Dashboard

1. Go to **Authentication → Users**
2. Find user: `teacher@example.com`
3. Click **"..." menu → "Send password recovery"**
4. Check email for reset link
5. Set new password: `teacher123`
6. Try logging in again

### Via Password Recovery Flow (In App)

1. Click **"Forgot Password?"** on login screen
2. Enter email: `teacher@example.com`
3. Check email for recovery link
4. Set new password
5. Return to app and login

---

## Verification Steps

### 1. Verify Supabase Connection

**Check .env file** ([.env](.env)):

```bash
SUPABASE_URL=https://miqhtpbutevdrkyndflf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Test connection** (open in browser):

```
https://miqhtpbutevdrkyndflf.supabase.co/auth/v1/health
```

Expected response: `{"date":"...", "status":"ok"}`

### 2. Check Flutter Logs

**In Flutter terminal**:

```bash
flutter run -d chrome
# Watch for:
# "Supabase init completed" ✅
# "AuthException: Invalid login credentials" ❌
```

### 3. Test Login with Different User

**Create another test user**:

```
Email: test-teacher@gurukool.com
Password: Test123!@#
```

Try logging in with this user to isolate the issue.

---

## Common Mistakes

### ❌ Wrong Email Format

```
teacher@example    ← Missing .com
Teacher@example.com ← Capital T (emails are case-sensitive in some systems)
teacher @example.com ← Space before @
```

### ✅ Correct Format

```
teacher@example.com ← Lowercase, valid domain
```

### ❌ Wrong Password

```
Teacher123  ← Capital T
teacher 123 ← Space
teacher1234 ← Extra digit
```

### ✅ Correct Password

```
teacher123 ← Exact match
```

---

## Debug Mode: Verbose Logging

### Enable Supabase Debug Logs

Add to [lib/main.dart](lib/main.dart):

```dart
await Supabase.initialize(
  url: dotenv.env['SUPABASE_URL']!,
  anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
  debug: true, // ← Add this line
);
```

**Restart Flutter app** and watch console for detailed auth logs.

### Check Login Screen Code

[lib/screens/login_screen.dart](lib/screens/login_screen.dart) - Login logic:

```dart
final response = await Supabase.instance.client.auth.signInWithPassword(
  email: _emailController.text.trim(), // ← .trim() removes whitespace
  password: _passwordController.text,
);
```

---

## Alternative: Sign Up Flow

If creating users manually is tedious, add a **Sign Up** screen:

### Quick Sign Up Implementation

**Add to login_screen.dart**:

```dart
// Below login button:
TextButton(
  onPressed: () async {
    // Quick sign up
    final response = await Supabase.instance.client.auth.signUp(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (response.user != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Account created! Please login.')),
      );
    }
  },
  child: Text('Don\'t have an account? Sign Up'),
)
```

**Security Note**: In production, sign-up should:

- Require email confirmation
- Validate password strength
- Check if user is authorized teacher

---

## Network Issues

### Check Internet Connection

```bash
# Test Supabase reachability
ping miqhtpbutevdrkyndflf.supabase.co

# Test API endpoint
curl https://miqhtpbutevdrkyndflf.supabase.co/auth/v1/health
```

### Check Firewall/Proxy

If behind corporate firewall:

- Supabase uses port 443 (HTTPS)
- Check if `*.supabase.co` is whitelisted

### CORS Issues (Web Only)

If running Flutter web and seeing CORS errors:

- Supabase should auto-allow CORS for web
- Check browser console for CORS errors
- Verify Supabase project settings allow your domain

---

## Still Not Working?

### 1. Check Supabase Service Status

https://status.supabase.com/

### 2. Verify Project Active

- Login to Supabase Dashboard
- Check project is not paused (free tier)

### 3. Check RLS Policies

Supabase Dashboard → Authentication → Policies

- Ensure auth policies don't block login

### 4. Test with Postman/cURL

**Manual login test**:

```bash
curl -X POST https://miqhtpbutevdrkyndflf.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "teacher123"
  }'
```

**Expected Response** (Success):

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "...",
    "email": "teacher@example.com"
  }
}
```

**Error Response** (400):

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid login credentials"
}
```

---

## Quick Fix: Create User via Next.js Web App

### Option: Use Web App to Create Teacher

1. **Start Next.js web app**

   ```bash
   cd .. # Go to project root
   npm run dev
   ```

2. **Access at** http://localhost:3000

3. **Login as Parent** (or create parent account)

4. **Create Teacher Profile**
   - Navigate to parent dashboard
   - Click "Add Teacher"
   - Email: teacher@example.com
   - Password: teacher123
   - Submit

5. **Teacher account now exists in Supabase**

6. **Return to Flutter app** and login with those credentials

---

## Contact & Support

**Supabase Documentation**: https://supabase.com/docs/guides/auth

**Project Maintainer**: See [README.md](../README.md)

**GitHub Issues**: [Report a bug](https://github.com/your-repo/issues)

---

## Appendix: Complete Test User Setup SQL

```sql
-- Clean slate: Delete test user if exists
DELETE FROM auth.users WHERE email = 'teacher@example.com';

-- Create test user with known password
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'teacher@example.com',
    crypt('teacher123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Test Teacher","role":"teacher"}'
  ) RETURNING id
)
SELECT id FROM new_user;

-- Verify user created
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'teacher@example.com';
```

**Copy UUID from result** and use for testing.

---

**Last Updated**: 2025-11-17
**Status**: ✅ Ready for Testing
