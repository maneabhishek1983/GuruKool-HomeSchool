# macOS Quick Start Checklist

**5-Minute Setup Guide for Testing Flutter App on Mac**

---

## ✅ Prerequisites Check

```bash
# Run this command to verify everything is installed:
flutter doctor -v
```

**Required**:

- ✅ Flutter SDK installed
- ✅ Xcode installed
- ✅ CocoaPods installed
- ✅ iOS Simulator available

---

## 🚀 Quick Start (3 Steps)

### Step 1: Setup Environment (1 minute)

```bash
cd gurukool_teacher

# Copy environment template
cp .env.example .env

# Edit with your Supabase credentials
nano .env
```

**Required in .env**:

```env
SUPABASE_URL=https://miqhtpbutevdrkyndflf.supabase.co
SUPABASE_ANON_KEY=your-key-here
QR_SECRET=your-secret-here
API_BASE_URL=http://localhost:3000/api
```

### Step 2: Install Dependencies (2 minutes)

```bash
# Install Flutter dependencies
flutter pub get

# Install iOS dependencies
cd ios && pod install && cd ..
```

### Step 3: Run the App (1 minute)

```bash
# Option A: Run on iOS Simulator (Recommended)
flutter run -d iphone

# Option B: Run on macOS Desktop
flutter run -d macos

# Option C: Run on Chrome (Fastest for quick tests)
flutter run -d chrome
```

---

## 📱 Testing Platforms

### iOS Simulator (Best for Full Feature Testing)

```bash
# List available simulators
xcrun simctl list devices available

# Run on specific device
flutter run -d "iPhone 15 Pro"

# Features: ✅ Camera, ✅ GPS, ✅ Secure Storage, ✅ All sensors
```

### macOS Desktop (Best for Debugging)

```bash
# Run in debug mode
flutter run -d macos

# Run in release mode (faster)
flutter run -d macos --release

# Features: ✅ Camera, ✅ Wifi location, ✅ Secure Storage
```

### Chrome Web (Best for Quick Iteration)

```bash
# Run on Chrome
flutter run -d chrome

# Hot reload: Press 'r'
# Hot restart: Press 'R'

# Features: ⚠️ Camera (limited), ⚠️ Browser location, ❌ No secure storage
```

---

## 🧪 Running Tests

```bash
# Run all unit tests
flutter test

# Run specific test
flutter test test/unit/auth_service_test.dart

# Run with coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html

# Run integration tests on iOS
flutter test integration_test/ -d iphone
```

---

## 🎯 Critical User Journeys to Test

1. **Login Flow**
   - Open app → Login screen → Enter credentials → Success

2. **QR Code Scanning**
   - Login → Home → Scan QR → Grant camera permission → Scan code

3. **Check-In/Out**
   - Scan QR → Check In → Grant location permission → Session starts
   - Session running → Check Out → Add notes → Session saved

4. **Offline Mode**
   - Disable network → Perform check-in → Re-enable network → Verify sync

5. **Session History**
   - Login → Home → View History → See all sessions

---

## 🔧 Common Issues & Quick Fixes

### Issue: "No devices found"

```bash
# List devices
flutter devices

# Start iOS Simulator
open -a Simulator

# Restart Flutter
flutter clean && flutter pub get
```

### Issue: "CocoaPods not installed"

```bash
sudo gem install cocoapods
cd ios && pod install && cd ..
```

### Issue: "Xcode license not accepted"

```bash
sudo xcodebuild -license accept
```

### Issue: "Build failed"

```bash
# Clean everything
flutter clean
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
flutter pub get
flutter run -d iphone
```

### Issue: "Camera permission denied"

Edit `ios/Runner/Info.plist` and add:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan QR codes</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location to record check-in location</string>
```

---

## 🎨 Hot Reload Tips

```bash
# After running 'flutter run':

# Hot Reload (fast, preserves state)
Press 'r'

# Hot Restart (slower, resets state)
Press 'R'

# Open DevTools
Press 'd'

# Quit
Press 'q'
```

---

## 📊 DevTools (Advanced Debugging)

```bash
# Install DevTools
flutter pub global activate devtools

# Run app with DevTools
flutter run -d iphone

# In another terminal:
flutter pub global run devtools

# Visit: http://127.0.0.1:9100
```

**DevTools Features**:

- **Inspector**: Widget tree visualization
- **Performance**: Timeline and frame rendering
- **Memory**: Heap snapshots and leak detection
- **Network**: API call monitoring
- **Logging**: Console output

---

## 📝 Pre-Deployment Checklist

```bash
# 1. Analyze code
flutter analyze

# 2. Format code
dart format lib/

# 3. Run all tests
flutter test

# 4. Run integration tests
flutter test integration_test/

# 5. Build release
flutter build ios --release

# 6. Check bundle size
flutter build ios --analyze-size
```

---

## 🚦 Testing Workflow

### Daily Development

```bash
# Morning: Start fresh
flutter clean
flutter pub get
cd ios && pod install && cd ..

# Development: Use hot reload
flutter run -d chrome  # Fast iteration
# Make changes → Press 'r'

# Testing: Use iOS simulator
flutter run -d iphone  # Full feature testing
```

### Before Commit

```bash
# Run checks
flutter analyze
flutter test
dart format lib/ --set-exit-if-changed

# Verify no console warnings
flutter run -d iphone --release
```

### Before Release

```bash
# Full test suite
flutter test --coverage
flutter test integration_test/

# Build all platforms
flutter build ios --release
flutter build macos --release
flutter build web --release

# Size analysis
flutter build ios --analyze-size
```

---

## 📚 Quick Reference

| Command                 | Purpose                  |
| ----------------------- | ------------------------ |
| `flutter doctor`        | Check setup status       |
| `flutter devices`       | List available devices   |
| `flutter run -d iphone` | Run on iOS               |
| `flutter run -d macos`  | Run on macOS             |
| `flutter run -d chrome` | Run on Chrome            |
| `flutter test`          | Run unit tests           |
| `flutter clean`         | Clean build cache        |
| `flutter pub get`       | Install dependencies     |
| `pod install`           | Install iOS dependencies |
| `flutter analyze`       | Static code analysis     |
| `dart format lib/`      | Format code              |

---

## 🆘 Need Help?

1. **Full Guide**: See [FLUTTER_TESTING_MACOS_GUIDE.md](../FLUTTER_TESTING_MACOS_GUIDE.md)
2. **Project Docs**: See [CLAUDE.md](../CLAUDE.md)
3. **Testing Guide**: See [README_TESTING.md](README_TESTING.md)
4. **Flutter Docs**: https://docs.flutter.dev/testing

---

**Estimated Setup Time**: 5 minutes
**Estimated First Run**: 1 minute
**Hot Reload Speed**: < 1 second

🎉 **You're ready to test!**
