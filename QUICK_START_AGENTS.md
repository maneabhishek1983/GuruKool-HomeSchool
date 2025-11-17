# Quick Start Guide - AI Agent Execution

**IMPORTANT**: All agent scripts must be run from the **project root directory**, not from `gurukool_teacher/`!

---

## ✅ Correct Usage

```bash
# Navigate to project root
cd c:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src

# Run agents from here
npx tsx scripts/run-orchestrator.ts
npx tsx scripts/run-backend-integration.ts
npx tsx scripts/run-ui-designer.ts
npx tsx scripts/run-state-management.ts
```

---

## ❌ Incorrect Usage

```bash
# DON'T run from inside gurukool_teacher/
cd gurukool_teacher
npx tsx scripts/run-backend-integration.ts  # ❌ ERROR - scripts not found
```

---

## 📋 Available Agent Scripts

### 1. Orchestrator Agent

**Purpose**: Initialize project tasks, plan sprints, track progress

```bash
npx tsx scripts/run-orchestrator.ts
```

**Output**:

- Initializes 20 tasks from FLUTTER_DEVELOPMENT_PLAN.md
- Plans Week 1 sprint
- Generates progress report
- Saves to: `temp/orchestrator-output.json`

---

### 2. Backend Integration Agent

**Purpose**: Generate Supabase clients, auth services, data models

```bash
npx tsx scripts/run-backend-integration.ts
```

**Output**:

- `gurukool_teacher/lib/services/supabase.service.dart`
- `gurukool_teacher/lib/services/auth.service.dart`
- `gurukool_teacher/lib/models/*.dart` (Student, Teacher, TeacherSession)
- `gurukool_teacher/lib/services/realtime.service.dart`
- `gurukool_teacher/lib/services/session_api.service.dart`
- Saves to: `temp/backend-integration-output.json`

---

### 3. UI Designer Agent

**Purpose**: Migrate design tokens, generate screens

```bash
npx tsx scripts/run-ui-designer.ts
```

**Output**:

- `gurukool_teacher/lib/design_system/tokens/colors.dart`
- `gurukool_teacher/lib/design_system/tokens/spacing.dart`
- `gurukool_teacher/lib/design_system/tokens/typography.dart`
- Saves to: `temp/ui-designer-output.json`

---

### 4. State Management Agent

**Purpose**: Setup Riverpod providers, offline storage, caching

```bash
npx tsx scripts/run-state-management.ts
```

**Output**:

- `gurukool_teacher/lib/providers/auth_provider.dart`
- `gurukool_teacher/lib/providers/session_provider.dart`
- `gurukool_teacher/lib/providers/student_provider.dart`
- `gurukool_teacher/lib/providers/state/auth_state.dart`
- `gurukool_teacher/lib/providers/state/session_state.dart`
- `gurukool_teacher/lib/services/cache.service.dart`
- `gurukool_teacher/lib/services/hive_storage.service.dart`
- `gurukool_teacher/lib/services/sync_queue.service.dart`
- Saves to: `temp/state-management-output.json`

---

## 🚀 Complete Week 1 Workflow

Run all agents in sequence from project root:

```bash
# 1. Navigate to project root
cd c:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src

# 2. Initialize project and plan sprint
npx tsx scripts/run-orchestrator.ts

# 3. Setup backend integration
npx tsx scripts/run-backend-integration.ts

# 4. Migrate design tokens
npx tsx scripts/run-ui-designer.ts

# 5. Setup state management
npx tsx scripts/run-state-management.ts

# 6. Test the Flutter app
cd gurukool_teacher
flutter pub get
flutter run
```

---

## 📂 Directory Structure

```
gurukool-homeschool-src/          ← Run scripts from HERE
├── scripts/
│   ├── run-orchestrator.ts       ← Agent executors
│   ├── run-backend-integration.ts
│   ├── run-ui-designer.ts
│   └── run-state-management.ts
├── agents/
│   ├── autonomous/               ← Agent implementations
│   └── base.agent.ts
├── gurukool_teacher/             ← Flutter project (output)
│   ├── lib/
│   │   ├── services/            ← Generated services
│   │   ├── providers/           ← Generated providers
│   │   ├── models/              ← Generated models
│   │   ├── screens/             ← Generated screens
│   │   └── design_system/       ← Generated design tokens
│   └── pubspec.yaml
└── temp/                        ← Agent output JSON files
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'scripts/...'"

**Problem**: Running script from wrong directory (likely inside `gurukool_teacher/`)

**Solution**:

```bash
cd ..  # Go up one level to project root
npx tsx scripts/run-orchestrator.ts
```

---

### Error: "Cannot find module '../agents/...'"

**Problem**: Missing dependencies or TypeScript path issues

**Solution**:

```bash
npm install  # Install all dependencies
npx tsx scripts/run-orchestrator.ts
```

---

### Error: "Module not found: '../base.agent'"

**Problem**: BaseAgent class not found

**Solution**: Verify `agents/base.agent.ts` exists (should be created automatically)

---

## 📊 Viewing Agent Output

All agents save comprehensive JSON output:

```bash
# View orchestrator results
cat temp/orchestrator-output.json

# View backend integration results
cat temp/backend-integration-output.json

# View UI designer results
cat temp/ui-designer-output.json

# View state management results
cat temp/state-management-output.json
```

---

## ✅ Success Criteria

After running all agents, you should have:

- ✅ 20 project tasks initialized in orchestrator
- ✅ Week 1 sprint planned (4 hours estimated)
- ✅ Supabase services generated (auth, realtime, API)
- ✅ Data models generated (Student, Teacher, TeacherSession)
- ✅ Design tokens migrated (colors, spacing, typography)
- ✅ Riverpod providers setup (auth, session, student)
- ✅ State containers created (AuthState, SessionState)
- ✅ Offline storage configured (Hive, sync queue)
- ✅ Caching service implemented

---

## 🎯 Next Steps After Agent Execution

1. **Review Generated Code**:

   ```bash
   cd gurukool_teacher
   ls lib/services/     # Backend services
   ls lib/providers/    # State providers
   ls lib/design_system/ # Design tokens
   ```

2. **Configure Environment**:
   - Update `.env` with Supabase credentials
   - Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`

3. **Install Dependencies**:

   ```bash
   cd gurukool_teacher
   flutter pub get
   ```

4. **Run the App**:

   ```bash
   flutter run
   ```

5. **Generate Tests** (optional):
   ```bash
   cd ..  # Back to project root
   npx tsx scripts/run-testing-agent.ts
   ```

---

## 📚 Documentation

- **Full Agent Usage**: `AGENT_IMPLEMENTATION_STATUS.md`
- **Flutter Setup Guide**: `FLUTTER_INITIALIZATION_GUIDE.md`
- **Development Plan**: `FLUTTER_DEVELOPMENT_PLAN.md`
- **Architecture Review**: `ARCHITECTURE_REVIEW_REPORT.md`

---

**Remember**: Always run agent scripts from the **project root directory**! 🚀
