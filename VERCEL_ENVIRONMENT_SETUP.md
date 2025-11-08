# Vercel Environment Variables Setup

This document provides step-by-step instructions for configuring all required environment variables in the Vercel dashboard for the GuruKool HomeSchool application.

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Project Settings**: https://vercel.com/[your-team]/[project-name]/settings/environment-variables

---

## Environment Variables Configuration

### 1. Supabase Configuration (Required for All Environments)

These variables connect your application to Supabase for database, authentication, and realtime features.

#### `NEXT_PUBLIC_SUPABASE_URL`

- **Type**: Public (client-safe)
- **Description**: Your Supabase project URL
- **How to get**:
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Settings > API
  4. Copy the "Project URL"
- **Example**: `https://xyzcompany.supabase.co`
- **Environments**: Development, Preview, Production

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Type**: Public (client-safe, RLS-protected)
- **Description**: Supabase anonymous/public key for client-side requests
- **How to get**:
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Settings > API
  4. Copy the "anon public" key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environments**: Development, Preview, Production

#### `SUPABASE_SERVICE_ROLE_KEY`

- **Type**: Secret (server-only, NEVER expose to client)
- **Description**: Service role key for server-side operations that bypass RLS
- **How to get**:
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Settings > API
  4. Copy the "service_role" key (⚠️ Keep this secret!)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environments**: Development, Preview, Production
- **⚠️ WARNING**: Never commit this to git or expose it to the client

---

### 2. AI/ML Configuration

#### Development/Local Testing Only

##### `OPENAI_API_KEY`

- **Type**: Secret (server-only)
- **Description**: OpenAI API key for local development and testing
- **How to get**:
  1. Go to https://platform.openai.com/api-keys
  2. Create a new secret key
- **Example**: `sk-proj-...`
- **Environments**: Development only
- **Note**: According to project requirements, production uses Chomsky LLM instead

#### Production Only (Future Integration)

##### `CHOMSKY_API_KEY`

- **Type**: Secret (server-only)
- **Description**: Chomsky LLM API key for production
- **Environments**: Production only
- **Status**: Future integration (not currently implemented)

##### `APIM_ENDPOINT`

- **Type**: Secret (server-only)
- **Description**: API Management endpoint
- **Environments**: Production only
- **Status**: Future integration (not currently implemented)

##### `OKTA_CLIENT_ID` and `OKTA_CLIENT_SECRET`

- **Type**: Secret (server-only)
- **Description**: OKTA authentication credentials
- **Environments**: Production only
- **Status**: Future integration (not currently implemented)

---

### 3. Vector Database (Pinecone)

#### `PINECONE_API_KEY`

- **Type**: Secret (server-only)
- **Description**: Pinecone API key for vector embeddings
- **How to get**:
  1. Go to https://app.pinecone.io
  2. Navigate to API Keys
  3. Copy your API key
- **Example**: `pc-...`
- **Environments**: Development, Preview, Production

#### `PINECONE_ENVIRONMENT`

- **Type**: Secret (server-only)
- **Description**: Pinecone environment/region
- **How to get**: Found in Pinecone dashboard when you create an index
- **Example**: `us-east-1-aws` or `gcp-starter`
- **Environments**: Development, Preview, Production

---

### 4. Security

#### `JWT_SECRET`

- **Type**: Secret (server-only)
- **Description**: Secret key for JWT signing and verification
- **How to generate**: Use a strong random string (32+ characters)
- **Example**: `openssl rand -base64 32` (run this command to generate)
- **Environments**: Development, Preview, Production
- **⚠️ IMPORTANT**: Use different secrets for different environments

---

### 5. Rate Limiting (Upstash Redis)

#### `UPSTASH_REDIS_REST_URL`

- **Type**: Secret (server-only)
- **Description**: Upstash Redis REST API URL for distributed rate limiting
- **How to get**:
  1. Go to https://console.upstash.com
  2. Create a new Redis database
  3. Copy the "REST URL"
- **Example**: `https://us1-meet-lizard-12345.upstash.io`
- **Environments**: Preview, Production
- **Note**: Optional for development (uses in-memory rate limiting as fallback)

#### `UPSTASH_REDIS_REST_TOKEN`

- **Type**: Secret (server-only)
- **Description**: Upstash Redis authentication token
- **How to get**: Found in Upstash console alongside REST URL
- **Example**: `AYQgASQgM2U...`
- **Environments**: Preview, Production

---

### 6. Real-time Features

#### `NEXT_PUBLIC_WS_URL`

- **Type**: Public (client-safe)
- **Description**: WebSocket URL for real-time features
- **Current Status**: ⚠️ **DEPRECATED** - Now using Supabase Realtime instead
- **Migration**: Remove this variable after verifying Supabase Realtime works
- **Environments**: None (can be removed)

---

### 7. Monitoring & Error Tracking (Optional)

#### `SENTRY_DSN`

- **Type**: Public (client-safe)
- **Description**: Sentry Data Source Name for error tracking
- **How to get**:
  1. Go to https://sentry.io
  2. Create a new project
  3. Copy the DSN from project settings
- **Example**: `https://abc123@o123456.ingest.sentry.io/7654321`
- **Environments**: Preview, Production (optional for Development)

#### `SENTRY_AUTH_TOKEN`

