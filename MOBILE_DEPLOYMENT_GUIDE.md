# Mobile Deployment Guide - GuruKool Teacher App

**Date**: 2025-11-17
**Purpose**: Complete guide for building, testing, and deploying the Flutter mobile app to Android and iOS devices

---

## 📱 Overview

The GuruKool Teacher mobile app is a Flutter application that can be deployed to:

- ✅ **Android devices** (phones, tablets)
- ✅ **iOS devices** (iPhones, iPads) - requires Mac
- ✅ **Web browsers** (Chrome, Safari) - limited QR scanner support
- ⚠️ **Android emulator** / iOS simulator - for testing

---

## 🚀 Quick Start

### For Android (Windows/Mac/Linux)

```bash
# Connect your Android device via USB
adb devices

# Run on connected device
cd gurukool_teacher
flutter run

# Or build APK for distribution
flutter build apk --release
```

### For iOS (Mac only)

```bash
# Connect your iPhone via cable
flutter devices

# Run on connected device
cd gurukool_teacher
flutter run

# Or build IPA for App Store
flutter build ipa --release
```

---

## 🔧 Prerequisites

### 1. Flutter SDK

```bash
# Check if Flutter is installed
flutter --version

# Expected output:
# Flutter 3.x.x • channel stable

# If not installed, download from:
# https://docs.flutter.dev/get-started/install
```

### 2. Android Requirements

**Android Studio**: Required for Android builds

```bash
# Check Android toolchain
flutter doctor -v

# Should show:
# [✓] Android toolchain - develop for Android devices
```

**Install Android Studio**:

1. Download from: https://developer.android.com/studio
2. Install Android SDK (API 21 or higher)
3. Accept Android licenses: `flutter doctor --android-licenses`

### 3. iOS Requirements (Mac only)

**Xcode**: Required for iOS builds

```bash
# Check iOS toolchain
flutter doctor -v

# Should show:
# [✓] Xcode - develop for iOS and macOS
```

**Install Xcode**:

1. Download from Mac App Store
2. Install Command Line Tools: `xcode-select --install`
3. Accept licenses: `sudo xcodebuild -license accept`

### 4. Device Setup

**Android**:

1. Enable Developer Options: Settings → About Phone → Tap "Build Number" 7 times
2. Enable USB Debugging: Settings → Developer Options → USB Debugging
3. Connect via USB, allow debugging when prompted

**iOS**:

1. Trust Computer: Connect iPhone, tap "Trust This Computer"
2. Enable Developer Mode: Settings → Privacy & Security → Developer Mode
3. Apple Developer Account required for deployment

---

## 📦 Build for Android

### Method 1: Debug Build (for testing)

```bash
cd gurukool_teacher

# Build and install on connected device
flutter run

# Build APK only (without installing)
flutter build apk --debug
```

**Output**: `build/app/outputs/flutter-apk/app-debug.apk`

### Method 2: Release Build (for production)

```bash
cd gurukool_teacher

# Build release APK
flutter build apk --release

# Build Android App Bundle (recommended for Play Store)
flutter build appbundle --release
```

**Outputs**:

- APK: `build/app/outputs/flutter-apk/app-release.apk`
- AAB: `build/app/outputs/bundle/release/app-release.aab`

### Method 3: Split APKs (smaller file size)

```bash
# Build separate APKs for each architecture
flutter build apk --split-per-abi --release
```

**Outputs** (smaller files):

- `app-armeabi-v7a-release.apk` (older devices)
- `app-arm64-v8a-release.apk` (most modern devices)
- `app-x86_64-release.apk` (emulators)

---

## 📱 Install on Android Device

### Option 1: Direct Install via USB

```bash
# Connect device
adb devices

# Install APK
adb install build/app/outputs/flutter-apk/app-release.apk

# Or use flutter
flutter install
```

### Option 2: Transfer APK to Device

1. Copy `app-release.apk` to device via:
   - Google Drive
   - Email
   - USB file transfer
   - Cloud storage

2. On device:
   - Locate APK file
   - Tap to install
   - Allow "Install from Unknown Sources" if prompted

### Option 3: QR Code Installation

1. Upload APK to cloud storage (Dropbox, Google Drive)
2. Get public download link
3. Create QR code with link
4. Scan QR code on device to download & install

---

## 🍎 Build for iOS

### Prerequisites

- Mac computer
- Xcode installed
- Apple Developer Account ($99/year for App Store deployment)
- iOS device or simulator

### Method 1: Debug Build

```bash
cd gurukool_teacher

# Run on connected iPhone
flutter run

# Build for simulator
flutter build ios --debug --simulator
```

### Method 2: Release Build

```bash
# Build IPA for distribution
flutter build ipa --release

# Output: build/ios/ipa/gurukool_teacher.ipa
```

### Code Signing (Required for iOS)

**Automatic Signing** (recommended):

1. Open Xcode: `open ios/Runner.xcworkspace`
2. Select Runner target
3. Signing & Capabilities tab
4. Enable "Automatically manage signing"
5. Select your Team (Apple Developer Account)

**Manual Signing**:

1. Create App ID on https://developer.apple.com
2. Create provisioning profile
3. Configure in Xcode

---

## 🏪 App Store Distribution

### Android - Google Play Store

1. **Create App on Play Console**:
   - Go to https://play.google.com/console
   - Create Application
   - Fill app details, screenshots, description

2. **Upload App Bundle**:

   ```bash
   flutter build appbundle --release
   ```

   - Upload `app-release.aab` to Play Console
   - Set pricing, countries, content rating

3. **Release**:
   - Internal testing → Closed testing → Open testing → Production
   - Each stage requires review

**Time**: 2-7 days for review

### iOS - Apple App Store

