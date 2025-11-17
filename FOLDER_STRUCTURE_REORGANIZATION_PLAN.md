# Folder Structure Reorganization Plan

## Current State Analysis

### Root Directory Issues

- **100+ .md files** cluttering root directory
- **Multiple scripts** in root (should be in scripts/)
- **Test files** scattered (test-_.js, test-_.html)
- **Output files** (build-output.txt, \*.log files)
- **Temporary files** (type-check-_.txt, _.json reports)
- **Image files** (teacher-qr-_.png, test-output-_.png)

### Existing Structure

- `scripts/` folder exists with 40+ scripts
- `archive/` folder exists with some organization
- `docs/` folder does NOT exist (should be created)

## Proposed Folder Structure

```
gurukool-homeschool-src/
├── README.md (KEEP - main entry point)
├── docs/
│   ├── guides/
│   │   ├── setup/
│   │   │   ├── DATABASE_SETUP.md
│   │   │   ├── SUPABASE_SETUP.md
│   │   │   ├── QUICK_START_MIGRATIONS.md
│   │   │   └── UPSTASH_REDIS_SETUP.md
│   │   ├── deployment/
│   │   │   ├── DEPLOYMENT_CHECKLIST.md
│   │   │   ├── PRODUCTION_LAUNCH_CHECKLIST.md
│   │   │   ├── PRODUCTION_SECURITY_SETUP.md
│   │   │   ├── VERCEL_ENVIRONMENT_SETUP.md
│   │   │   ├── vercel-deployment-guide.md
│   │   │   └── QUICK_DEPLOY_GUIDE.md
│   │   ├── features/
│   │   │   ├── HOW_TO_LOGIN_AS_TEACHER.md
│   │   │   ├── TEACHER_INVITATION_SETUP_GUIDE.md
│   │   │   ├── TIMESHEET_IMPLEMENTATION_GUIDE.md
│   │   │   ├── TIMESHEET_QR_SYSTEM.md
│   │   │   ├── ACADEMIC_STANDARDS_FEATURE.md
│   │   │   └── BACKGROUND_IMAGE_FEATURES.md
│   │   ├── qr-code/
│   │   │   ├── QR_CODE_QUICK_REFERENCE.md
│   │   │   ├── QR_CODE_USER_VALIDATION_GUIDE.md
│   │   │   ├── QR_CODE_IOS_TESTING_GUIDE.md
│   │   │   ├── TEACHER_QR_SCANNER_GUIDE.md
│   │   │   ├── TEACHER_QR_BUTTONS_EXPLAINED.md
│   │   │   └── QR_SCANNER_FEATURES_EXPLAINED.md
│   │   └── flutter/
│   │       ├── FLUTTER_MOBILE_APP_INTEGRATION_GUIDE.md
│   │       └── FLUTTER_MOBILE_APP_TODO.md
│   ├── api/
│   │   └── API_DOCUMENTATION.md
│   ├── architecture/
│   │   ├── ARCHITECTURE_REVIEW_REPORT.md
│   │   ├── ARCHITECTURE_REVIEW_CRITICAL_FINDINGS.md
│   │   └── FOLDER_STRUCTURE_ANALYSIS.md
│   └── INDEX.md (updated DOCS_INDEX.md)
├── scripts/
│   ├── setup/
│   │   ├── create-parent-account.js (MOVE from root)
│   │   ├── create-user-profile.js (MOVE from root)
│   │   ├── setup-demo-accounts.js (MOVE from root)
│   │   ├── setup-parent-yezdani.js (MOVE from root)
│   │   └── verify-setup.js (MOVE from root)
│   ├── testing/
│   │   ├── test-signup.js (MOVE from root)
│   │   ├── test-teacher-creation.js (MOVE from root)
│   │   ├── test-qr-scanner-validation.js (MOVE from root)
│   │   └── comprehensive-qr-test.js
│   ├── migrations/
│   │   ├── apply-migration-007.js
│   │   └── check-migration-007-status.js
│   └── [keep existing scripts organized]
├── archive/
│   ├── reports/
│   │   ├── implementation/
│   │   │   ├── IMPLEMENTATION_SUMMARY.md
│   │   │   ├── FINAL_IMPLEMENTATION_SUMMARY.md
│   │   │   ├── APPLICATION_PLAN_SUMMARY.md
│   │   │   ├── PHASE_2_IMPLEMENTATION_REPORT.md
│   │   │   └── COMPREHENSIVE_APPLICATION_PLAN.md
│   │   ├── testing/
│   │   │   ├── APPLICATION_TESTING_SUMMARY.md
│   │   │   ├── TESTING_COMPLETE.md
│   │   │   ├── USER_JOURNEY_TEST_REPORT.md
│   │   │   ├── QR_END_TO_END_TEST_REPORT.md
│   │   │   └── STEP_BY_STEP_UI_TESTING_GUIDE.md
│   │   ├── fixes/
│   │   │   ├── FIXES_SUMMARY.md
│   │   │   ├── FIXES_IMPLEMENTED_SUMMARY.md
│   │   │   ├── CRITICAL_FIXES_PROGRESS.md
│   │   │   ├── P0_CRITICAL_BUGS_REPORT.md
│   │   │   ├── P0_CRITICAL_FIXES_PRODUCTION_READY.md
│   │   │   ├── SERVICE_LAYER_FIXES_COMPLETE.md
│   │   │   └── CLEANUP_SUMMARY.md
│   │   ├── qr-code/
│   │   │   ├── QR_CODE_FIX_SUMMARY.md
│   │   │   ├── QR_CODE_FIXES_COMPLETE.md
│   │   │   ├── QR_CODE_IMPLEMENTATION_ISSUES.md
│   │   │   ├── QR_CODE_IOS_FIX_REPORT.md
│   │   │   ├── QR_CODE_FLOW_VALIDATION.md
│   │   │   ├── QR_CODE_VALIDATION_REPORT.md
│   │   │   ├── QR_SCANNER_IMPLEMENTATION_COMPLETE.md
│   │   │   ├── QR_SCANNER_IMPLEMENTATION_SUMMARY.md
│   │   │   ├── QR_SCANNER_NOT_READING_FIX.md
│   │   │   ├── QR_SCANNER_TROUBLESHOOTING_FIX.md
│   │   │   ├── QR_SYSTEM_COMPATIBILITY_FIX.md
│   │   │   ├── QR_USABILITY_FIXES_REPORT.md
│   │   │   ├── QR_FIX_DEPLOYMENT_SUMMARY.md
│   │   │   ├── MOBILE_QR_SCANNER_FIX.md
│   │   │   └── COMPLETE_QR_SYSTEM_SUMMARY.md
│   │   ├── deployment/
│   │   │   ├── FINAL_DEPLOYMENT_SUMMARY.md
│   │   │   ├── VERCEL_DEPLOYMENT_FIX.md
│   │   │   ├── VERCEL_DEPLOYMENT_ISSUES.md
│   │   │   ├── VERCEL_DEPLOYMENT_SUMMARY.md
│   │   │   ├── DEPLOYMENT_GAPS.md
│   │   │   └── DEPLOYMENT_CREDENTIALS.md
│   │   ├── migrations/
│   │   │   ├── APPLY_MIGRATION_007_NOW.md
│   │   │   ├── APPLY_MIGRATION_008.md
│   │   │   ├── APPLY_MIGRATION_010.md
│   │   │   ├── APPLY_MIGRATIONS_008_AND_009.md
│   │   │   ├── APPLY_MIGRATIONS_GUIDE.md
│   │   │   ├── APPLY_MIGRATIONS.md
│   │   │   ├── APPLY_TIMESHEET_MIGRATION.md
│   │   │   ├── AUTOMATED_MIGRATIONS_QUICKSTART.md
│   │   │   ├── MANUAL_MIGRATION_ALL_IN_ONE.md
│   │   │   ├── MIGRATION_007_INSTRUCTIONS.md
│   │   │   ├── MIGRATION_FIX_GUIDE.md
│   │   │   ├── QUICK_FIX_MIGRATION.md
│   │   │   ├── SETUP_AUTOMATED_MIGRATIONS_NOW.md
│   │   │   ├── FIX_MIGRATION_CONFLICT.md
│   │   │   └── FIX_UUID_ERROR.md
│   │   ├── analysis/
│   │   │   ├── COMPREHENSIVE_GAP_ANALYSIS.md
│   │   │   ├── REMAINING_GAPS_ANALYSIS.md
│   │   │   ├── USER_JOURNEY_GAP_ANALYSIS.md
│   │   │   ├── USER_JOURNEY_IMPLEMENTATION_PLAN.md
│   │   │   ├── PREREQUISITES_VALIDATION_REPORT.md
│   │   │   ├── VALIDATION_REPORT.md
│   │   │   ├── FINAL_VALIDATION_REPORT.md
│   │   │   ├── REQUIREMENTS_AUDIT_REPORT.md
│   │   │   ├── RLS_AUDIT_REPORT.md
│   │   │   ├── SECURITY_VULNERABILITY_REPORT.md
│   │   │   ├── SUPABASE_SCHEMA_ANALYSIS.md
│   │   │   └── STUDY_GROUP_IMPLEMENTATION_VERIFICATION.md
│   │   └── summaries/
│   │       ├── FINAL_RECHECK_SUMMARY.md
│   │       ├── IMMEDIATE_ACTIONS_COMPLETE.md
│   │       ├── PRODUCTION_READY_SUMMARY.md
│   │       └── TECHNICAL_DEBT.md
│   └── old-docs/
│       ├── CLAUDE.md
│       ├── LANDING_PAGE_IMPROVEMENTS.md
│       ├── PARENT_DASHBOARD_REDESIGN.md
│       └── SUPABASE_EMAIL_TEMPLATE_FIX.md
├── tests/
│   ├── test-deployed-signup.html (MOVE from root)
│   └── outputs/
│       ├── test-output-qr-auth.png (MOVE from root)
│       ├── test-output-qr-general.png (MOVE from root)
│       └── test-output-qr-teacher.png (MOVE from root)
└── temp/ (gitignored)
    ├── build-output.txt (MOVE from root)
    ├── type-check-errors.log (MOVE from root)
    ├── type-check-full.txt (MOVE from root)
    ├── type-check-output.txt (MOVE from root)
    ├── typescript-errors.log (MOVE from root)
    ├── implementation-plan.json (MOVE from root)
    ├── implementation-progress.json (MOVE from root)
    ├── implementation-status-report.json (MOVE from root)
    ├── task-validation-report.json (MOVE from root)
    ├── ui-implementation-report.json (MOVE from root)
    ├── QR_TEST_REPORT.json (MOVE from root)
    ├── TEST_REPORT.json (MOVE from root)
    └── CLEANUP_REPORT.json (MOVE from root)
```