- **Type**: Secret (server-only)
- **Description**: Sentry authentication token for uploading source maps
- **How to get**: Sentry project settings > Auth Tokens
- **Environments**: Production (for build-time source map upload)

---

### 8. Demo Credentials (Development/Staging Only)

⚠️ **IMPORTANT**: Set `ENABLE_DEMO_CREDENTIALS=false` in Production!

#### `ENABLE_DEMO_CREDENTIALS`

- **Type**: Public
- **Description**: Enable or disable demo account access
- **Values**: `true` or `false`
- **Environments**:
  - Development: `true`
  - Preview: `true`
  - Production: **`false`** (REQUIRED for security)

#### `DEMO_PARENT_PASSWORD`

- **Type**: Secret
- **Description**: Password for demo parent account
- **Environments**: Development, Preview only

#### `DEMO_TEACHER_PASSWORD`

- **Type**: Secret
- **Description**: Password for demo teacher account
- **Environments**: Development, Preview only

#### `DEMO_ADMIN_PASSWORD`

- **Type**: Secret
- **Description**: Password for demo admin account
- **Environments**: Development, Preview only

---

## Step-by-Step: Adding Variables to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Navigate to Project Settings**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

2. **Add Each Variable**
   - Click "Add New" button
   - Enter the **Key** (variable name)
   - Enter the **Value** (the secret/config value)
   - Select the environments where it should be available:
     - ☑️ Development
     - ☑️ Preview
     - ☑️ Production
   - Click "Save"

3. **Verify Variables**
   - Check that all required variables are listed
   - Ensure correct environment assignments
   - Look for any warnings or conflicts

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add VARIABLE_NAME

# Follow prompts to:
# 1. Enter the value
# 2. Select environments (Development/Preview/Production)
```

### Method 3: Bulk Import from .env file

```bash
# Pull existing env vars (creates .env files)
vercel env pull

# Edit .env.production, .env.preview, .env.development

# Push back to Vercel
vercel env add < .env.production
```

---

## Environment Variable Checklist

Use this checklist to ensure all required variables are configured:

### ✅ Required for All Environments (Development, Preview, Production)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `JWT_SECRET`
- [ ] `PINECONE_API_KEY`
- [ ] `PINECONE_ENVIRONMENT`

### ✅ Development Only

- [ ] `OPENAI_API_KEY`
- [ ] `ENABLE_DEMO_CREDENTIALS=true`
- [ ] `DEMO_PARENT_PASSWORD`
- [ ] `DEMO_TEACHER_PASSWORD`
- [ ] `DEMO_ADMIN_PASSWORD`

### ✅ Preview & Production

- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `SENTRY_DSN` (optional)

### ✅ Production Only

- [ ] `ENABLE_DEMO_CREDENTIALS=false` (CRITICAL for security)
- [ ] `SENTRY_AUTH_TOKEN` (optional)

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Ensure `.env` files are in `.gitignore`
   - Never hardcode secrets in source code

2. **Use different secrets for different environments**
   - Generate new `JWT_SECRET` for each environment
   - Use separate Supabase projects for dev/staging/prod

3. **Rotate secrets regularly**
   - Change API keys periodically
   - Update `JWT_SECRET` every 90 days minimum

4. **Limit access**
   - Only grant Vercel project access to necessary team members
   - Use Vercel's built-in roles (Viewer/Developer/Owner)

5. **Monitor usage**
   - Check Supabase logs for unauthorized access
   - Monitor Vercel deployment logs for errors
   - Set up Sentry alerts for production issues

---

## Testing Your Configuration

After setting up all environment variables:

1. **Trigger a new deployment**

   ```bash
   git commit --allow-empty -m "test: trigger Vercel deployment"
   git push
   ```

2. **Check build logs**
   - Go to Vercel dashboard > Deployments
   - Click on the latest deployment
   - Review logs for missing environment variables

3. **Test the deployed application**
   - Visit the deployment URL
   - Test Supabase authentication
   - Test real-time features
   - Check that demo credentials work (dev/preview only)

4. **Verify Supabase connection**
   ```bash
   # Test from your deployed app
   curl https://your-app.vercel.app/api/health
   ```

---

## Troubleshooting

### Build fails with "Missing environment variable"

**Solution**: Check the build logs for the specific variable name, then add it in Vercel dashboard

### "Supabase client error: Invalid JWT"

**Solution**: Verify that `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches your Supabase project

### Rate limiting not working in production

**Solution**: Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set for Production environment

### Demo credentials work in production (SECURITY ISSUE!)

**Solution**: Immediately set `ENABLE_DEMO_CREDENTIALS=false` for Production environment

---

## Migration Notes

### From WebSocket to Supabase Realtime

As of commit `f469894`, the application now uses Supabase Realtime instead of external WebSocket servers:

- ❌ **Removed**: `NEXT_PUBLIC_WS_URL` is no longer needed
- ✅ **Using**: Supabase Realtime (included with `NEXT_PUBLIC_SUPABASE_URL`)
- **Action**: You can safely remove `NEXT_PUBLIC_WS_URL` from Vercel environment variables

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase project logs
3. Review this documentation
4. Check project README and CLAUDE.md for additional context
5. Open an issue in the GitHub repository

---

**Last Updated**: January 2025
**Document Version**: 1.0
**Deployment Platform**: Vercel
**Database**: Supabase PostgreSQL + Realtime
