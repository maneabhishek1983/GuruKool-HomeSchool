---
description: Generate a Flutter screen with Riverpod providers, state management, and Material Design 3
allowed-tools: [Read, Write, Edit, Bash]
---

# Create Flutter Screen

Generate a production-ready Flutter screen following GuruKool mobile app architecture.

## Arguments

- **$1**: Screen name (e.g., `lesson_detail`, `progress_tracking`)
- **$2**: Screen purpose/description

## Implementation Steps

### 1. Analyze Existing Patterns

Read existing screens for consistency:

```bash
# Read similar screens
gurukool_teacher/lib/screens/home_screen.dart
gurukool_teacher/lib/screens/qr_scanner_screen.dart
gurukool_teacher/lib/screens/session_history_screen.dart
```

### 2. Create Screen File

File: `gurukool_teacher/lib/screens/<screen_name>_screen.dart`

Structure:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../design_system/tokens/colors.dart';
import '../design_system/tokens/spacing.dart';
import '../design_system/tokens/typography.dart';

class <ScreenName>Screen extends ConsumerStatefulWidget {
  const <ScreenName>Screen({super.key});

  @override
  ConsumerState<<ScreenName>Screen> createState() => _<ScreenName>ScreenState();
}

class _<ScreenName>ScreenState extends ConsumerState<<ScreenName>Screen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('<Screen Title>'),
        backgroundColor: AppColors.primary,
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.md),
          child: Column(
            children: [
              // Screen content
            ],
          ),
        ),
      ),
    );
  }
}
```

### 3. Create State Provider

File: `gurukool_teacher/lib/providers/state/<screen_name>_state.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

class <ScreenName>State {
  final bool isLoading;
  final String? error;
  // Add state fields

  const <ScreenName>State({
    this.isLoading = false,
    this.error,
  });

  <ScreenName>State copyWith({
    bool? isLoading,
    String? error,
  }) {
    return <ScreenName>State(
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}
```

### 4. Create StateNotifier

File: `gurukool_teacher/lib/providers/<screen_name>_provider.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'state/<screen_name>_state.dart';
import '../services/supabase.service.dart';

final <screenName>Provider = StateNotifierProvider<<ScreenName>Notifier, <ScreenName>State>((ref) {
  return <ScreenName>Notifier(ref.read(supabaseServiceProvider));
});

class <ScreenName>Notifier extends StateNotifier<<ScreenName>State> {
  final SupabaseService _supabaseService;

  <ScreenName>Notifier(this._supabaseService) : super(const <ScreenName>State());

  Future<void> loadData() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // Load data
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }
}
```

### 5. Use Repository Pattern (if needed)

File: `gurukool_teacher/lib/repositories/<entity>_repository.dart`

```dart
import '../services/supabase.service.dart';
import '../models/flutter/<entity>.dart';

class <Entity>Repository {
  final SupabaseService _supabase;

  <Entity>Repository(this._supabase);

  Future<List<<Entity>>> getAll() async {
    // Implementation
  }

  Future<<Entity>> create(<Entity> entity) async {
    // Implementation
  }
}
```

### 6. Update Navigation

Add route to `gurukool_teacher/lib/main.dart` or router:

```dart
GoRoute(
  path: '/<screen-path>',
  builder: (context, state) => const <ScreenName>Screen(),
),
```

### 7. Create Widget Tests

File: `gurukool_teacher/test/widget/<screen_name>_screen_test.dart`

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gurukool_teacher/screens/<screen_name>_screen.dart';

void main() {
  group('<ScreenName>Screen Widget Tests', () {
    testWidgets('should render screen', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: <ScreenName>Screen(),
          ),
        ),
      );

      expect(find.byType(<ScreenName>Screen), findsOneWidget);
    });

    testWidgets('should show loading indicator', (tester) async {
      // Test implementation
    });

    testWidgets('should display error message', (tester) async {
      // Test implementation
    });
  });
}
```

### 8. Create Unit Tests for Provider

File: `gurukool_teacher/test/unit/<screen_name>_provider_test.dart`

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gurukool_teacher/providers/<screen_name>_provider.dart';

void main() {
  group('<ScreenName>Notifier', () {
    test('should initialize with default state', () {
      final container = ProviderContainer();
      final state = container.read(<screenName>Provider);

      expect(state.isLoading, false);
      expect(state.error, null);
    });

    test('should load data successfully', () async {
      // Test implementation
    });
  });
}
```

### 9. Verification

Run tests:

```bash
cd gurukool_teacher

# Analyze code
flutter analyze

# Run unit tests
flutter test test/unit/<screen_name>_provider_test.dart

# Run widget tests
flutter test test/widget/<screen_name>_screen_test.dart

# Run all tests
flutter test

# Hot reload to see changes
flutter run -d chrome
# Press 'r' to hot reload
```

## Design System Guidelines

### Colors

```dart
// Use semantic colors from design_system/tokens/colors.dart
AppColors.primary        // Main brand color
AppColors.secondary      // Secondary actions
AppColors.error          // Error states
AppColors.success        // Success states
AppColors.background     // Background color
AppColors.surface        // Card/surface color
AppColors.textPrimary    // Primary text
AppColors.textSecondary  // Secondary text
```

### Spacing

```dart
// Use spacing scale from design_system/tokens/spacing.dart
AppSpacing.xs    // 4px
AppSpacing.sm    // 8px
AppSpacing.md    // 16px
AppSpacing.lg    // 24px
AppSpacing.xl    // 32px
AppSpacing.xxl   // 48px
```

### Typography

```dart
// Use typography from design_system/tokens/typography.dart
AppTypography.headlineLarge
AppTypography.headlineMedium
AppTypography.titleLarge
AppTypography.bodyLarge
AppTypography.bodyMedium
AppTypography.labelLarge
```

## Success Criteria

- [ ] Screen file created with Material Design 3
- [ ] State class created (immutable)
- [ ] StateNotifier provider created
- [ ] Repository created (if needed)
- [ ] Navigation route added
- [ ] Widget tests created and passing
- [ ] Unit tests created and passing
- [ ] flutter analyze passes (0 issues)
- [ ] Design tokens used (colors, spacing, typography)
- [ ] Follows existing screen patterns

## Example Usage

```bash
# Create lesson detail screen
/flutter-screen lesson_detail "Display lesson details with curriculum standards and progress tracking"

# Create progress tracking screen
/flutter-screen progress_tracking "Show student progress across all subjects with charts"
```

## Notes

- Always use ConsumerWidget or ConsumerStatefulWidget for Riverpod
- Use ref.watch() for reactive updates
- Use ref.read() for one-time reads in callbacks
- State must be immutable (use copyWith())
- Follow Material Design 3 guidelines
- Match web app design tokens for consistency