## Files to Delete (Unnecessary/Duplicate)

### Duplicate/Outdated Documentation

- `QR_SCANNER_REVIEW_AND_FLUTTER_RECOMMENDATION.md` (consolidate into flutter guide)
- `PULL_REQUEST_BODY.md` (temporary PR template)
- `QUICK_REFERENCE_PLAN.md` (outdated)

### Temporary/Generated Files (should be gitignored)

- `build-output.txt`
- `*.log` files
- `type-check-*.txt` files
- `*.json` report files (keep in temp/)
- `*.png` test outputs (move to tests/outputs/)

### Unnecessary Scripts

- `vercel-env-commands.sh` (already in .gitignore, can delete)
- `CHECK_DATABASE_STATE.sql` (move to scripts/database/)
- `VERIFY_AND_RETRY.sql` (move to scripts/database/)

## Files to Keep in Root

### Essential Documentation

- `README.md` - Main project documentation
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `next.config.mjs` - Next.js config
- `tailwind.config.ts` - Tailwind config
- `vercel.json` - Vercel config
- `.gitignore` - Git ignore rules

### Configuration Files

- `jest.config.js`
- `jest.setup.js`
- `playwright.config.ts`
- `vitest.config.ts`
- `vitest.shims.d.ts`
- `postcss.config.js`
- `lint-staged.config.js`
- `middleware.ts`
- `next-env.d.ts`
- `docker-compose.yml`
- `Dockerfile`

