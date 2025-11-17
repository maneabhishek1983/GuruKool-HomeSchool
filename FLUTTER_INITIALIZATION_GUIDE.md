# Flutter Project Initialization Guide

**Date**: 2025-11-17
**Status**: Ready to Execute
**Flutter Version**: 3.38.1 ✅
**Flutter Path**: C:\Users\abhis\develop\flutter\bin ✅

---

## ✅ Prerequisites Complete

- ✅ Flutter SDK installed and verified
- ✅ Flutter in PATH (C:\Users\abhis\develop\flutter\bin)
- ✅ Autonomous agents ready (3/9 core agents)
- ✅ Folder structure organized
- ✅ Supabase backend ready

---

## 🚀 Step-by-Step Initialization

### **Step 1: Create Flutter Project**

Open PowerShell in the project root and run:

```powershell
cd C:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src

# Create Flutter project
flutter create gurukool_teacher --org com.gurukool --platforms android,ios

cd gurukool_teacher
```

**What this creates**:

```
gurukool_teacher/
├── lib/
│   └── main.dart
├── android/
├── ios/
├── test/
├── pubspec.yaml
└── README.md
```

---

### **Step 2: Set Up Folder Structure**

Run this PowerShell script to organize the project:

```powershell
# Create organized folder structure
New-Item -ItemType Directory -Force -Path lib/config
New-Item -ItemType Directory -Force -Path lib/design_system/tokens
New-Item -ItemType Directory -Force -Path lib/models
New-Item -ItemType Directory -Force -Path lib/providers
New-Item -ItemType Directory -Force -Path lib/screens/auth
New-Item -ItemType Directory -Force -Path lib/screens/home
New-Item -ItemType Directory -Force -Path lib/screens/qr_scanner
New-Item -ItemType Directory -Force -Path lib/screens/session_history
New-Item -ItemType Directory -Force -Path lib/services

Write-Host "✅ Folder structure created"
```

**Expected structure**:

```
lib/
├── config/
│   ├── env.dart
│   └── routes.dart
├── design_system/
│   └── tokens/
│       ├── colors.dart
│       ├── spacing.dart
│       └── typography.dart
├── models/
│   ├── teacher_session.dart
│   └── user.dart
├── providers/
│   ├── auth_provider.dart
│   └── session_provider.dart
├── screens/
│   ├── auth/
│   │   └── login_screen.dart
│   ├── home/
│   │   └── home_screen.dart
│   ├── qr_scanner/
│   │   └── qr_scanner_screen.dart
│   └── session_history/
│       └── session_history_screen.dart
├── services/
│   ├── supabase_service.dart
│   ├── auth_service.dart
│   └── session_api_service.dart
└── main.dart
```

---

### **Step 3: Update pubspec.yaml**

Replace the `dependencies:` section in `gurukool_teacher/pubspec.yaml`:

```yaml
name: gurukool_teacher
description: GuruKool HomeSchool Teacher Mobile App
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.4.9

  # Backend
  supabase_flutter: ^2.3.4
  http: ^1.1.2

  # QR Scanner
  mobile_scanner: ^3.5.5
  permission_handler: ^11.1.0

  # Offline Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0

  # Location
  geolocator: ^10.1.0

  # Push Notifications
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.9

  # UI
  google_fonts: ^6.1.0

  # Utilities
  json_annotation: ^4.8.1
  connectivity_plus: ^5.0.2
  flutter_secure_storage: ^9.0.0

  # Monitoring
  sentry_flutter: ^7.13.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
  mocktail: ^1.0.2
  integration_test:
    sdk: flutter
```

Then run:

```powershell
flutter pub get
```

---

### **Step 4: Create Environment Configuration**

Create `lib/config/env.dart`:

```dart
class Env {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://miqhtpbutevdrkyndflf.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://gurukool-homeschool.vercel.app',
  );

  static const String sentryDsn = String.fromEnvironment(
    'SENTRY_DSN',
    defaultValue: '',
  );

  static const String environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  );

  static bool get isDevelopment => environment == 'development';
  static bool get isProduction => environment == 'production';
}
```

---

### **Step 5: Use Autonomous Agents to Generate Code**

The autonomous agents will generate the remaining code. Here's what each agent will create:

#### **UI Designer Agent** → Design Tokens

Will create:

- `lib/design_system/tokens/colors.dart` (from Tailwind CSS)
- `lib/design_system/tokens/spacing.dart`
- `lib/design_system/tokens/typography.dart`

#### **Backend Integration Agent** → Services

Will create:

