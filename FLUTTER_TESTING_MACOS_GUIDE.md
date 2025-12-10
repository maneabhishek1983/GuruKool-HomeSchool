# Flutter Testing on macOS - Complete Guide

**Project**: GuruKool Teacher Mobile App
**Last Updated**: December 10, 2025
**Flutter Version**: 3.38.1+

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Testing Platforms](#testing-platforms)
4. [Quick Start](#quick-start)
5. [Platform-Specific Testing](#platform-specific-testing)
6. [Running Tests](#running-tests)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

1. **macOS Version**: macOS 11 (Big Sur) or later recommended
2. **Xcode**: Version 14.0 or later (for iOS development)
3. **Flutter SDK**: 3.38.1 or later
4. **CocoaPods**: Required for iOS dependencies
5. **Chrome**: For web testing
6. **Android Studio** (optional): For Android testing

### Installation Checklist

```bash
# 1. Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Flutter
brew install --cask flutter

# 3. Install CocoaPods
sudo gem install cocoapods

# 4. Install Xcode from App Store
# Download and install from: https://apps.apple.com/app/xcode/id497799835

# 5. Accept Xcode license
sudo xcodebuild -license accept

# 6. Install Xcode command line tools
sudo xcode-select --install

# 7. Open Xcode at least once to complete setup
open -a Xcode

# 8. Install iOS Simulator
# In Xcode: Preferences → Components → Download iOS Simulator
```

---

## Environment Setup

### Step 1: Verify Flutter Installation

```bash
# Run Flutter doctor to check installation
flutter doctor -v

# Expected output should show:
# ✓ Flutter (Channel stable, 3.38.1+)
# ✓ Xcode - develop for iOS and macOS
# ✓ Chrome - develop for the web
# ✓ Connected device (multiple available)
```

**Common Issues and Fixes**:

```bash
# If Xcode shows issues:
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch

# If CocoaPods shows issues:
sudo gem install cocoapods
pod setup

# If licenses are not accepted:
flutter doctor --android-licenses  # For Android
sudo xcodebuild -license accept    # For iOS
```

### Step 2: Configure Project Environment

```bash
# Navigate to Flutter project
cd gurukool_teacher

# Create .env file from template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required .env Configuration**:

```env
# Supabase Configuration
SUPABASE_URL=https://miqhtpbutevdrkyndflf.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# QR Code Secret (32-byte base64 string)
QR_SECRET=your-qr-secret-here

# API Configuration
API_BASE_URL=http://localhost:3000/api

# Environment
ENVIRONMENT=development
```

### Step 3: Install Dependencies

```bash
# Install Flutter dependencies
flutter pub get

# Install iOS dependencies (CocoaPods)
cd ios
pod install
cd ..

# Verify installation
flutter pub outdated
```

---

## Testing Platforms

### Available Platforms on macOS

1. **iOS Simulator** - Native iOS testing (requires Xcode)
2. **macOS Desktop** - Native macOS application
3. **Chrome (Web)** - Progressive web app testing
4. **Android Emulator** - Android testing (requires Android Studio)
5. **Physical Devices** - Real iOS/Android devices

### Platform Capabilities

| Feature                | iOS              | macOS       | Web            | Android        |
| ---------------------- | ---------------- | ----------- | -------------- | -------------- |
| QR Scanner             | ✅ Camera        | ✅ Camera   | ⚠️ Limited     | ✅ Camera      |
| Location Services      | ✅ GPS           | ✅ WiFi     | ⚠️ Browser API | ✅ GPS         |
| Offline Storage (Hive) | ✅ Full          | ✅ Full     | ⚠️ IndexedDB   | ✅ Full        |
| Secure Storage         | ✅ Keychain      | ✅ Keychain | ❌ No          | ✅ KeyStore    |
| Push Notifications     | ✅ APNs          | ✅ APNs     | ⚠️ Limited     | ✅ FCM         |
| Biometric Auth         | ✅ Face/Touch ID | ✅ Touch ID | ❌ No          | ✅ Fingerprint |

---

## Quick Start

### 1. Start Web Application Backend

```bash
# In project root directory
npm run dev

# Wait for:
# ✓ Ready in ~1700ms
# - Local: http://localhost:3000
```

### 2. Launch Flutter App (Web - Fastest)

```bash
cd gurukool_teacher

# Run on Chrome
flutter run -d chrome

# Hot reload: Press 'r'
# Hot restart: Press 'R'
# Quit: Press 'q'
```

### 3. Launch Flutter App (iOS Simulator - Recommended)

```bash
# List available iOS simulators
xcrun simctl list devices available

# Start a specific simulator
open -a Simulator

# Run app on any available iOS simulator
flutter run -d iphone

# Or specify exact simulator:
flutter run -d "iPhone 15 Pro"
```

### 4. Launch Flutter App (macOS Desktop)

```bash
# Run on macOS desktop
flutter run -d macos

# For release mode:
flutter run -d macos --release
```

---

## Platform-Specific Testing

### iOS Simulator Testing

#### Starting iOS Simulator

```bash
# Option 1: Open Simulator app
open -a Simulator

# Option 2: Use specific device
xcrun simctl boot "iPhone 15 Pro"
open -a Simulator

# Option 3: List all available devices
xcrun simctl list devices available
```

#### Running App on iOS

```bash
cd gurukool_teacher

# Run on any iOS simulator (auto-selects)
flutter run -d iphone

# Run on specific iOS version
flutter run -d "iPhone 15 Pro (iOS 17.2)"

# Run with verbose logging
flutter run -d iphone -v

# Run in release mode (faster, no debugging)
flutter run -d iphone --release
```

#### iOS-Specific Features to Test

```bash
# 1. Camera/QR Scanner
# - Grant camera permissions when prompted
# - Test QR code scanning with sample QR codes

# 2. Location Services
# - Simulator → Features → Location → Custom Location
# - Set custom GPS coordinates for testing

# 3. Keychain (Secure Storage)
# - Test login persistence
# - Verify token storage across app restarts

# 4. Background App Refresh
# - Test offline sync when app returns to foreground
```

#### Debugging iOS

```bash
# View iOS system logs
xcrun simctl spawn booted log stream --level debug

# Reset simulator if needed
xcrun simctl erase all

# Take screenshot
xcrun simctl io booted screenshot screenshot.png

# Record video
xcrun simctl io booted recordVideo --codec=h264 video.mp4
# Press Ctrl+C to stop recording
```

### macOS Desktop Testing

#### Running on macOS

```bash
cd gurukool_teacher

# Run in debug mode
flutter run -d macos

# Run in release mode (production-like)
flutter run -d macos --release

# Run with specific configuration
flutter run -d macos --dart-define=ENVIRONMENT=development
```

#### macOS-Specific Features

```bash
# 1. Window Management
# - Test window resizing
# - Test minimize/maximize
# - Test full-screen mode

# 2. Menu Bar Integration
# - Test app menu items
# - Test keyboard shortcuts

# 3. File System Access
# - Test file picker dialogs
# - Test download/upload functionality

# 4. Notifications
# - Test macOS notification center
```

#### Building macOS App

```bash
# Build for distribution
flutter build macos --release

# Output location:
# build/macos/Build/Products/Release/gurukool_teacher.app

# Run built app
open build/macos/Build/Products/Release/gurukool_teacher.app
```

### Web (Chrome) Testing

#### Running on Chrome

```bash
cd gurukool_teacher

# Run on Chrome
flutter run -d chrome

# Run with specific port
flutter run -d chrome --web-port=8080

# Run with CORS disabled (for API testing)
flutter run -d chrome --web-browser-flag="--disable-web-security"
```

#### Web-Specific Limitations

```bash
# ⚠️ Limited Features on Web:
# 1. QR Scanner - Uses browser camera API (may not work on all browsers)
# 2. Secure Storage - Falls back to localStorage (not truly secure)
# 3. Location Services - Uses browser Geolocation API (less accurate)
# 4. Offline Storage - Uses IndexedDB instead of Hive

# Test with these limitations in mind
```

#### Building for Web

```bash
# Build for web deployment
flutter build web --release

# Output location: build/web/

# Test built web app locally
cd build/web
python3 -m http.server 8080
# Visit: http://localhost:8080
```

### Android Emulator Testing (Optional)

#### Setup Android Emulator

```bash
# Install Android Studio
brew install --cask android-studio

# Open Android Studio and install:
# - Android SDK
# - Android SDK Platform-Tools
# - Android SDK Build-Tools
# - Android Emulator

# Create virtual device in Android Studio:
# Tools → Device Manager → Create Device

# Or use command line:
avdmanager create avd -n test_device -k "system-images;android-33;google_apis;arm64-v8a"
```

#### Running on Android Emulator

```bash
# Start emulator
emulator -avd test_device &

# List connected devices
flutter devices

# Run on Android emulator
flutter run -d emulator-5554

# Or auto-select Android device
flutter run -d android
```

---

## Running Tests

### Unit Tests

```bash
cd gurukool_teacher

# Run all unit tests
flutter test

# Run specific test file
flutter test test/unit/auth_service_test.dart

# Run with coverage
flutter test --coverage

# Generate HTML coverage report
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

### Widget Tests

```bash
# Run all widget tests
flutter test test/widget/

# Run specific widget test
flutter test test/widget/login_screen_test.dart

# Run with verbose output
flutter test test/widget/ -v
```

### Integration Tests

```bash
# Run on iOS simulator
flutter test integration_test/auth_flow_test.dart -d iphone

# Run on macOS
flutter test integration_test/offline_sync_test.dart -d macos

# Run on Chrome
flutter test integration_test/ -d chrome

# Run all integration tests
flutter test integration_test/
```

### End-to-End Testing Flow

```bash
# 1. Start backend server
cd ..  # Go to project root
npm run dev

# 2. Run integration tests in separate terminal
cd gurukool_teacher
flutter test integration_test/ -d iphone

# 3. Watch test execution in simulator
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "No devices found"

```bash
# Solution 1: Check connected devices
flutter devices

# Solution 2: Restart adb (for Android)
adb kill-server
adb start-server

# Solution 3: Reboot simulator (for iOS)
xcrun simctl shutdown all
xcrun simctl boot "iPhone 15 Pro"
```

#### Issue 2: "CocoaPods not installed"

```bash
# Install CocoaPods
sudo gem install cocoapods

# If gem install fails, try:
brew install cocoapods

# Update CocoaPods repo
pod repo update

# Reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

#### Issue 3: "Xcode version too old"

```bash
# Update Xcode from App Store
# Then update command line tools:
sudo xcode-select --install
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Accept license
sudo xcodebuild -license accept
```

#### Issue 4: "Module not found" errors

```bash
# Clean and rebuild
flutter clean
flutter pub get
cd ios && pod install && cd ..
flutter run -d iphone
```

#### Issue 5: Camera permission denied

```bash
# Edit ios/Runner/Info.plist and add:
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan QR codes for student check-in</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to record session check-in locations</string>
```

#### Issue 6: "Failed to build iOS app"

```bash
# Clean build
cd ios
rm -rf build
rm -rf Pods
rm Podfile.lock
pod cache clean --all
pod install
cd ..

# Rebuild
flutter clean
flutter pub get
flutter run -d iphone
```

#### Issue 7: Hot reload not working

```bash
# Restart with hot reload enabled
flutter run -d iphone --hot

# Or use hot restart: Press 'R' in terminal
# Or use hot reload: Press 'r' in terminal
```

#### Issue 8: Supabase connection fails

```bash
# Check .env file exists
ls -la .env

# Check environment variables are loaded
flutter run -d iphone -v | grep SUPABASE

# Test API connection
curl https://miqhtpbutevdrkyndflf.supabase.co

# Verify .env format:
# - No quotes around values
# - No spaces around =
# - No trailing whitespace
```

---

## Best Practices

### Development Workflow

1. **Use Hot Reload for Rapid Iteration**

   ```bash
   flutter run -d iphone
   # Make code changes
   # Press 'r' for hot reload
   # Press 'R' for hot restart
   ```

2. **Test on Multiple Platforms**

   ```bash
   # Quick iteration: Web (fastest)
   flutter run -d chrome

   # Native testing: iOS Simulator
   flutter run -d iphone

   # Production-like: macOS desktop
   flutter run -d macos --release
   ```

3. **Use Flutter DevTools**

   ```bash
   # Start DevTools
   flutter pub global activate devtools
   flutter pub global run devtools

   # Run app with debugging
   flutter run -d iphone --observatory-port=9200

   # Open DevTools at: http://localhost:9100
   ```

4. **Monitor Performance**

   ```bash
   # Run with performance overlay
   flutter run -d iphone --profile

   # In DevTools:
   # - Performance → Timeline
   # - Memory → Heap snapshot
   # - Network → Request inspector
   ```

### Testing Strategy

1. **Test Pyramid Approach**
   - 70% Unit Tests (fast, isolated)
   - 20% Widget Tests (UI component testing)
   - 10% Integration Tests (full flow testing)

2. **Platform-Specific Testing Priority**
   - **Primary**: iOS Simulator (most common platform)
   - **Secondary**: macOS Desktop (easy debugging)
   - **Tertiary**: Web (accessibility testing)
   - **Optional**: Android Emulator (if targeting Android)

3. **Critical User Journeys to Test**
   ```
   1. Teacher Login Flow
   2. QR Code Scanning
   3. Student Check-In/Out
   4. Session History
   5. Offline Mode → Online Sync
   6. Session Timeout → Re-authentication
   ```

### Pre-Release Checklist

```bash
# 1. Run all tests
flutter test
flutter test integration_test/

# 2. Check for deprecated APIs
flutter analyze

# 3. Build release versions
flutter build ios --release
flutter build macos --release
flutter build web --release

# 4. Test release builds
open build/ios/iphoneos/Runner.app  # iOS
open build/macos/Build/Products/Release/gurukool_teacher.app  # macOS
python3 -m http.server 8080 --directory build/web  # Web

# 5. Verify no debug code
grep -r "print(" lib/  # Should be minimal
grep -r "debugPrint" lib/  # Should use logger instead

# 6. Check app size
flutter build ios --release --analyze-size
flutter build macos --release --analyze-size
```

---

## Debugging Tips

### Visual Debugging

```bash
# Enable debug painting
flutter run -d iphone --debug

# In app, tap "Debug Paint" button or:
# DevTools → Inspector → Show Guidelines
```

### Logging

```dart
// Use structured logging instead of print()
import 'package:logger/logger.dart';

final logger = Logger();

logger.d('Debug message');    // Development only
logger.i('Info message');      // Important info
logger.w('Warning message');   // Warnings
logger.e('Error message');     // Errors
logger.wtf('Fatal message');   // Critical errors
```

### Network Debugging

```bash
# View network requests in DevTools
flutter run -d iphone
# Open DevTools → Network tab

# Or use Charles Proxy:
# Set iOS Simulator to use proxy:
# Settings → Wi-Fi → Configure Proxy → Manual
# Server: 127.0.0.1, Port: 8888
```

### State Debugging (Riverpod)

```dart
// Add ProviderObserver for debugging
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MyProviderObserver extends ProviderObserver {
  @override
  void didUpdateProvider(
    ProviderBase provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    print('[${provider.name ?? provider.runtimeType}] $newValue');
  }
}

// In main.dart:
runApp(
  ProviderScope(
    observers: [MyProviderObserver()],
    child: MyApp(),
  ),
);
```

---

## Performance Optimization

### Build Performance

```bash
# Use cached builds
flutter run -d iphone --cache-sksl

# Profile build time
flutter run -d iphone --trace-startup
# Open trace in Chrome: chrome://tracing
```

### App Performance

```bash
# Profile mode (production-like with debugging)
flutter run -d iphone --profile

# Release mode (production)
flutter run -d iphone --release

# Analyze bundle size
flutter build ios --analyze-size
flutter build macos --analyze-size
```

### Memory Profiling

```bash
# Run with memory profiling
flutter run -d iphone --profile

# In DevTools:
# 1. Memory → Snapshot
# 2. Perform actions
# 3. Take another snapshot
# 4. Compare snapshots to find leaks
```

---

## Resources

### Official Documentation

- [Flutter Documentation](https://docs.flutter.dev/)
- [Flutter iOS Setup](https://docs.flutter.dev/get-started/install/macos)
- [Flutter Testing Guide](https://docs.flutter.dev/testing)
- [Riverpod Documentation](https://riverpod.dev/)

### Project-Specific Documentation

- [CLAUDE.md](../CLAUDE.md) - Project overview and architecture
- [README.md](README.md) - Flutter app setup guide
- [README_TESTING.md](README_TESTING.md) - Detailed testing guide

### Useful Commands Reference

```bash
# Quick reference for daily use
flutter doctor -v                    # Check setup
flutter devices                      # List devices
flutter run -d iphone               # Run on iOS
flutter test                        # Run tests
flutter analyze                     # Static analysis
flutter clean                       # Clean build
flutter pub get                     # Install dependencies
flutter pub outdated                # Check for updates
pod install                         # iOS dependencies
xcrun simctl list devices           # List iOS simulators
```

---

## Support

For issues or questions:

1. Check this guide first
2. Review [Flutter Testing Documentation](https://docs.flutter.dev/testing)
3. Check [iOS-specific issues](https://docs.flutter.dev/platform-integration/ios)
4. Review project [CLAUDE.md](../CLAUDE.md)
5. Consult team documentation

---

**Last Updated**: December 10, 2025
**Maintained By**: GuruKool Development Team
