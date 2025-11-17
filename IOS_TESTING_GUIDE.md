# iOS Testing Guide - GuruKool Teacher Mobile App

Complete guide for testing the Flutter mobile app on iOS devices and simulators.

## Prerequisites

### Required Software

- **macOS** (iOS development only works on Mac)
- **Xcode** 15.0 or later ([Download from App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **Flutter SDK** (already installed)
- **CocoaPods** (for iOS dependencies)

### Install CocoaPods

```bash
# Install CocoaPods if not already installed
sudo gem install cocoapods

# Verify installation
pod --version
```

---

## Quick Start: Test on iOS Simulator (Easiest Method)

### 1. Open iOS Simulator

```bash
# List available simulators
xcrun simctl list devices

# Open default simulator
open -a Simulator
```

Or open from Xcode:

- Open Xcode
- Go to **Xcode** → **Open Developer Tool** → **Simulator**

### 2. Choose a Device

From Simulator menu: **File** → **Open Simulator** → Choose device (e.g., iPhone 15 Pro)

### 3. Run Flutter App

```bash
cd gurukool_teacher

# List available devices
flutter devices

# Run on iOS simulator (auto-selects running simulator)
flutter run
```

**Expected Output:**

```
Launching lib/main.dart on iPhone 15 Pro in debug mode...
Running pod install...
Running Xcode build...
✓ Built build/ios/Debug-iphonesimulator/Runner.app
Syncing files to device iPhone 15 Pro...
```

### 4. Test QR Scanner

The QR scanner **WILL NOT WORK** on simulator (no camera hardware). To test QR functionality:

**Option A: Use Real Device** (see below)

**Option B: Test with Mock Data**

- The app currently uses mock data in `qr_scanner_screen.dart`
- Scan any QR code to trigger the flow
- Real scanning requires physical iOS device

---

## Test on Real iPhone/iPad (Recommended for QR Scanner)

### Prerequisites

- iPhone or iPad with iOS 12.0+
- Lightning/USB-C cable
- Apple ID (free - no paid developer account needed for testing)

### Step 1: Enable Developer Mode on iPhone

1. Connect iPhone to Mac via cable
2. On iPhone: **Settings** → **Privacy & Security** → **Developer Mode** → Enable
3. iPhone will restart
4. Trust your Mac when prompted

### Step 2: Configure Xcode Signing

```bash
# Open iOS project in Xcode
cd gurukool_teacher
open ios/Runner.xcworkspace
```

In Xcode:

1. Select **Runner** project in left sidebar
2. Select **Runner** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (your Apple ID)
   - If no team: Click **Add Account** → Sign in with Apple ID
6. Change **Bundle Identifier** to unique name:
   - Change from: `com.gurukool.teacher`
   - To: `com.yourname.gurukool.teacher` (must be unique)

### Step 3: Trust Developer Certificate on iPhone

1. Run app: `flutter run` (with iPhone connected)
2. On iPhone, you'll see: **"Untrusted Developer"**
3. Go to iPhone: **Settings** → **General** → **VPN & Device Management**
4. Tap your Apple ID → **Trust**
5. Run `flutter run` again

### Step 4: Run and Test

```bash
cd gurukool_teacher

# List devices (should show your iPhone)
flutter devices

# Run on connected iPhone
flutter run
```

**Test QR Scanner:**

1. Open [test-qr-codes/test-qr-codes.html](test-qr-codes/test-qr-codes.html) on your computer
2. Display QR code on screen
3. Use iPhone app to scan the QR code
4. Verify session check-in flow works

---

## Build iOS App for Distribution

### Option 1: Development Build (Ad-Hoc)

For testing on specific devices without App Store:

```bash
cd gurukool_teacher

# Build iOS archive
flutter build ipa --release
```

Output: `build/ios/ipa/gurukool_teacher.ipa`

**Install on Device:**

1. Open Xcode
2. Go to **Window** → **Devices and Simulators**
3. Select your iPhone
4. Drag `.ipa` file to **Installed Apps** section

### Option 2: TestFlight Distribution

For beta testing with multiple users:

**Prerequisites:**

- **Apple Developer Account** ($99/year)
- **App Store Connect** access

**Steps:**

1. **Enroll in Apple Developer Program**
   - https://developer.apple.com/programs/
   - $99/year required

2. **Create App in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Click **+** → **New App**
   - Platform: iOS
   - Bundle ID: `com.gurukool.teacher` (or your custom one)

3. **Configure Signing in Xcode**

   ```bash
   open ios/Runner.xcworkspace
   ```

   - Runner → Signing & Capabilities
   - Change from "Personal Team" to your paid Developer Team
   - Select "iOS Distribution" certificate

4. **Build and Upload**

   ```bash
   # Build release IPA
   flutter build ipa --release

   # Upload to TestFlight (opens Xcode Organizer)
   open build/ios/archive/Runner.xcarchive
   ```

   - In Xcode Organizer: **Distribute App** → **TestFlight**
   - Follow upload wizard

5. **Invite Testers**
   - App Store Connect → TestFlight → Add Testers
   - Enter email addresses
   - Testers receive email with TestFlight link

### Option 3: App Store Release

For public distribution (requires Apple Developer Account):

1. Complete all TestFlight steps above
2. In App Store Connect:
   - Fill out app metadata (description, screenshots, pricing)
   - Submit for App Review
   - Wait 1-3 days for approval
3. Once approved, release to App Store

---

## Troubleshooting

### Error: "No iOS devices found"

```bash
# Check connected devices
flutter devices

# If no devices shown:
# 1. Unplug and replug iPhone
# 2. Trust computer on iPhone
# 3. Restart Xcode
```

### Error: "Signing requires a development team"

**Solution:**

1. Open Xcode: `open ios/Runner.xcworkspace`
2. Add Apple ID: Xcode → Preferences → Accounts → +
3. Select team in Signing & Capabilities

### Error: "Could not find an option named 'pod'"

```bash
# Install CocoaPods
sudo gem install cocoapods

# Update pod repo
cd gurukool_teacher/ios
pod repo update
pod install
```

### Error: "Untrusted Developer" on iPhone

1. iPhone: **Settings** → **General** → **VPN & Device Management**
2. Trust your developer certificate

### Camera Not Working on Simulator

**Expected:** iOS Simulator has no camera hardware.

**Solution:** Test QR scanner on real iPhone/iPad only.

### Build Takes Too Long

```bash
# Clean build cache
cd gurukool_teacher
flutter clean
rm -rf ios/Pods ios/Podfile.lock
cd ios && pod install && cd ..

# Try build again
flutter run
```

---

## Environment Configuration

### iOS-Specific Environment

The Flutter app reads `.env` file for configuration. Make sure it exists:

```bash
cd gurukool_teacher

# Copy example
cp .env.example .env

# Edit with your Supabase credentials
nano .env
```

Required variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Enable Location Services (for QR Check-in)

1. In Xcode, open `ios/Runner/Info.plist`
2. Add location permission:
   ```xml
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>We need your location to record where sessions take place.</string>
   ```

Already configured in the project ✅

---

## Performance Testing on iOS

### Check App Size

```bash
cd gurukool_teacher

# Build release version
flutter build ios --release

# Check size
ls -lh build/ios/Release-iphoneos/Runner.app
```

### Profile Performance

```bash
# Run in profile mode
flutter run --profile

# Open DevTools
flutter run --profile --observatory-port=8888
# Then open: http://localhost:8888 in Chrome
```

### Memory Usage

1. Run app on device
2. In Xcode: **Debug** → **Attach to Process** → Select your app
3. Open **Debug Navigator** → **Memory**

---

## Comparison: iOS vs Android Testing

| Feature                 | iOS (Mac Required)             | Android (Any OS)              |
| ----------------------- | ------------------------------ | ----------------------------- |
| **Setup Complexity**    | Medium (Xcode + Signing)       | Easy (Android Studio)         |
| **Simulator**           | ✅ Fast, accurate              | ✅ Fast, adequate             |
| **Real Device Testing** | ✅ USB cable                   | ✅ USB cable or WiFi          |
| **QR Scanner**          | ❌ Simulator / ✅ Real device  | ❌ Simulator / ✅ Real device |
| **Free Testing**        | ✅ Yes (with Apple ID)         | ✅ Yes                        |
| **Distribution**        | 💰 $99/year (App Store)        | ✅ Free (Google Play)         |
| **Build Time**          | 🐌 Slower (native compilation) | 🚀 Faster                     |
| **Hot Reload**          | ✅ Works great                 | ✅ Works great                |

---

## Quick Reference Commands

```bash
# List available devices
flutter devices

# Run on simulator
flutter run

# Run on connected iPhone
flutter run -d "Your iPhone Name"

# Build release IPA
flutter build ipa --release

# Clean build
flutter clean && cd ios && pod install && cd ..

# Open in Xcode
open ios/Runner.xcworkspace

# View logs
flutter logs
```

---

## Next Steps

After testing on iOS:

1. **Test QR Scanner** on real iPhone (critical feature)
2. **Test Login Flow** with `teacher@example.com` / `teacher123`
3. **Test Session History** with filters (All/Active/Completed)
4. **Verify Theme** matches web app (teal colors)
5. **Build APK** for Android testing: `flutter build apk --release`

---

## Need Help?

- **Flutter iOS Setup**: https://docs.flutter.dev/get-started/install/macos
- **Xcode Help**: https://developer.apple.com/xcode/
- **CocoaPods Issues**: https://guides.cocoapods.org/using/troubleshooting.html
- **TestFlight Guide**: https://developer.apple.com/testflight/

For GuruKool-specific issues, check:

- [Mobile Deployment Guide](MOBILE_DEPLOYMENT_GUIDE.md) - Android deployment
- [QR Code Testing Guide](QR_CODE_TESTING_GUIDE.md) - QR testing methods
