# Production Domain Cutover Checklist

**Purpose:** Move `www.gurukool.co.uk` from the stale Vercel project
(`gurukool-homeschool.vercel.app`, last deploy weeks/months ago) to the
active project receiving GitHub pushes
(`gurukool-homeschool-q2l0rdmgo-abhishek-manes-projects-efbe2a67.vercel.app`,
org `abhishek-manes-projects-efbe2a67`).

Without this cutover, every commit you push is invisible to end users.

**Estimated total time:** 20–40 minutes
**Reversible:** Yes, by moving the domain back. DNS propagation may take 5–15 min each way.

---

## Phase 1 — Pre-cutover verification (do not skip)

Confirm you know which project is which **before** you touch any domain.

### 1.1 Identify both projects in the Vercel dashboard

- Open https://vercel.com/dashboard
- Find two projects with `gurukool` in the name:
  - **OLD** (currently serving public domain): last deployment timestamp = weeks+ ago
  - **NEW** (receiving recent pushes): last deployment timestamp = today, commit `902558f` or newer at top
- Note both project URLs/slugs. If you can't find both — STOP and contact whoever set up the original deployment.

### 1.2 Confirm the NEW project is actually building from the right repo

- New project → Settings → Git → confirm `Connected to: maneabhishek1983/GuruKool-HomeSchool`, branch `main`
- New project → Deployments → confirm the top entry shows commit `902558f` (or whatever is currently at the tip of `origin/main`) and state `Ready`

### 1.3 Confirm env vars on the NEW project

Without these, the new code crashes at runtime — see `docs/BIOMETRIC_THREAT_MODEL.md`.

