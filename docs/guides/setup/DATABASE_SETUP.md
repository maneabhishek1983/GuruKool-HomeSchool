# Database Setup Guide

This guide will help you set up the Supabase database infrastructure for the AI-Enhanced HomeschoolPlatform.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18 or higher
3. **Supabase CLI**: Install globally with `npm install -g supabase`

## Quick Setup

### 1. Create a New Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `gurukool-homeschool`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret-key
   ```

### 4. Run Database Migrations

#### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor and click "Run"

#### Option B: Using Supabase CLI (Recommended for developers)

1. Initialize Supabase in your project:

   ```bash
   supabase init
   ```

2. Link to your remote project:

   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push the migration:
   ```bash
   supabase db push
   ```

### 5. Verify Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `users`
   - `sessions`
   - `auth_sessions`
   - `ai_insights`
   - `learning_analytics`

3. Check that demo data was inserted:
   - 3 users (teacher, parent, admin)
   - 3 demo sessions
   - Sample AI insights and learning analytics

## Database Schema Overview

### Core Tables

#### `users`

- Stores user accounts (parents, teachers, admins)
- Includes preferences and role-based access
- Connected to Supabase Auth

#### `sessions`

- Teaching sessions between teachers and students
- Tracks scheduling, location, and completion status
- Links to users via teacher_id and parent_id

#### `auth_sessions`

- QR code authentication sessions
- Stores AI security context and risk scores
- Automatically cleaned up when expired

#### `ai_insights`

- AI-generated insights and recommendations
- Linked to sessions and users
- Includes confidence scores and metadata

#### `learning_analytics`

- Student progress tracking and analytics
- AI-powered learning pattern analysis
- Personalized recommendations

### Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Role-based Access**: Users can only access their own data
- **Encrypted Storage**: Sensitive data is encrypted at rest
- **Audit Logging**: All changes are tracked with timestamps

## Testing the Database

### 1. Run the QR Code Tester

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/test/qr`

3. Click "Run All Tests" to verify:
   - Database connectivity
   - QR code generation and storage
   - AI agent integration
   - Authentication flow

### 2. Manual Database Testing

You can test database operations directly in the Supabase dashboard:

```sql
-- Test user creation
INSERT INTO users (email, name, role)
VALUES ('test@example.com', 'Test User', 'parent');

-- Test session creation
INSERT INTO sessions (student_id, teacher_id, parent_id, subject, scheduled_start, scheduled_end, location)
VALUES (
  uuid_generate_v4(),
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  'Test Subject',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day 2 hours',
  '{"address": "Test Address", "coordinates": {"latitude": 0, "longitude": 0}, "verified": false}'
);

-- Test AI insight creation
INSERT INTO ai_insights (user_id, type, content, confidence)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'recommendation',
  'Test AI insight',
  0.85
);
```

## Production Considerations

### 1. Security

- **Environment Variables**: Never commit `.env.local` to version control
- **Service Role Key**: Keep this secret and only use server-side
- **RLS Policies**: Review and test all Row Level Security policies
- **API Keys**: Rotate keys regularly

### 2. Performance

- **Indexes**: The migration includes optimized indexes for common queries
- **Connection Pooling**: Supabase handles this automatically
- **Caching**: Consider implementing Redis for frequently accessed data

### 3. Backup and Recovery

- **Automatic Backups**: Supabase provides automatic daily backups
- **Point-in-Time Recovery**: Available for Pro plans and above
- **Export Data**: Regular exports for additional backup

### 4. Monitoring

- **Supabase Dashboard**: Monitor database performance and usage
- **Logs**: Review database logs for errors and slow queries
- **Alerts**: Set up alerts for high usage or errors

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify environment variables are correct
   - Check if your IP is allowed (Supabase allows all by default)
   - Ensure project is not paused

2. **Permission Errors**
   - Check Row Level Security policies
   - Verify user authentication
   - Review table permissions

3. **Migration Errors**
   - Check SQL syntax in migration files
   - Verify all dependencies are met
   - Review Supabase logs for detailed errors

### Getting Help

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Community Support**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

## Next Steps

After setting up the database:

1. **Configure AI Services**: Set up OpenAI and other AI service API keys
2. **Set up WebSocket Server**: For real-time QR authentication updates
3. **Configure MCP Servers**: For enhanced AI capabilities
4. **Deploy to Production**: Use Vercel, Netlify, or your preferred platform

The database is now ready to support the full AI-enhanced homeschool platform with QR authentication, AI insights, and comprehensive session management!
