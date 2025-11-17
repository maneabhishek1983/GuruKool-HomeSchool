# Android SDK Setup Guide - Windows

Complete guide to install Android Studio and SDK for building Flutter APKs on Windows.

## Overview

To build Android APKs for the GuruKool Teacher mobile app, you need:

- ✅ **Flutter SDK** (already installed)
- ⚠️ **Android Studio** (need to install)
- ⚠️ **Android SDK** (comes with Android Studio)
- ⚠️ **Java Development Kit (JDK)** (comes with Android Studio)

---

## Step 1: Download Android Studio

### 1.1 Download

1. Go to: https://developer.android.com/studio
2. Click **Download Android Studio**
3. Accept terms and download (approx 1.1 GB)
4. File: `android-studio-2024.x.x.x-windows.exe`

### 1.2 System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 8 GB minimum (16 GB recommended)
- **Disk**: 8 GB minimum (SSD recommended)
- **Screen**: 1280 x 800 minimum

---

## Step 2: Install Android Studio

### 2.1 Run Installer

1. Double-click `android-studio-xxxx-windows.exe`
2. Click **Next**
3. Select components:
   - ☑️ **Android Studio** (required)
   - ☑️ **Android Virtual Device** (optional - for emulator)
4. Click **Next**

### 2.2 Choose Install Location

**Default** (Recommended):

```
C:\Program Files\Android\Android Studio
```

**Custom** (if C: drive full):

```
D:\Android\Android Studio
```

Click **Next** → **Install**

### 2.3 First Launch Setup Wizard

1. **Welcome**: Click **Next**
2. **Install Type**: Select **Standard** (recommended)
3. **Select UI Theme**: Choose **Darcula** or **Light**
4. **Verify Settings**: Review and click **Next**
5. **Download Components**: Wait for SDK download (~3-5 GB)
   - Android SDK Platform
   - Android SDK Build-Tools
   - Android Emulator
   - Platform-Tools

This may take 10-30 minutes depending on your internet speed.

6. **Finish**: Click **Finish**

---

## Step 3: Configure Android SDK

### 3.1 Open SDK Manager

1. Open Android Studio
2. Click **More Actions** → **SDK Manager**
   - Or: **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**

### 3.2 Install Required SDK Packages

#### SDK Platforms Tab:

Check and install:

- ☑️ **Android 14.0 (API 34)** - Latest
- ☑️ **Android 13.0 (API 33)**
- ☑️ **Android 12.0 (API 31)**
- ☑️ **Android 11.0 (API 30)**

**Recommended**: Install at least API 30-34 for broad device support.

#### SDK Tools Tab:

Check "Show Package Details" at bottom right, then install:

- ☑️ **Android SDK Build-Tools 34.0.0** (latest)
- ☑️ **Android SDK Platform-Tools** (latest)
- ☑️ **Android SDK Command-line Tools** (latest)
- ☑️ **Android Emulator** (if you want to test on emulator)
- ☑️ **Intel x86 Emulator Accelerator (HAXM)** (Windows only - speeds up emulator)

Click **Apply** → **OK** → Wait for download

### 3.3 Note SDK Location

Default location:

```
C:\Users\abhis\AppData\Local\Android\Sdk
```

**Copy this path - you'll need it for environment variables!**

---

## Step 4: Set Environment Variables

### 4.1 Open Environment Variables

**Method 1: Quick Access**

1. Press `Win + R`
2. Type: `sysdm.cpl`
3. Press Enter
4. Go to **Advanced** tab → **Environment Variables**

**Method 2: Settings**

1. Right-click **This PC** → **Properties**
2. Click **Advanced system settings**
3. Click **Environment Variables**

### 4.2 Add ANDROID_HOME (User Variable)

1. Under **User variables**, click **New**
2. Variable name: `ANDROID_HOME`
3. Variable value: `C:\Users\abhis\AppData\Local\Android\Sdk`
   - ⚠️ **Replace with YOUR actual SDK path from Step 3.3**
4. Click **OK**

### 4.3 Add JAVA_HOME (User Variable)

Android Studio includes JDK. Find it:

**Default Location**:

```
C:\Program Files\Android\Android Studio\jbr
```

1. Click **New** under User variables
2. Variable name: `JAVA_HOME`
3. Variable value: `C:\Program Files\Android\Android Studio\jbr`
4. Click **OK**