1. **Create App on App Store Connect**:
   - Go to https://appstoreconnect.apple.com
   - Create New App
   - Fill app information

2. **Upload via Xcode**:

   ```bash
   flutter build ipa --release
   ```

   - Open Xcode: `open build/ios/archive/Runner.xcarchive`
   - Product → Archive
   - Distribute App → App Store Connect

3. **Submit for Review**:
   - Add screenshots, description, keywords
   - Submit for App Store review

**Time**: 1-3 days for review

---

## 🧪 Testing Before Release

### 1. Test on Real Devices

```bash
# Android
flutter run --release

# iOS
flutter run --release
```

**Check**:

- [ ] App launches successfully
- [ ] Login works
- [ ] QR scanner accesses camera
- [ ] Location permissions work
- [ ] Network requests succeed
- [ ] Theme colors match web app

### 2. Test APK Installation

```bash
# Build release APK
flutter build apk --release

# Install on device
adb install build/app/outputs/flutter-apk/app-release.apk

# Test without USB connection
```

### 3. Performance Testing

```bash
# Build with profiling
flutter run --profile

# Use DevTools to check:
# - Memory usage
# - Frame rate
# - Network calls
```

---

## 🔐 Code Signing & Security

### Android App Signing

**Create Keystore** (one-time):

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

**Configure in `android/key.properties`**:

```properties
storePassword=<password>
keyPassword=<password>
keyAlias=upload
storeFile=<path-to-keystore>
```

**Reference in `android/app/build.gradle`**:

```gradle
android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### iOS Code Signing

Handled automatically by Xcode with Apple Developer Account.

---

## 🌐 Environment Configuration

### Production vs Development

**Development** (`.env`):

```env
SUPABASE_URL=https://miqhtpbutevdrkyndflf.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
ENVIRONMENT=development
```

**Production** (`.env.production`):

```env
SUPABASE_URL=https://production.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
ENVIRONMENT=production
```

**Build with environment**:

```bash
# Development
flutter build apk --dart-define=ENVIRONMENT=development

# Production
flutter build apk --release --dart-define=ENVIRONMENT=production
```

---

## 📊 App Versioning

### Update Version

**In `pubspec.yaml`**:

```yaml
version: 1.0.0+1
#        │ │ │  │
#        │ │ │  └─ Build number (increment for each build)
#        │ │ └──── Patch version
#        │ └────── Minor version
#        └──────── Major version
```

**Best practices**:

- Increment build number (+1) for each build
- Increment patch (0.0.X) for bug fixes
- Increment minor (0.X.0) for new features
- Increment major (X.0.0) for breaking changes

---

## 🚨 Common Issues & Fixes

### Issue 1: "SDK location not found"

**Fix**:

```bash
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk  # Mac
export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows
```

### Issue 2: "Gradle build failed"

**Fix**:

```bash
cd android
./gradlew clean
cd ..
flutter build apk --release
```

### Issue 3: "CocoaPods not installed" (iOS)

**Fix**:

```bash
sudo gem install cocoapods
cd ios
pod install
cd ..
flutter build ios
```

### Issue 4: "No devices found"

**Android**:

```bash
adb kill-server
adb start-server
adb devices
```

**iOS**:

```bash
# Ensure device is trusted
idevice_id -l
```

---

## 📦 Distribution Options

### 1. Direct APK Distribution

**Pros**: Fast, no store approval needed
**Cons**: Users must enable "Unknown Sources"

**Use for**: Internal testing, beta users

### 2. Google Play Store

**Pros**: Official, trusted, automatic updates
**Cons**: Review process, 15% commission

**Use for**: Public release

### 3. Third-Party Stores

**Options**:

- Amazon Appstore
- Samsung Galaxy Store
- F-Droid (open source apps)

### 4. Enterprise Distribution (iOS)

**Apple Enterprise Program**: $299/year
**Use for**: Internal corporate apps

---

## 🎯 Deployment Checklist

### Pre-Deployment

- [ ] All features working
- [ ] Tested on multiple devices
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] App icon and splash screen ready
- [ ] Screenshots for store listing
- [ ] App description written

### Build

- [ ] Version number incremented
- [ ] Environment configured (production)
- [ ] Release build successful
- [ ] APK/IPA signed
- [ ] File size optimized (<50MB preferred)

### Testing

- [ ] Install from APK/IPA (not via IDE)
- [ ] Test offline functionality
- [ ] Test on slow network
- [ ] Test on different screen sizes
- [ ] Test on different Android/iOS versions

### Store Submission

- [ ] Store listing complete
- [ ] Screenshots uploaded (5+ per type)
- [ ] Privacy policy URL added
- [ ] Content rating set
- [ ] Countries/regions selected
- [ ] Pricing configured
- [ ] App submitted for review

---

## 📞 Support & Resources

**Flutter Documentation**:

- https://docs.flutter.dev/deployment

**Android**:

- Play Console: https://play.google.com/console
- Developer Docs: https://developer.android.com

**iOS**:

- App Store Connect: https://appstoreconnect.apple.com
- Developer Portal: https://developer.apple.com

**Code Signing**:

- Android: https://developer.android.com/studio/publish/app-signing
- iOS: https://developer.apple.com/support/code-signing/

---

## ✅ Next Steps

1. **Test QR Codes**: Use generated test QR codes from `test-qr-codes/test-qr-codes.html`
2. **Build Release APK**: `flutter build apk --release`
3. **Install on Device**: Test real-world usage
4. **Fix Any Issues**: Based on testing feedback
5. **Prepare Store Listing**: Screenshots, description, etc.
6. **Submit to Store**: Google Play and/or App Store

---

**Status**: 📱 Ready for mobile deployment
**Recommended**: Start with Android (easier process)
**Timeline**: ~1 week for first release (including review time)
