# Vercel Deployment Guide - GuruKool Web App

**Date**: 2025-11-17
**Purpose**: Complete guide for deploying the Next.js web application to Vercel

---

## 🌐 Overview

Vercel is the recommended hosting platform for the GuruKool HomeSchool Next.js web application. It provides:

- ✅ **Automatic deployments** from GitHub
- ✅ **Preview deployments** for pull requests
- ✅ **Edge functions** for serverless API routes
- ✅ **Global CDN** for fast performance
- ✅ **Custom domains** support
- ✅ **Environment variables** management
- ✅ **Analytics** and monitoring

**Current deployment**: https://gurukool-homeschool.vercel.app

---

## 🚀 Quick Start

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** with GitHub account
3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"
4. **Configure**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (root of repo)
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. **Add Environment Variables** (see section below)
6. **Deploy**: Click "Deploy"

**Time**: ~5 minutes for first deployment

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd C:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src
vercel

# Follow prompts:
# - Link to existing project? (Y/n)
# - Which project? gurukool-homeschool
# - Deploy to production? (Y/n)
```

---

## 🔧 Configuration

### 1. vercel.json

Already configured in project root:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Regions**:

- `iad1` - Washington, D.C., USA (East Coast)
- `sfo1` - San Francisco, USA (West Coast)
- `lhr1` - London, UK
- Multiple regions for global edge deployment

### 2. next.config.mjs

Already configured for Vercel:

```javascript
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default config;
```

---

## 🌍 Environment Variables

### Required Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

#### Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL=https://miqhtpbutevdrkyndflf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (server-only)
```

#### Security

```
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_QR_SECRET=V8kuJywCmGbs650GkM0qwnKkwHoRPbqSJphwcyUfsaQ=
```

#### Redis (Upstash) for Rate Limiting

```
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

#### Optional Integrations

```
OPENAI_API_KEY=sk-proj-... (development only)
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-pinecone-environment
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

#### Demo Credentials (Development/Preview only)

```
DEMO_PARENT_PASSWORD=parent123
DEMO_ADMIN_PASSWORD=admin123
DEMO_TEACHER_PASSWORD=teacher123
ENABLE_DEMO_CREDENTIALS=false (set to true for development)
```

### Setting Environment Variables

**Via Vercel Dashboard**:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable with appropriate scope:
   - **Production**: Live site
   - **Preview**: Pull request previews
   - **Development**: Local development

**Via Vercel CLI**:

```bash
# Add single variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Pull environment variables to .env.local
vercel env pull .env.local
```

**Using `.env.example`** as reference:

1. Copy `.env.example` → `.env.production`
2. Fill in production values
3. Upload to Vercel:
   ```bash
   # From VERCEL_ENV_VARS.txt
   vercel env add --< VERCEL_ENV_VARS.txt
   ```

---

## 🔄 Deployment Workflow

### Automatic Deployments

Vercel automatically deploys:

1. **Production**: Every push to `main` branch
   - URL: https://gurukool-homeschool.vercel.app
   - Requires passing checks (lint, type-check, tests)

2. **Preview**: Every pull request
   - URL: https://gurukool-homeschool-{pr-id}.vercel.app
   - Unique URL for each PR
   - Automatic comment in PR with preview link

3. **Development**: Every push to other branches
   - URL: https://gurukool-homeschool-{branch}.vercel.app
   - Test features before PR

### Manual Deployments

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
git checkout feature-branch
vercel
```

---

## 📦 Build Settings

### Build Command

```bash
npm run build
```

**What it does**:

1. Runs ESLint checks
2. Runs TypeScript type checking
3. Builds Next.js production bundle
4. Optimizes images and assets
5. Generates static pages

### Install Command

```bash
npm install
```

Vercel uses `package-lock.json` to ensure consistent dependencies.

### Output Directory

```
.next
```

Next.js stores production build in `.next/` directory.

---

## 🔒 Production Hardening

### Security Headers

Already configured in `next.config.mjs`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        // ... more headers
      ],
    },
  ];
}
```

### Content Security Policy (CSP)

Environment-aware CSP configured in `next.config.mjs`.

**Production**: Stricter policy
**Development**: More permissive for Vercel Live and dev tools

### Rate Limiting

Implemented in `src/lib/api-security.ts`:

**Current**: In-memory per-instance
**Recommended for production**: Upstash Redis for distributed rate limiting

---

## 🌐 Custom Domain

### Add Custom Domain

1. **Go to Vercel Dashboard**:
   - Project → Settings → Domains

2. **Add Domain**:
   - Enter domain: `gurukool.com`
   - Click "Add"

3. **Configure DNS**:

   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP)

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Verify**: Wait for DNS propagation (up to 48 hours)

