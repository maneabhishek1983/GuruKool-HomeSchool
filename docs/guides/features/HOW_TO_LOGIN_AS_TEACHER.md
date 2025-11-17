# How to Login as a Teacher

**Application URL:** https://gurukool-homeschool-git-e06704-abhishek-manes-projects-efbe2a67.vercel.app/

---

## 🎯 Quick Answer

**Login URL:** https://gurukool-homeschool-git-e06704-abhishek-manes-projects-efbe2a67.vercel.app/login

**Steps:**

1. Navigate to `/login` page
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to `/teacher/dashboard`

---

## 📋 Three Ways to Login as a Teacher

### Method 1: Login with Existing Account (If You Already Have One)

**Steps:**

1. Go to: `https://gurukool-homeschool-git-e06704-abhishek-manes-projects-efbe2a67.vercel.app/login`
2. Enter your **Email** (the email you used when creating your teacher account)
3. Enter your **Password**
4. Click **"Sign In"** button
5. You'll be automatically redirected to `/teacher/dashboard`

**Note:** If you don't remember your password, you may need to reset it through Supabase Auth or contact the admin.

---

### Method 2: Sign Up as a New Teacher

**Steps:**

1. Go to: `https://gurukool-homeschool-git-e06704-abhishek-manes-projects-efbe2a67.vercel.app/login`
2. Click **"Don't have an account? Sign up"** link at the bottom
3. Fill in the form:
   - **Full Name:** Enter your name (e.g., "John Teacher")
   - **Account Type:** Select **"Teacher"** from dropdown
   - **Email Address:** Enter your email (e.g., "teacher@example.com")
   - **Password:** Create a password (minimum 6 characters)
4. Click **"Create Account"** button
5. You'll be automatically redirected to `/teacher/dashboard`

**Important:** After signup, you may need to:

- Be assigned to students by a parent
- Wait for parent to create teacher-student assignments
- Have QR codes generated for you by the parent

---

### Method 3: Accept Teacher Invitation (Recommended)

**This is the recommended way** if a parent has invited you to teach their student.

**Steps:**

1. **Receive Invitation Email**
   - Parent sends you an invitation email
   - Email contains a link to accept invitation

2. **Click Invitation Link**
   - Link format: `https://gurukool-homeschool-git-e06704-abhishek-manes-projects-efbe2a67.vercel.app/accept-invitation?token=[invitation-token]`
   - This opens the invitation acceptance page

3. **Create Your Account**
   - Enter your **Full Name**
   - Enter your **Email** (should match invitation email)
   - Create a **Password** (minimum 6 characters)
   - Click **"Accept Invitation"**

4. **Automatic Setup**
   - Your teacher account is created
   - You're automatically assigned to the student
   - QR codes are generated for you
   - You're redirected to `/teacher/dashboard`

5. **Login Next Time**
   - Use the email and password you created
   - Go to `/login` page
   - Sign in normally

---

## 🔐 Demo/Test Credentials (If Available)

**Note:** These may only work in development/testing environments.

**Email:** `teacher@example.com`  
**Password:** `password` or `teacher123`

**How to Check:**

1. Try logging in with these credentials
2. If they don't work, you'll need to:
   - Sign up as a new teacher (Method 2), OR
   - Accept an invitation from a parent (Method 3)

---

## 🚨 Troubleshooting

### Issue: "Login failed" or "Invalid credentials"

**Solutions:**

1. **Check Email/Password**
   - Verify email is correct (check for typos)
   - Verify password is correct (check caps lock)
   - Try resetting password if available

2. **Check Account Exists**
   - Make sure you've signed up or accepted an invitation
   - Verify your account was created successfully

3. **Check Role**
   - Ensure your account has `role = 'teacher'` in database
   - If you signed up as a different role, you won't access teacher dashboard

4. **Check Supabase Auth**
   - Verify Supabase Auth is working
   - Check browser console (F12) for errors
   - Check network tab for failed API calls

---

### Issue: "Access Denied" or Redirected to Wrong Dashboard

