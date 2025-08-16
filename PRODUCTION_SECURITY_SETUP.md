# Production Security Setup

This guide configures environment and deployment for the security middleware (CSRF, Rate Limiting, Security Headers).

## 1) Environment Variables

Set these in your hosting provider (Vercel/Render/Netlify/Docker env):

- CSRF_SECRET_KEY: a strong 32+ char random string
- NODE_ENV: production

Optionally:

- RATE_LIMIT_WINDOW_MS: 900000 (15 minutes)
- RATE_LIMIT_MAX: 100

## 2) Next.js Headers (already configured)

`next.config.mjs` configures CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy. No action required.

## 3) Middleware Order

We deploy a single `middleware.ts` at the repository root. It:

- Applies rate limiting to `/api/**`
- Applies CSRF protection for all requests (GET sets token, non-GET validates)

No additional config is required. Ensure `middleware.ts` is at project root.

## 4) Caching / CDNs

- Do not cache API responses that include `Set-Cookie` CSRF tokens.
- Honor `Vary: Cookie` where applicable.

## 5) Reverse Proxy

If using Nginx or a platform proxy, forward client IP headers:

- X-Forwarded-For
- X-Real-IP

Ensure your platform sets these correctly so rate limiting keys by IP work.

## 6) HTTPS

- Enforce HTTPS at platform level. HSTS is enabled by headers.

## 7) Deployment Checklist

- [ ] Set `CSRF_SECRET_KEY`
- [ ] Confirm `NODE_ENV=production`
- [ ] Verify headers on production (`curl -I https://your-domain`)
- [ ] Confirm CSRF set on GET and validated on POST (403 without header)
- [ ] Confirm 429 on burst requests to `/api/health`

## 8) Monitoring

- Track 403 (CSRF) and 429 (Rate limit) rates in logs/alerts
- Investigate spikes in 429 for potential abuse

## 9) Incident Response

- Rotate `CSRF_SECRET_KEY` if compromised
- Temporarily lower `RATE_LIMIT_MAX` during attack windows