### SSL Certificate

Vercel automatically provisions SSL certificates:

- Let's Encrypt certificates
- Automatic renewal
- HTTPS enforced by default

---

## 📊 Monitoring & Analytics

### Vercel Analytics

**Enable**:

1. Project → Analytics
2. Toggle "Enable Analytics"
3. View metrics:
   - Page views
   - Top pages
   - Top referrers
   - Device types
   - Countries

### Vercel Web Vitals

Monitors Core Web Vitals:

- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1

### Sentry Integration (Optional)

Already configured for error tracking:

```javascript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## 🐛 Debugging Deployments

### View Build Logs

1. Go to Vercel Dashboard
2. Select deployment
3. Click "View Build Logs"
4. Check for errors

### Common Issues

**Issue 1: Build Failed - Type Errors**

```
Error: Type 'X' is not assignable to type 'Y'
```

**Fix**:

```bash
# Run locally first
npm run type-check

# Fix errors
# Then commit and push
```

**Issue 2: Build Failed - ESLint Errors**

```
Error: ESLint found warnings/errors
```

**Fix**:

```bash
# Run locally
npm run lint

# Fix errors or suppress specific rules
# eslint-disable-next-line
```

**Issue 3: Environment Variable Not Found**

```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Fix**:

1. Go to Vercel → Settings → Environment Variables
2. Add missing variable
3. Redeploy

**Issue 4: Function Timeout**

```
Error: Function execution timed out after 10s
```

**Fix**:

- Optimize API route
- Increase timeout in `vercel.json`:
  ```json
  {
    "functions": {
      "api/**/*": {
        "maxDuration": 30
      }
    }
  }
  ```

---

## 🚀 Deployment Best Practices

### 1. Test Locally First

```bash
# Build production bundle
npm run build

# Test production build
npm start

# Verify:
# - No build errors
# - All features work
# - No console errors
```

### 2. Use Preview Deployments

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create PR → Vercel auto-deploys preview
# Test preview URL before merging
```

### 3. Environment-Specific Config

```javascript
// Use environment variables
const apiUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://api.gurukool.com'
    : 'http://localhost:3000';
```

### 4. Monitor After Deployment

- Check Vercel Analytics for errors
- Monitor Sentry for runtime errors
- Review Web Vitals scores
- Test critical user flows

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] All features tested locally
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] All tests pass (`npm test`)
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied in Supabase
- [ ] No hardcoded secrets in code

### Deployment

- [ ] Create PR for review
- [ ] Test preview deployment
- [ ] Merge to main
- [ ] Production deployment succeeds
- [ ] Verify production URL works

### Post-Deployment

- [ ] Test critical flows (login, QR generation, sessions)
- [ ] Check analytics for errors
- [ ] Monitor performance metrics
- [ ] Update documentation if needed

---

## 🔧 Advanced Configuration

### Edge Functions

Run API routes on Vercel's Edge Network:

```javascript
// app/api/example/route.ts
export const config = {
  runtime: 'edge',
};

export async function GET() {
  // Runs on edge, closer to users
  return Response.json({ message: 'Hello from Edge!' });
}
```

**Use for**: Lightweight, low-latency API routes

### ISR (Incremental Static Regeneration)

Automatically rebuild pages on-demand:

```javascript
// app/page.tsx
export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const data = await fetch('...');
  return <div>...</div>;
}
```

### Middleware

Run code before request completes:

```javascript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Redirect, rewrite, or modify request
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 📞 Support & Resources

**Vercel Documentation**:

- https://vercel.com/docs

**Deployment**:

- https://vercel.com/docs/deployments/overview

**Environment Variables**:

- https://vercel.com/docs/projects/environment-variables

**Custom Domains**:

- https://vercel.com/docs/projects/domains

**Edge Functions**:

- https://vercel.com/docs/functions/edge-functions

**Community**:

- Discord: https://vercel.com/discord
- GitHub: https://github.com/vercel/vercel

---

## ✅ Summary

### Current Setup

- ✅ **Deployed to**: https://gurukool-homeschool.vercel.app
- ✅ **Auto-deploy**: Enabled from `main` branch
- ✅ **Preview deploys**: Enabled for all PRs
- ✅ **Environment variables**: Configured
- ✅ **Custom domain**: Ready to add

### Next Steps

1. **Add custom domain** (optional): `gurukool.com`
2. **Enable Vercel Analytics**: Track usage
3. **Set up monitoring**: Sentry for errors
4. **Configure Redis**: For distributed rate limiting
5. **Optimize**: Review Web Vitals and improve

---

**Status**: ✅ **Production-ready and deployed**
**URL**: https://gurukool-homeschool.vercel.app
**Deployment time**: ~2 minutes per deployment
