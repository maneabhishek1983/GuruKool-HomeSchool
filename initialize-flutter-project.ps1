# GuruKool HomeSchool - Flutter Project Initialization Script
# Run this in PowerShell from the project root

Write-Host "[START] GuruKool HomeSchool - Flutter Project Initialization" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Flutter is available
Write-Host "[*] Checking Flutter installation..." -ForegroundColor Yellow
try {
    $flutterVersion = flutter --version 2>&1 | Select-String "Flutter" | Select-Object -First 1
    Write-Host "  Flutter found: $flutterVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Flutter not found in PATH" -ForegroundColor Red
    Write-Host "  Please add C:\Users\abhis\develop\flutter\bin to your PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Create Flutter project
Write-Host "[STEP 1] Creating Flutter project..." -ForegroundColor Yellow
if (Test-Path "gurukool_teacher") {
    Write-Host "  [WARNING] Project folder already exists. Skipping creation." -ForegroundColor Yellow
} else {
    flutter create gurukool_teacher --org com.gurukool --platforms android,ios
    Write-Host "  [OK] Flutter project created" -ForegroundColor Green
}

Write-Host ""

# Step 2: Create folder structure
Write-Host "[STEP 2] Creating folder structure..." -ForegroundColor Yellow
cd gurukool_teacher

$folders = @(
    "lib/config",
    "lib/design_system/tokens",
    "lib/models",
    "lib/providers",
    "lib/screens/auth",
    "lib/screens/home",
    "lib/screens/qr_scanner",
    "lib/screens/session_history",
    "lib/services"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    Write-Host "  [*] Created $folder" -ForegroundColor Gray
}

Write-Host "  [OK] Folder structure created" -ForegroundColor Green
Write-Host ""

# Step 3: Update pubspec.yaml
Write-Host "[STEP 3] Updating pubspec.yaml..." -ForegroundColor Yellow

$pubspecContent = @"
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

  # Push Notifications (optional for Week 5)
  # firebase_core: ^2.24.2
  # firebase_messaging: ^14.7.9

  # UI
  google_fonts: ^6.1.0

  # Utilities
  json_annotation: ^4.8.1
  connectivity_plus: ^5.0.2
  flutter_secure_storage: ^9.0.0

  # Monitoring (optional)
  # sentry_flutter: ^7.13.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
  mocktail: ^1.0.2
  integration_test:
    sdk: flutter

flutter:
  uses-material-design: true
"@

Set-Content -Path 'pubspec.yaml' -Value $pubspecContent
Write-Host "  [OK] pubspec.yaml updated" -ForegroundColor Green
Write-Host ""

# Step 4: Install dependencies
Write-Host "[STEP 4] Installing dependencies..." -ForegroundColor Yellow
flutter pub get
Write-Host "  [OK] Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 5: Create env.dart
Write-Host "[STEP 5] Creating environment configuration..." -ForegroundColor Yellow

$envContent = @"
class Env {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://miqhtpbutevdrkyndflf.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '', // Will be provided at build time
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
"@

Set-Content -Path "lib/config/env.dart" -Value $envContent
Write-Host "  [OK] lib/config/env.dart created" -ForegroundColor Green
Write-Host ""

# Step 6: Create main.dart
Write-Host "[STEP 6] Creating main.dart..." -ForegroundColor Yellow

$mainContent = @"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// GuruKool HomeSchool Teacher Mobile App
/// Auto-initialized by setup script
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

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
      home: const PlaceholderScreen(),
    );
  }
}

class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GuruKool Teacher'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.school,
              size: 100,
              color: const Color(0xFF2563EB),
            ),
            const SizedBox(height: 24),
            Text(
              'GuruKool HomeSchool',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Teacher Mobile App',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 32),
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              'Autonomous agents will generate screens...',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }
}
"@

Set-Content -Path "lib/main.dart" -Value $mainContent
Write-Host "  [OK] lib/main.dart created" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Flutter Project Initialization Complete!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Project Location:" -ForegroundColor Yellow
Write-Host "   $(Get-Location)" -ForegroundColor White
Write-Host ""
Write-Host "[NEXT STEPS]:" -ForegroundColor Yellow
Write-Host "   1. Run the app: " -NoNewline -ForegroundColor White
Write-Host "flutter run" -ForegroundColor Cyan
Write-Host "   2. Use autonomous agents to generate code" -ForegroundColor White
Write-Host "   3. See FLUTTER_INITIALIZATION_GUIDE.md for agent usage" -ForegroundColor White
Write-Host ""
Write-Host "[AGENTS] Autonomous Agents Ready:" -ForegroundColor Yellow
Write-Host "   - Orchestrator Agent - Project management" -ForegroundColor White
Write-Host "   - UI Designer Agent - Design tokens & screens" -ForegroundColor White
Write-Host "   - Backend Integration Agent - Supabase & auth" -ForegroundColor White
Write-Host ""
Write-Host "[DOCS] Documentation:" -ForegroundColor Yellow
Write-Host "   - ../FLUTTER_INITIALIZATION_GUIDE.md" -ForegroundColor White
Write-Host "   - ../agents/autonomous/AGENTS_COMPLETE_SUMMARY.md" -ForegroundColor White
Write-Host "   - ../FLUTTER_DEVELOPMENT_PLAN.md" -ForegroundColor White
Write-Host ""
