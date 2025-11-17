# GuruKool HomeSchool - Documentation Index

**Last Updated**: 2025-11-17

This document provides an organized index of all documentation for the GuruKool HomeSchool project.

---

## 🚀 Quick Start

- [README.md](../README.md) - Main project documentation
- [CLAUDE.md](../CLAUDE.md) - Guidelines for Claude Code development

---

## 📖 Setup Guides

### Initial Setup

- [Database Setup](guides/setup/DATABASE_SETUP.md) - PostgreSQL and Supabase configuration
- [Supabase Setup](guides/setup/SUPABASE_SETUP.md) - Supabase project setup and configuration
- [Quick Start Migrations](guides/setup/QUICK_START_MIGRATIONS.md) - Database migration quick start
- [Upstash Redis Setup](guides/setup/UPSTASH_REDIS_SETUP.md) - Redis rate limiting setup

---

## 🚀 Deployment Guides

- Coming soon (moved from root to archive/reports/deployment/)

---

## ✨ Feature Guides

### Authentication & User Management

- [How to Login as Teacher](guides/features/HOW_TO_LOGIN_AS_TEACHER.md) - Teacher login and authentication flow

### QR Code System

- [QR Scanner Features Explained](guides/qr-code/QR_SCANNER_FEATURES_EXPLAINED.md) - QR scanner feature overview
- [QR Scanner Not Reading Fix](guides/qr-code/QR_SCANNER_NOT_READING_FIX.md) - Troubleshooting QR scanner issues
- [QR Scanner Troubleshooting](guides/qr-code/QR_SCANNER_TROUBLESHOOTING_FIX.md) - Additional QR scanner troubleshooting

---

## 📱 Flutter Mobile App

- [Flutter Mobile App Integration Guide](guides/flutter/FLUTTER_MOBILE_APP_INTEGRATION_GUIDE.md) - Integrating Flutter mobile app
- [Flutter Mobile App TODO](guides/flutter/FLUTTER_MOBILE_APP_TODO.md) - Flutter development tasks and plan
- [Flutter Development Plan](../FLUTTER_DEVELOPMENT_PLAN.md) - Comprehensive 6-week development plan
- [AI Agent Architecture](../AI_AGENT_ARCHITECTURE.md) - Autonomous AI agents for Flutter development

---

## 🏗️ Architecture & Design

- [Architecture Review Report](architecture/ARCHITECTURE_REVIEW_REPORT.md) - Comprehensive architecture analysis and recommendations
- [Conversation Summary](../CONVERSATION_SUMMARY.md) - Latest development conversation summary

---

## 🔌 API Documentation

- [API Documentation](api/API_DOCUMENTATION.md) - Complete API reference (if exists)

---

## 🤖 Autonomous Agents

### Implemented Agents

- [Orchestrator Agent](../agents/autonomous/orchestrator.agent.ts) - Autonomous project manager
- [UI/UX Designer Agent](../agents/autonomous/ui-designer.agent.ts) - Autonomous designer & frontend prototyper

### Agent Status

- [Autonomous Agents Status](../AUTONOMOUS_AGENTS_STATUS.md) - Implementation status and usage guide

---

## 📦 Scripts

### Setup Scripts

Located in `scripts/setup/`:

- `create-parent-account.js` - Create parent account
- `create-user-profile.js` - Create user profile
- `setup-demo-accounts.js` - Setup demo accounts
- `setup-parent-yezdani.js` - Setup parent Yezdani account
- `verify-setup.js` - Verify setup

### Testing Scripts

Located in `scripts/testing/`:

- `test-signup.js` - Test signup flow
- `test-teacher-creation.js` - Test teacher creation
- `test-qr-scanner-validation.js` - Test QR scanner validation
- `comprehensive-qr-test.js` - Comprehensive QR testing

### Migration Scripts

Located in `scripts/migrations/`:

- `apply-migration-007.js` - Apply synchronization trigger
- `check-migration-007-status.js` - Check migration status
- `verify-sync-mechanism.js` - Verify sync mechanism

### Database Scripts

Located in `scripts/database/`:

- `CHECK_DATABASE_STATE.sql` - Check database state
- `VERIFY_AND_RETRY.sql` - Verify and retry operations

---

## 🧪 Testing

### Test Files

Located in `tests/`:

- `test-deployed-signup.html` - Deployed signup test

### Test Outputs

Located in `tests/outputs/`:

- `test-output-qr-auth.png` - QR auth test output
- `test-output-qr-general.png` - QR general test output
- `test-output-qr-teacher.png` - QR teacher test output

---

## 📁 Archive

All historical reports, summaries, and completed documentation are archived in `archive/reports/`:

### Deployment Reports

- `archive/reports/deployment/` - Deployment summaries and fixes

### QR Code Reports

- `archive/reports/qr-code/` - QR scanner fixes and implementation reports

### Testing Reports

- `archive/reports/testing/` - Test summaries and UI testing guides

### Implementation Reports

- `archive/reports/implementation/` - Implementation summaries and phase reports

### Fix Reports

- `archive/reports/fixes/` - Critical fixes and service layer fixes

### Migration Reports

- `archive/reports/migrations/` - Migration guides and instructions

### Analysis Reports

- `archive/reports/analysis/` - Gap analysis, validation reports, security audits

### Summaries

- `archive/reports/summaries/` - Final summaries and production ready reports

---

## 🛠️ Configuration Files

Located in project root:

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `vercel.json` - Vercel deployment configuration
- `jest.config.js` - Jest testing configuration
- `playwright.config.ts` - Playwright E2E testing configuration
- `vitest.config.ts` - Vitest testing configuration
- `.gitignore` - Git ignore rules
- `middleware.ts` - Next.js middleware
- `docker-compose.yml` - Docker composition
- `Dockerfile` - Docker configuration

---

## 📝 Temporary Files

Located in `temp/` (gitignored):

- Build outputs
- Log files
- Type check reports
- JSON reports

---

## 🔗 External Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/miqhtpbutevdrkyndflf)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Repository](https://github.com/maneabhishek1983/GuruKool-HomeSchool)

---

## 📚 Additional Resources

### Development Plans

- [Flutter Development Plan](../FLUTTER_DEVELOPMENT_PLAN.md) - 6-week Flutter mobile app plan
- [AI Agent Architecture](../AI_AGENT_ARCHITECTURE.md) - Autonomous agents architecture

### Status Documents

- [Autonomous Agents Status](../AUTONOMOUS_AGENTS_STATUS.md) - Agent implementation status
- [Conversation Summary](../CONVERSATION_SUMMARY.md) - Latest development summary

---

## 🎯 Next Steps

1. **Install Flutter SDK** (see Flutter Development Plan)
2. **Initialize Flutter Project** (use Orchestrator Agent)
3. **Begin Week 1 Development** (Auth & Foundation)

---

**Navigation**: [← Back to README](../README.md)
