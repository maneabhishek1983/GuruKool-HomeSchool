---
description: Deploy to Vercel with pre-deployment checks and validation
allowed-tools: [Bash, Read]
---

# Deploy to Vercel

Deploy GuruKool HomeSchool web application to Vercel with comprehensive pre-deployment validation.

## Arguments

- **$1**: Environment (optional: `production`, `preview`, `staging`) - defaults to `production`

## Pre-Deployment Checklist (CRITICAL)

### 1. Code Quality Verification

```bash
echo "🔍 Step 1: Code Quality Checks..."

# TypeScript type checking (MUST PASS)
echo "  → Running TypeScript type-check..."
npm run type-check

if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Fix before deploying."
  exit 1
fi

# ESLint
echo "  → Running ESLint..."
npm run lint

if [ $? -ne 0 ]; then
  echo "⚠️ ESLint errors found. Consider fixing before deploying."
fi
```

### 2. Test Suite Validation

```bash
echo "🧪 Step 2: Test Suite..."

# Unit tests
echo "  → Running unit tests..."
npm test

if [ $? -ne 0 ]; then
  echo "❌ Unit tests failing. Fix before deploying."
  exit 1
fi

# E2E tests
echo "  → Running E2E tests..."
npm run test:e2e

if [ $? -ne 0 ]; then
  echo "❌ E2E tests failing. Fix before deploying."
  exit 1
fi
```

### 3. Security Verification

```bash
echo "🔒 Step 3: Security Checks..."

# Security tests
echo "  → Running security tests..."
npm run test:security

# RLS policies
echo "  → Verifying RLS policies..."
npm run verify:rls

# Supabase connection
echo "  → Verifying Supabase connection..."
npm run verify:supabase

# kluster.ai verification
echo "  → kluster.ai security verification..."
# (runs automatically)
```

### 4. Build Verification

```bash
echo "🏗️ Step 4: Production Build..."

# Clean previous build
if [ -d ".next" ]; then
  rm -rf .next
fi

# Production build
echo "  → Building for production..."
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
  echo "❌ Production build failed. Fix build errors."
  exit 1
fi

echo "✅ Production build successful"
```

### 5. Environment Variables Check

```bash
echo "🔑 Step 5: Environment Variables..."

# Check required env vars
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "JWT_SECRET"
  "NEXT_PUBLIC_QR_SECRET"
)

echo "  → Checking required environment variables..."

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️ $var not set in environment"
  else
    echo "  ✅ $var is set"
  fi
done
```

## Deployment Process

### Production Deployment

```bash
echo "🚀 Deploying to Production..."

# Ensure on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️ Warning: Not on main branch. Current: $CURRENT_BRANCH"
  echo "Switch to main for production deployment? (y/n)"
  # User confirmation needed
fi

# Check git status
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Warning: Uncommitted changes detected"
  echo "Commit changes before deploying? (y/n)"
  # User confirmation needed
fi

# Deploy with Vercel CLI
npx vercel --prod

# Or push to main (triggers auto-deploy)
git push origin main
```

### Preview Deployment

```bash
echo "🔍 Deploying Preview..."

# Deploy current branch
npx vercel

echo "✅ Preview deployment complete"
echo "Preview URL will be provided by Vercel"
```

### Staging Deployment

```bash
echo "🎭 Deploying to Staging..."

# Deploy to staging environment
npx vercel --environment staging

echo "✅ Staging deployment complete"
```

## Post-Deployment Verification

### 1. Smoke Tests

```bash
echo "🔥 Step 6: Post-Deployment Smoke Tests..."

# Wait for deployment to be live
sleep 30

# Get deployment URL
DEPLOY_URL=$(npx vercel inspect --json | jq -r '.url')

echo "  → Testing deployment at: $DEPLOY_URL"

# Test homepage
curl -f "https://$DEPLOY_URL" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Homepage accessible"
else
  echo "  ❌ Homepage not accessible"
fi

# Test API health endpoint
curl -f "https://$DEPLOY_URL/api/health" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ API health check passed"
else
  echo "  ❌ API health check failed"
fi
```

