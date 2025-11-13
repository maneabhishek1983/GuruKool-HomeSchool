# Supabase Email Template Fix

## Issue

Teachers are receiving Supabase's automatic "Confirm sign up" emails with OTP links that expire in 1 hour, causing the error:

```
?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

## Root Cause

- Our code uses `admin.auth.admin.createUser({ email_confirm: true })` which pre-confirms emails
- However, Supabase still sends automatic confirmation emails
- The Supabase OTP links conflict with our custom invitation system

## Solution Options

### Option 1: Disable Automatic Email Confirmations (RECOMMENDED)

1. In Supabase Dashboard, go to: **Authentication → Policies**
2. Find the "Enable email confirmations" setting
3. **DISABLE** it
4. Save changes

**Result**: Teachers will ONLY receive our custom invitation URLs (no automatic Supabase emails)

**Pros**:

- Clean separation between systems
- No confusion with two different email types
- Our custom invitation system has better UX (7-day expiration, branded page)

**Cons**:

- Need to manually share invitation URLs (currently logged to console)
- Should implement email sending service later (Resend, SendGrid, etc.)

---

### Option 2: Customize Supabase Email Template (ALTERNATIVE)

1. You're already on the right page: **Authentication → Emails → Templates → Confirm sign up**

2. Replace the current template with:

```html
<h2>Welcome to GuruKool HomeSchool!</h2>

<p>Hello {{ .Name }},</p>

<p>
  You've been invited to join GuruKool HomeSchool as a teacher. This is an
  automatic confirmation email from our system.
</p>

<p>
  <strong>Important:</strong> Please ignore this email and use the invitation
  link sent separately by your parent/administrator.
</p>

<p>
  If you didn't receive an invitation link, please contact your administrator.
</p>

<p>
  Thank you,<br />
  GuruKool HomeSchool Team
</p>
```

3. **Remove the confirmation URL entirely** since we use custom invitations

**Result**: Teachers receive a friendly message telling them to use the custom invitation URL instead

**Pros**:

- Teachers understand they should use the invitation URL
- No broken links
- Professional communication

**Cons**:

- Still sends redundant emails
- Slightly confusing (two email types)

---

### Option 3: Redirect Supabase Template to Our Custom Page (ADVANCED)

1. In the "Confirm sign up" template, change line 5 to:

```html
<p>
  <a href="{{ .SiteURL }}/accept-invitation?otp={{ .Token }}"
    >Complete your registration</a
  >
</p>
```

2. Modify our `/accept-invitation` page to handle both:
   - Our custom invitation tokens (existing)
   - Supabase OTP tokens (new parameter)

**Result**: Supabase emails work with our custom UI

**Pros**:

- Unified experience
- Both systems work together

**Cons**:

- More complex implementation
- OTP tokens still expire in 1 hour (worse than our 7-day tokens)
- Requires code changes to handle two token types

---

## RECOMMENDED ACTION

**Choose Option 1**: Disable automatic email confirmations

**Steps**:

1. In Supabase Dashboard, navigate to: **Authentication → Settings** (not Templates)
2. Look for "Email" or "Email Confirmations" section
3. Find the toggle/checkbox for "Enable email confirmations"
4. **DISABLE** it
5. Save changes

**Why this is best**:

- Our custom invitation system is superior (7-day expiration vs 1-hour)
- Beautiful branded UI with password strength indicators
- Displays parent name in invitation
- Clean separation of concerns
- No confusion with multiple email types

**Next Step**: Implement email sending in our invitation system

- Use Resend, SendGrid, or AWS SES
- Send email when invitation is created
- Professional HTML email template with GuruKool branding

---

## Testing After Fix

1. Create a new teacher or resend invitation to "Tahera"
2. Verify NO automatic Supabase email is sent
3. Copy invitation URL from console logs
4. Open URL in browser (use correct port: 3002)
5. Set password and complete registration
6. Verify teacher can login successfully

---

## Current Invitation System Status

✅ **Implemented**:

- Secure token generation (32-byte crypto)
- Database table (invitation_tokens)
- API endpoints (send/accept/validate)
- Beautiful frontend UI with password strength
- Auto-invitation on teacher creation
- 7-day expiration

⏳ **Pending**:

- Email sending integration (currently logs to console only)
- Email template with GuruKool branding
- Parent dashboard to view/resend invitations

---

## Quick Reference

**Supabase Dashboard URL**: https://supabase.com/dashboard/project/miqhtpbutevdrkyndflf

**Navigate to**:

- Email Templates: Authentication → Emails → Templates
- Email Settings: Authentication → Settings → Email
- Policies: Authentication → Policies

**Current System**:

- Dev server: http://localhost:3002
- Invitation page: http://localhost:3002/accept-invitation?token=XXX
- API endpoint: POST /api/invitations/accept