New project → Settings → Environment Variables. Each MUST be set for `Production`:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (same as old project)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as old)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (same as old)
- [ ] `JWT_SECRET` (≥16 chars; **required** for biometric and face challenge tokens)
- [ ] `NEXT_PUBLIC_QR_SECRET` (same as old, otherwise existing QR codes stop validating)
- [ ] `FACE_ENCRYPTION_KEY` (same as old, otherwise enrolled faces can't be decrypted)
- [ ] `NEXT_PUBLIC_WEBAUTHN_RP_ID` = `gurukool.co.uk` (no scheme, no `www.`, no port)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://www.gurukool.co.uk`
- [ ] Any AI keys the old project used (`OPENAI_API_KEY` in dev only; Chomsky/APIM/OKTA in prod per CLAUDE.md)
- [ ] Leave `FACE_CHALLENGE_REQUIRED` UNSET (default: optional; flip to `true` after one release of real-world traffic)
- [ ] Leave `NEXT_PUBLIC_FACE_LIVENESS_REQUIRED` UNSET (default: liveness ON)

**Easiest way to copy:** Old project → Settings → Environment Variables → copy each value into the New project.

### 1.4 Apply Supabase migration 016 FIRST

The new code relies on the `Teachers can view their own QR codes` RLS policy.
If you cut over without applying it, teacher QR check-in will fail.

- Open https://supabase.com/dashboard/project/miqhtpbutevdrkyndflf/sql/new
- Paste from `supabase/migrations/016_fix_teacher_qr_codes_rls.sql`
- Click Run
- Verify: `SELECT policyname FROM pg_policies WHERE tablename='teacher_qr_codes' AND policyname='Teachers can view their own QR codes';` returns exactly one row

### 1.5 Force a fresh build on the NEW project AFTER env vars are set

Env var changes don't auto-redeploy. Either:

- New project → Deployments → latest → Redeploy (with the new env vars)
- OR push a no-op commit

Wait for the rebuild to show `Ready` before proceeding.

---

## Phase 2 — Cutover

### 2.1 Tell the team

Cutover is invisible internally but is a real production change. Drop a note in your team channel: "Moving gurukool.co.uk to new Vercel project at HH:MM. Expect 5–15 min of mixed DNS state."

### 2.2 Move the domain

**OLD project** → Settings → Domains:

- Find `www.gurukool.co.uk` and `gurukool.co.uk` (if both exist)
- Click "Remove" or "Transfer" for each
  - Vercel may offer "Move to another project" — choose that, target = NEW project
  - If only "Remove" is offered: remove here, then add on the NEW project (next step)

**NEW project** → Settings → Domains → Add Domain:

- Add `www.gurukool.co.uk`
- Add `gurukool.co.uk` and set as redirect to `www.` (or vice versa — match the old setup)
- Vercel will show DNS instructions; since the domain already pointed to Vercel's nameservers, no DNS change should be needed — just SSL re-issuance (1–3 min)

### 2.3 Wait for SSL to issue

- NEW project → Settings → Domains → both entries should show valid SSL within ~3 min
- If stuck after 10 min, click "Refresh" or check DNS at https://www.whatsmydns.net/

---

## Phase 3 — Immediate post-cutover smoke tests

Run all of these **within 5 minutes** of cutover. If ANY fail, jump to Phase 5 (rollback).

### 3.1 Domain serves the new project

```bash
curl -sS -o /dev/null -w "HTTP %{http_code}\n" https://www.gurukool.co.uk/login
```

Expect: **`HTTP 200`** (the old project returned 404 here).

### 3.2 New routes exist

```bash
curl -sS -X GET https://www.gurukool.co.uk/api/biometric/verify | head -c 200
```

Expect: JSON containing `"version":"2.0"` and `"Verify a WebAuthn assertion"`. Old project returned `Method Not Allowed`.

### 3.3 Deleted route is gone

```bash
curl -sS -o /dev/null -w "HTTP %{http_code}\n" https://www.gurukool.co.uk/api/debug/teachers
```

Expect: **`HTTP 404`** (NOT `200` — would mean the leak is live).

### 3.4 Auth boundary holds

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://www.gurukool.co.uk/api/teacher-sessions/face-challenge \
  -H "Content-Type: application/json" -d '{"studentId":"00000000-0000-0000-0000-000000000000"}'
```

Expect: **`401`** (unauthenticated request rejected).

### 3.5 Health endpoint

```bash
curl -sS https://www.gurukool.co.uk/api/health
```

Expect: 2xx response with health JSON. If `404`, the new project may not have built — check Vercel dashboard.

### 3.6 PWA service worker still served

```bash
curl -sS -I https://www.gurukool.co.uk/sw.js | head -5
```

Expect: `HTTP/2 200` with `content-type: application/javascript`. (PWA was set up on old project; confirm next-pwa works after cutover.)

---

## Phase 4 — Functional smoke tests (next 30 minutes)

These need a real browser, real account. Run as a teacher who has at least one enrolled student.

- [ ] **Login** at https://www.gurukool.co.uk/login with a known good account → reaches dashboard
- [ ] **Logout + re-login** — confirms session cookies work on the new project (cookies are domain-bound, should carry over, but verify)
- [ ] **Teacher dashboard** loads without console errors (open DevTools)
- [ ] **Face enrollment** for a test student — completes without error
- [ ] **Face check-in** as the assigned teacher:
  - Hold camera up — should display "Blink slowly to confirm liveness"
  - After blink → green box + descriptor submitted
  - Server responds with match result
- [ ] **QR check-in** as the assigned teacher (existing flow, regression check)
- [ ] Watch the **Vercel Functions logs** for any 5xx spikes during the first 10 min of real traffic

---

## Phase 5 — Rollback (if Phase 3 or 4 fails)

The cutover is safe to reverse for 24–48 hours; after that, cookies/sessions may diverge enough that some users get logged out on rollback.

### 5.1 Quick rollback

- NEW project → Settings → Domains → remove `www.gurukool.co.uk`
- OLD project → Settings → Domains → re-add `www.gurukool.co.uk`
- Wait ~3 min for SSL on the old project to re-validate

### 5.2 If rollback fails too (rare)

- Worst case: DNS at registrar level. Log into your domain registrar, point `www` and apex back to Vercel's nameservers if changed. Allow up to 1 hour for TTL.

### 5.3 What to keep before re-attempting

- Screenshot Vercel build logs for the failed deploy
- `gh api repos/maneabhishek1983/GuruKool-HomeSchool/deployments/<id>/statuses` output
- Browser console errors from any failed smoke test
- Function logs from Vercel for the cutover window

---

## Phase 6 — After cutover (within 24 hours)

- [ ] Update `docs/BIOMETRIC_THREAT_MODEL.md` QA checklist sign-off section with results from Phase 4
- [ ] Delete the OLD Vercel project (or rename to `gurukool-homeschool-LEGACY` to make it obvious it's not live)
- [ ] Verify `e2e/auth.setup.ts` and `e2e/biometric-flow.spec.ts` run against the new domain in CI (they use `BASE_URL` env var; set it on the workflow to `https://www.gurukool.co.uk`)
- [ ] Rotate the OpenAI key in `~/.claude/CLAUDE.md` (long-standing item; cutover is a good forcing function)

---

## Phase 7 — When to flip the safety flags

After **at least one full release cycle of clean prod traffic** (no biometric/face errors in Vercel function logs):

- Set `FACE_CHALLENGE_REQUIRED=true` in NEW project env → forces all face-verify calls to include a challenge token. Closes the descriptor-replay residual risk.
- Keep `NEXT_PUBLIC_FACE_LIVENESS_REQUIRED` unset (= ON) unless real-world friction shows up in support tickets.

Both flips are safe to redeploy individually; no DB or migration changes needed.