### 4.4 Update PATH (User Variable)

1. Under **User variables**, find **Path**
2. Click **Edit**
3. Click **New** and add these **4 lines** one by one:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\cmdline-tools\latest\bin
   %ANDROID_HOME%\emulator
   %JAVA_HOME%\bin
   ```
4. Click **OK** → **OK** → **OK**

---

## Step 5: Verify Installation

### 5.1 Restart Terminal

**Close ALL open PowerShell/CMD windows** and open a new one.

### 5.2 Verify Android SDK

```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME
# Should show: C:\Users\abhis\AppData\Local\Android\Sdk

# Check ADB (Android Debug Bridge)
adb version
# Should show: Android Debug Bridge version 1.x.x

# Check SDK Manager
sdkmanager --version
# Should show version number
```

### 5.3 Verify Java

```powershell
java -version
# Should show: openjdk version "17.x.x" or "11.x.x"

javac -version
# Should show: javac 17.x.x or 11.x.x
```

### 5.4 Verify Flutter Recognizes Android SDK

```powershell
cd c:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src\gurukool_teacher
flutter doctor
```

**Expected output**:

```
[✓] Flutter (Channel stable, 3.x.x)
[✓] Android toolchain - develop for Android devices (Android SDK version 34.0.0)
[✓] Chrome - develop for the web
[✓] Android Studio (version 2024.x)
[!] Connected device (no devices available)
```

If you see ✓ for Android toolchain, you're good to go!

---

## Step 6: Accept Android Licenses

```powershell
flutter doctor --android-licenses
```

- Type **y** and press Enter for each license prompt
- There are typically 5-7 licenses to accept

After accepting, run `flutter doctor` again - Android toolchain should show ✓

---

## Step 7: Build Your First APK

### 7.1 Navigate to Project

```powershell
cd c:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src\gurukool_teacher
```

### 7.2 Clean Previous Builds

```powershell
flutter clean
```

### 7.3 Get Dependencies

```powershell
flutter pub get
```

### 7.4 Build Release APK

```powershell
flutter build apk --release
```

**Build time**: 3-10 minutes (first build is slower)

**Expected output**:

```
Running Gradle task 'assembleRelease'...
✓ Built build\app\outputs\flutter-apk\app-release.apk (18.5MB)
```

### 7.5 Locate APK

```powershell
explorer build\app\outputs\flutter-apk
```

APK file: `app-release.apk`

---

## Step 8: Install APK on Android Device

### Option A: USB Cable Installation

1. **Enable Developer Options on Android:**
   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - **Settings** → **Developer Options**
   - Toggle **USB Debugging** ON

3. **Connect Phone to PC:**
   - Use USB cable
   - On phone: Tap **Allow USB Debugging**
   - Select **File Transfer** mode

4. **Verify Connection:**

   ```powershell
   adb devices
   ```

   Should show your device:

   ```
   List of devices attached
   ABC123XYZ       device
   ```

5. **Install APK:**

   ```powershell
   adb install build\app\outputs\flutter-apk\app-release.apk
   ```

6. **Launch App:**
   - Find "GuruKool Teacher" in app drawer
   - Tap to launch

### Option B: Transfer APK Manually

1. Copy `app-release.apk` to Google Drive/Email
2. Download on Android phone
3. Tap APK file
4. Tap **Install** (may need to allow "Install from Unknown Sources")

---

## Step 9: Test QR Scanner on Real Device

1. Open GuruKool Teacher app on phone
2. Login: `teacher@example.com` / `teacher123`
3. Navigate to QR Scanner
4. Open `test-qr-codes\test-qr-codes.html` on computer
5. Point phone camera at QR code on screen
6. Verify session check-in works

---

## Troubleshooting

### Error: "ANDROID_HOME not set"

```powershell
# Check if set
echo $env:ANDROID_HOME

# If empty, set manually for current session
$env:ANDROID_HOME = "C:\Users\abhis\AppData\Local\Android\Sdk"

# Then retry flutter build
```

**Permanent fix**: Re-do Step 4 (Environment Variables) and restart terminal.

### Error: "SDK location not found"

1. Open Android Studio
2. **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Note the **Android SDK Location**
4. Set ANDROID_HOME to that path

### Error: "Gradle download failed"

```powershell
# Run with verbose logging
flutter build apk --release --verbose