**Solutions:**

1. **Check User Role**
   - Your account might have wrong role
   - Contact admin to update your role to 'teacher'

2. **Check Database**
   - Verify `users` table has your record
   - Verify `role` field is set to `'teacher'`

3. **Clear Browser Cache**
   - Clear cookies and localStorage
   - Try logging in again

---

### Issue: Can't Access Teacher Dashboard After Login

**Solutions:**

1. **Check Redirect**
   - After login, you should be redirected to `/teacher/dashboard`
   - If redirected elsewhere, check your role in database

2. **Manual Navigation**
   - Try navigating directly to: `/teacher/dashboard`
   - If you see "Access Denied", your role is incorrect

3. **Check Teacher Assignment**
   - You may need to be assigned to students by a parent
   - Check if parent has created teacher-student assignments

---

## 📍 Direct URLs

### Login Page

```
https://gurukool-homeschool-git-e06704-abhishek-manes-projects-efbe2a67.vercel.app/login
```

### Teacher Dashboard (After Login)

```
https://gurukool-homeschool-git-e06704-abhishek-manes-projects-efbe2a67.vercel.app/teacher/dashboard
```

### Accept Invitation Page

```
https://gurukool-homeschool-git-e06704-abhishek-manes-projects-efbe2a67.vercel.app/accept-invitation?token=[your-token]
```

---

## ✅ What Happens After Login

Once you successfully login as a teacher:

1. **Redirected to Teacher Dashboard**
   - URL: `/teacher/dashboard`
   - Shows welcome message with your name

2. **Dashboard Tabs Available:**
   - **Check-In/Out** - Scan QR codes to check in/out
   - **Timesheet Report** - View monthly timesheet summary
   - **Overview** - Dashboard statistics
   - **Sessions** - View your teaching sessions
   - **Data Sheets** - Manage student data sheets

3. **Features Available:**
   - Scan QR codes to check in/out
   - View timesheet entries
   - View assigned students
   - Create lesson plans
   - Track student progress

---

## 🔄 Complete Teacher Setup Flow

### Step 1: Account Creation

- Sign up as teacher OR accept invitation
- Account created with `role = 'teacher'`

### Step 2: Teacher Profile Setup

- Parent creates teacher profile (if not done via invitation)
- Teacher details stored in `teachers` table

### Step 3: Student Assignment

- Parent assigns teacher to student(s)
- Assignment stored in `teacher_assignments` table

### Step 4: QR Code Generation

- Parent generates QR codes for teacher-student pairs
- QR codes stored in `teacher_qr_codes` table
- Teacher can view QR codes in parent's dashboard

### Step 5: Start Teaching

- Teacher logs in
- Teacher scans QR code to check in
- Teacher teaches session
- Teacher checks out
- Timesheet entry created

---

## 📞 Need Help?

### If You Can't Login:

1. **Check Browser Console**
   - Press F12 → Console tab
   - Look for error messages
   - Share errors with support

2. **Check Network Requests**
   - Press F12 → Network tab
   - Try logging in
   - Check for failed requests
   - Share failed requests with support

3. **Contact Admin**
   - If you were invited, contact the parent who invited you
   - They can resend invitation or check your account status

4. **Verify Database**
   - Check if your account exists in `users` table
   - Verify `role` field is `'teacher'`
   - Verify `email` matches what you're using to login

---

## 🎓 Quick Start Guide for New Teachers

1. **Get Invited**
   - Parent sends you invitation email
   - OR parent creates teacher profile and assigns you

2. **Accept Invitation**
   - Click link in email
   - Create account with password
   - Account automatically set up

3. **Login**
   - Go to `/login`
   - Enter email and password
   - Access teacher dashboard

4. **View QR Codes**
   - Ask parent to show you QR codes
   - OR parent can share QR code images with you

5. **Start Teaching**
   - Go to Check-In/Out tab
   - Scan QR code
   - Check in
   - Teach session
   - Check out

---

**Last Updated:** January 2025  
**Application Version:** Production (Vercel)