## Migration Steps

### Phase 1: Create Folder Structure

1. Create `docs/` folder with subfolders
2. Create `docs/guides/` with subfolders (setup, deployment, features, qr-code, flutter)
3. Create `docs/api/` folder
4. Create `docs/architecture/` folder
5. Create `scripts/setup/` folder
6. Create `scripts/testing/` folder
7. Create `scripts/migrations/` folder
8. Create `scripts/database/` folder
9. Create `tests/outputs/` folder
10. Create `temp/` folder (add to .gitignore)

### Phase 2: Move Documentation Files

1. Move setup guides to `docs/guides/setup/`
2. Move deployment guides to `docs/guides/deployment/`
3. Move feature guides to `docs/guides/features/`
4. Move QR code guides to `docs/guides/qr-code/`
5. Move Flutter guides to `docs/guides/flutter/`
6. Move API docs to `docs/api/`
7. Move architecture docs to `docs/architecture/`
8. Move reports to `archive/reports/` (organized by category)
9. Update `DOCS_INDEX.md` → `docs/INDEX.md` with new paths

### Phase 3: Move Scripts

1. Move root scripts to `scripts/setup/`
2. Move test scripts to `scripts/testing/`
3. Move migration scripts to `scripts/migrations/`
4. Move SQL files to `scripts/database/`

### Phase 4: Move Test Files

1. Move test HTML files to `tests/`
2. Move test output images to `tests/outputs/`

### Phase 5: Move Temporary Files

1. Move log files to `temp/`
2. Move JSON report files to `temp/`
3. Move build output files to `temp/`
4. Update `.gitignore` to ignore `temp/` folder

### Phase 6: Delete Unnecessary Files

1. Delete duplicate/outdated documentation
2. Delete temporary files that are no longer needed
3. Clean up root directory

### Phase 7: Update References

1. Update all internal links in documentation
2. Update README.md with new paths
3. Update package.json scripts if needed
4. Update any code references to moved files

## Verification Checklist

- [ ] All .md files organized (except README.md)
- [ ] All scripts organized in scripts/ subfolders
- [ ] All test files in tests/ folder
- [ ] All temporary files in temp/ (gitignored)
- [ ] Root directory clean (only essential files)
- [ ] Documentation index updated
- [ ] All references updated
- [ ] .gitignore updated
- [ ] No broken links

## Benefits

1. **Cleaner Root**: Only essential files in root
2. **Better Organization**: Logical folder structure
3. **Easier Navigation**: Find files quickly
4. **Better Maintenance**: Clear separation of concerns
5. **Professional Structure**: Industry-standard organization
6. **Easier Onboarding**: New developers can find docs easily