### 2. Critical Path Testing

```bash
echo "  → Testing critical paths..."

# Test authentication
curl -f "https://$DEPLOY_URL/login" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Login page accessible"
else
  echo "  ❌ Login page not accessible"
fi

# Test API endpoints
curl -f "https://$DEPLOY_URL/api/students" \
  -H "Authorization: Bearer test-token" > /dev/null 2>&1
# (Use actual test credentials)
```

### 3. Performance Check

```bash
echo "  → Checking performance..."

# Lighthouse CI (if configured)
# npx lhci autorun

# Manual checks
echo "  → Check Vercel Analytics for:"
echo "    - Response times"
echo "    - Error rates"
echo "    - Cold start times"
```

## Rollback Procedure

If deployment fails or issues detected:

```bash
echo "⚠️ Rolling back deployment..."

# Rollback to previous deployment
npx vercel rollback

echo "✅ Rolled back to previous stable version"
```

## Environment-Specific Configuration

### Production

```bash
# Environment: production
# Branch: main
# URL: https://gurukool-homeschool.vercel.app
# Variables: All production secrets
# Demo credentials: DISABLED
```

### Staging

```bash
# Environment: staging
# Branch: develop
# URL: https://gurukool-homeschool-staging.vercel.app
# Variables: Staging secrets
# Demo credentials: ENABLED
```

### Preview

```bash
# Environment: preview
# Branch: feature/*
# URL: https://gurukool-homeschool-<branch>.vercel.app
# Variables: Development secrets
# Demo credentials: ENABLED
```

## Vercel Configuration

Ensure `vercel.json` is configured:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

## Required Vercel Environment Variables

Set in Vercel Dashboard → Project Settings → Environment Variables:

**Production:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `NEXT_PUBLIC_QR_SECRET`
- `ENABLE_DEMO_CREDENTIALS=false`
- `UPSTASH_REDIS_REST_URL` (if using Redis)
- `UPSTASH_REDIS_REST_TOKEN` (if using Redis)

**Staging/Preview:**

- Same as production
- `ENABLE_DEMO_CREDENTIALS=true`

## Deployment Checklist

Pre-deployment:

- [ ] All tests passing (unit, E2E, security)
- [ ] TypeScript type-check passes (0 errors)
- [ ] Production build succeeds
- [ ] RLS policies verified
- [ ] kluster.ai verification passes
- [ ] Environment variables configured
- [ ] No uncommitted changes (for production)
- [ ] On correct branch (main for production)

Post-deployment:

- [ ] Homepage accessible
- [ ] API health check passes
- [ ] Login flow works
- [ ] Critical paths tested
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Vercel Analytics reviewed

## Success Criteria

- [ ] Pre-deployment checks pass
- [ ] Build succeeds
- [ ] Deployment completes
- [ ] Smoke tests pass
- [ ] No critical errors in logs
- [ ] Performance within acceptable range

## Example Usage

```bash
# Deploy to production (with all checks)
/deploy production

# Deploy preview
/deploy preview

# Deploy to staging
/deploy staging

# Deploy with default (production)
/deploy
```

## Emergency Procedures

### Deployment Fails

1. Check build logs in Vercel Dashboard
2. Verify environment variables
3. Check for TypeScript errors
4. Review recent commits
5. Rollback if necessary

### Production Issues After Deploy

1. Immediate rollback: `npx vercel rollback`
2. Check Vercel logs for errors
3. Verify Supabase connection
4. Check API endpoints
5. Monitor error tracking (if configured)

### Database Migration Issues

1. Verify migration applied correctly
2. Check RLS policies are active
3. Test API endpoints manually
4. Rollback migration if needed
5. Revert code changes

## Notes

- Never skip pre-deployment checks
- Always test locally with production build first
- Production deploys require main branch
- Demo credentials must be disabled in production
- Monitor Vercel Analytics after deployment
- Keep rollback plan ready
- Notify team of production deployments