# If behind proxy/firewall, configure Gradle proxy
# Create: C:\Users\abhis\.gradle\gradle.properties
```

Add to `gradle.properties`:

```properties
systemProp.http.proxyHost=your.proxy.host
systemProp.http.proxyPort=8080
systemProp.https.proxyHost=your.proxy.host
systemProp.https.proxyPort=8080
```

### Error: "License not accepted"

```powershell
flutter doctor --android-licenses
# Type 'y' for each license
```

### Error: "ADB not found"

```powershell
# Check PATH includes platform-tools
echo $env:PATH

# Should include: C:\Users\abhis\AppData\Local\Android\Sdk\platform-tools

# If missing, add to PATH (Step 4.4)
```

### Build Takes Too Long (>10 minutes)

```powershell
# Enable Gradle daemon (speeds up subsequent builds)
# Add to: gurukool_teacher\android\gradle.properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

### Error: "Execution failed for task ':app:minifyReleaseWithR8'"

This is an obfuscation error. To skip (for testing):

```powershell
# Edit: gurukool_teacher\android\app\build.gradle
# Find 'buildTypes' section and change:
minifyEnabled false  # Change from true to false
shrinkResources false  # Change from true to false
```

Then rebuild:

```powershell
flutter clean && flutter build apk --release
```

---

## Optional: Set Up Android Emulator

If you don't have a physical Android device:

### 1. Create Virtual Device

1. Open Android Studio
2. **More Actions** → **Virtual Device Manager**
3. Click **Create Device**
4. Select **Phone** → **Pixel 6** (or any recent device)
5. Click **Next**
6. Select **System Image**: **Android 13.0 (API 33)** or **Android 14.0 (API 34)**
   - Click **Download** if not installed
7. Click **Next** → **Finish**

### 2. Launch Emulator

1. In Virtual Device Manager, click **▶️ Play** button
2. Emulator window opens (may take 1-2 minutes first time)

### 3. Run Flutter App on Emulator

```powershell
# List devices
flutter devices

# Should show emulator:
# emulator-5554 • sdk gphone64 arm64 • android-arm64 • Android 13 (API 33)

# Run on emulator
cd gurukool_teacher
flutter run
```

**Note**: Emulator has limited camera support - QR scanner may not work well.

---

## Quick Reference

### Build Commands

```powershell
# Clean build cache
flutter clean

# Get dependencies
flutter pub get

# Build release APK
flutter build apk --release

# Build debug APK (faster, larger file)
flutter build apk --debug

# Build APK split by ABI (smaller files)
flutter build apk --split-per-abi

# Build App Bundle (for Play Store)
flutter build appbundle --release
```

### ADB Commands

```powershell
# List connected devices
adb devices

# Install APK
adb install path\to\app.apk

# Uninstall app
adb uninstall com.gurukool.teacher

# View device logs
adb logcat

# Take screenshot
adb exec-out screencap -p > screenshot.png

# Clear app data
adb shell pm clear com.gurukool.teacher
```

### Flutter Commands

```powershell
# Check environment
flutter doctor

# List devices
flutter devices

# Run on specific device
flutter run -d <device-id>

# Build and install debug APK
flutter install

# View logs
flutter logs
```

---

## Next Steps

After successful APK build:

1. ✅ **Install on Android device** (Step 8)
2. ✅ **Test login** with `teacher@example.com` / `teacher123`
3. ✅ **Test QR scanner** with camera on real device
4. ✅ **Test session history** and filters
5. ✅ **Verify theme** matches web app (teal colors)

---

## Resources

- **Android Studio**: https://developer.android.com/studio
- **Flutter Android Setup**: https://docs.flutter.dev/get-started/install/windows
- **Android Developer Docs**: https://developer.android.com/docs
- **Flutter Build Docs**: https://docs.flutter.dev/deployment/android

---

## Summary

**Total installation time**: 1-2 hours (including downloads)

**Disk space required**:

- Android Studio: ~2 GB
- Android SDK: ~5-8 GB
- Build cache: ~1-2 GB
- **Total**: ~10 GB

**Steps completed**:

1. ✅ Download Android Studio
2. ✅ Install with SDK Manager
3. ✅ Configure ANDROID_HOME and JAVA_HOME
4. ✅ Update PATH
5. ✅ Accept licenses
6. ✅ Build APK
7. ✅ Install on device
8. ✅ Test QR scanner

You're now ready to build and test Android apps! 🎉