- `lib/services/supabase_service.dart` (Supabase client with auth)
- `lib/services/auth_service.dart` (Email/password login)
- `lib/models/teacher_session.dart` (Data model)

#### **UI Designer Agent** → Login Screen

Will create:

- `lib/screens/auth/login_screen.dart` (Complete login UI)

---

### **Step 6: Update main.dart**

Replace `lib/main.dart` with:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gurukool_teacher/config/env.dart';
import 'package:gurukool_teacher/services/supabase_service.dart';
import 'package:gurukool_teacher/screens/auth/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await SupabaseService.initialize();

  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GuruKool Teacher',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}
```

---

### **Step 7: Run the App**

```powershell
# Run on Android emulator or connected device
flutter run

# Or build APK
flutter build apk --debug
```

---

## 🤖 Autonomous Agent Workflow

Once the basic project is created, the agents will take over:

### **Week 1: Authentication & Foundation**

```typescript
// 1. Orchestrator initializes project
const orchestrator = new OrchestratorAgent();
await orchestrator.execute({ action: 'initialize_project' });

// 2. UI Designer migrates design tokens
const uiDesigner = new UIDesignerAgent();
await uiDesigner.execute({
  action: 'migrate_design_tokens',
  payload: {
    tailwindConfigPath: './src/config/theme.ts',
    outputDir: './gurukool_teacher',
  },
});
// Creates: colors.dart, spacing.dart, typography.dart

// 3. Backend Agent sets up Supabase
const backendAgent = new BackendIntegrationAgent();
await backendAgent.execute({
  action: 'setup_supabase_client',
  payload: {
    platform: 'flutter',
    outputPath: './gurukool_teacher/lib/services/supabase_service.dart',
  },
});

// 4. Backend Agent implements auth
await backendAgent.execute({
  action: 'implement_auth_flow',
  payload: {
    platform: 'flutter',
    outputPath: './gurukool_teacher/lib/services/auth_service.dart',
  },
});

// 5. UI Designer generates login screen
await uiDesigner.execute({
  action: 'generate_screen',
  payload: {
    screenName: 'login',
    platform: 'flutter',
    outputPath: './gurukool_teacher/lib/screens/auth/login_screen.dart',
  },
});

// 6. Orchestrator reports progress
await orchestrator.execute({ action: 'generate_progress_report' });
```

---

## 📋 Manual Checklist (Before Running Agents)

- [ ] Run `flutter create gurukool_teacher`
- [ ] Create folder structure (config, design_system, models, providers, screens, services)
- [ ] Update `pubspec.yaml` with dependencies
- [ ] Run `flutter pub get`
- [ ] Create `lib/config/env.dart`
- [ ] Update `lib/main.dart`
- [ ] Verify app runs: `flutter run`

---

## 🎯 After Manual Setup

The autonomous agents will:

1. ✅ Migrate design tokens automatically
2. ✅ Generate Supabase services automatically
3. ✅ Create auth providers automatically
4. ✅ Generate login screen automatically
5. ✅ Write unit tests automatically
6. ✅ Set up CI/CD automatically

---

## 📚 Key Files to Create Manually

### 1. `pubspec.yaml` (Updated dependencies)

### 2. `lib/config/env.dart` (Environment configuration)

### 3. `lib/main.dart` (App entry point)

**Everything else will be generated by the autonomous agents!**

---

## ✅ Success Criteria

After running the commands above:

- [ ] Flutter project created at `gurukool_teacher/`
- [ ] Folder structure organized
- [ ] Dependencies installed (`flutter pub get` succeeds)
- [ ] App runs successfully (`flutter run` works)
- [ ] Ready for autonomous agent code generation

---

## 🚀 Quick Start Commands

```powershell
# All commands in one script
cd C:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src

# Create project
flutter create gurukool_teacher --org com.gurukool --platforms android,ios
cd gurukool_teacher

# Create folders
New-Item -ItemType Directory -Force -Path lib/config
New-Item -ItemType Directory -Force -Path lib/design_system/tokens
New-Item -ItemType Directory -Force -Path lib/models
New-Item -ItemType Directory -Force -Path lib/providers
New-Item -ItemType Directory -Force -Path lib/screens/auth
New-Item -ItemType Directory -Force -Path lib/screens/home
New-Item -ItemType Directory -Force -Path lib/screens/qr_scanner
New-Item -ItemType Directory -Force -Path lib/services

# Install dependencies (after updating pubspec.yaml)
flutter pub get

# Run app
flutter run
```

---

**Status**: Ready to execute
**Next**: Run commands in PowerShell, then autonomous agents will generate all code
