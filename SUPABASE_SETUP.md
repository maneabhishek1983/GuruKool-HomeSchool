# Supabase Setup Guide

## Overview
This guide walks you through setting up a real Supabase instance for the GuruKool HomeSchool application.

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create account
3. Click "New Project"
4. Fill in details:
   - **Name**: `gurukool-homeschool`
   - **Database Password**: Generate strong password (save securely)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier is sufficient for development

5. Wait for project to be provisioned (~2 minutes)

---

## Step 2: Get Connection Details

Once project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** tab
3. Copy the following:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anon/Public Key (safe for client-side use with RLS)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (NEVER expose to client, server-only!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Update .env File

Update your local `.env` file:

```bash
# Replace these with your actual values from Step 2
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Keep existing values
JWT_SECRET=development-jwt-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key-here
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=your-pinecone-environment
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

---

## Step 4: Run Database Migrations

In Supabase Dashboard:

1. Go to **SQL Editor** in sidebar
2. Click **New query**
3. Run migrations in order:

### Migration 1: Initial Schema
Copy contents of `supabase/migrations/001_initial_schema.sql` and run.

### Migration 2: Data Sheets
Copy contents of `supabase/migrations/002_data_sheets_and_extended_features.sql` and run.

### Migration 3: Teachers Table
Copy contents of `supabase/migrations/003_teachers_table.sql` and run.

### Migration 4: Teacher QR Codes
Copy contents of `supabase/migrations/004_teacher_qr_codes.sql` and run.

### Migration 5: RLS Policies
Copy contents of `supabase/migrations/006_fix_rls_policies.sql` and run.

**Note**: Check for any errors after each migration. If a migration fails, fix the issue before proceeding.

---

## Step 5: Verify Tables Created

In Supabase Dashboard:

1. Go to **Table Editor** in sidebar
2. You should see these tables:
   - ✅ users
   - ✅ students
   - ✅ teachers
   - ✅ sessions
   - ✅ teacher_qr_codes
   - ✅ teacher_sessions
   - ✅ ai_insights
   - ✅ learning_analytics
   - ✅ auth_sessions
   - ✅ data_sheets (if migration 2 ran)

---

## Step 6: Enable Row Level Security (RLS)

For each table in Table Editor:

1. Click on table name
2. Click **RLS** tab
3. Verify **RLS is enabled** (should show green checkmark)
4. Review policies listed

**Critical**: Ensure these core policies exist:

### Users Table Policies:
- ✅ Users can view their own data
- ✅ Service role can manage all users

### Students Table Policies:
- ✅ Parents can view only their own students
- ✅ Parents can insert students with their parent_id
- ✅ Parents can update only their own students
- ✅ Parents can delete only their own students

### Teachers Table Policies:
- ✅ Parents can view only their own teachers
- ✅ Parents can insert teachers with their parent_id
- ✅ Teachers can view their own profile

### Sessions Table Policies:
- ✅ Parents can view sessions for their students
- ✅ Teachers can view sessions they're assigned to
- ✅ Service role can manage all sessions

---

## Step 7: Test Connection

Run the connection verification script:

```bash
npm run verify:supabase
```

Or manually test:

```bash
node scripts/verify-supabase-connection.js
```

Expected output:
```
✅ Supabase URL configured
✅ Anon key configured
✅ Service role key configured
✅ Connection successful
✅ Can query users table
✅ RLS is enforced
✅ Service role can bypass RLS
```

---

## Step 8: Create Test User

In Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email**: test@example.com
   - **Password**: Test123456!
   - **Auto Confirm User**: ✅ Yes

4. Go to **Table Editor** → **users** table
5. Click **Insert** → **Insert row**
6. Fill in:
   ```json
   {
     "id": "[copy user id from auth.users]",
     "email": "test@example.com",
     "name": "Test Parent",
     "role": "parent",
     "preferences": {},
     "created_at": "now()",
     "last_active": "now()"
   }
   ```

---

## Step 9: Test Application

1. Restart dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Try logging in with test user:
   - Email: test@example.com
   - Password: Test123456!

4. Verify you can:
   - ✅ Log in successfully
   - ✅ View parent dashboard
   - ✅ Create student profile
   - ✅ Create teacher profile
   - ✅ View sessions

---

## Step 10: Configure Production Environment

For Vercel deployment:

1. Go to Vercel dashboard → Your project → Settings → Environment Variables

2. Add these for **Production** environment:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=[generate-new-secret-for-production]
   OPENAI_API_KEY=[your-openai-key-or-chomsky-endpoint]
   ```

3. For **Preview** environment, you can use same Supabase or create separate project

4. For **Development** environment, use your local .env values

---

## Troubleshooting

### Connection Timeout
**Problem**: Can't connect to Supabase
**Solution**:
- Check firewall settings
- Verify project is not paused
- Check API keys are correct

### RLS Blocking Queries
**Problem**: Getting "new row violates row-level security policy"
**Solution**:
- Check user role is set correctly
- Verify RLS policies allow the operation
- Use service role key for admin operations

### Migrations Fail
**Problem**: SQL errors when running migrations
**Solution**:
- Check if tables already exist
- Run migrations in order
- Check for syntax errors in migration files

### Can't See Data
**Problem**: Tables exist but queries return empty
**Solution**:
- Check RLS policies are not too restrictive
- Verify user is authenticated
- Check parent_id matches logged-in user

---

## Security Checklist

Before going to production:

- [ ] RLS enabled on ALL tables
- [ ] Service role key only in server environment variables
- [ ] Anon key is public (safe with RLS)
- [ ] Database password is strong (20+ characters)
- [ ] Backups enabled in Supabase
- [ ] SSL/TLS enforced
- [ ] API rate limiting configured
- [ ] Sensitive data encrypted at rest
- [ ] Regular security audits scheduled

---

## Maintenance

### Regular Tasks
- **Daily**: Monitor error logs in Supabase dashboard
- **Weekly**: Review slow queries in Performance tab
- **Monthly**: Check database size and optimize if needed
- **Quarterly**: Review and update RLS policies

### Backup Strategy
- Supabase provides automatic backups on paid plans
- Export data weekly: Table Editor → Export to CSV
- Store exports securely in encrypted storage

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Migrations**: https://supabase.com/docs/guides/cli/local-development
- **Community**: https://github.com/supabase/supabase/discussions

---

## Next Steps

After setup is complete:

1. ✅ Verify RLS policies (see [RLS_VERIFICATION.md](./RLS_VERIFICATION.md))
2. ✅ Run test suite against real database
3. ✅ Set up staging environment
4. ✅ Configure monitoring and alerts
5. ✅ Document disaster recovery procedure

---

*Last Updated: 2025-10-13*
