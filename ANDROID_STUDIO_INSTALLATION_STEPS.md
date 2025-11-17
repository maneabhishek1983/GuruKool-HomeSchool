# Android Studio Installation - Step-by-Step Checklist

**Status**: Android Studio downloaded ✅
**Next**: Install and configure for Flutter APK building

---

## 📋 Installation Checklist

Follow these steps in order. Check off each step as you complete it.

### Step 1: Run Android Studio Installer

- [ ] **Locate downloaded file**: `android-studio-xxxx-windows.exe` (probably in Downloads folder)
- [ ] **Double-click** the installer to run it
- [ ] **Click "Next"** on Welcome screen
- [ ] **Select components** (check both):
  - ☑️ Android Studio
  - ☑️ Android Virtual Device (for emulator - optional but recommended)
- [ ] **Click "Next"**

**Install Location**:

- Default (recommended): `C:\Program Files\Android\Android Studio`
- If C: drive is full, you can choose another drive

- [ ] **Click "Next"** → **Install**
- [ ] **Wait for installation** (2-5 minutes)
- [ ] **Click "Next"** → **Finish**

✅ **Checkpoint**: Android Studio is now installed

---

### Step 2: First Launch - Setup Wizard

Android Studio will automatically launch a setup wizard.

- [ ] **Welcome Screen**: Click **"Next"**
- [ ] **Install Type**: Select **"Standard"** (recommended)
  - This installs everything you need for Flutter
- [ ] **Select UI Theme**: Choose **Darcula** (dark) or **Light** (your preference)
- [ ] **Verify Settings**: Review the summary
  - Should show: Android SDK, Android SDK Platform, Performance (Intel HAXM), Android Virtual Device
- [ ] **Click "Next"**

**SDK Download** (This is the longest part - 10-30 minutes):

- [ ] **Accept licenses**: Click **"Accept"** for each component
- [ ] **Click "Finish"** to start downloading
- [ ] **Wait for download** (~3-5 GB):
  - Android SDK Platform
  - Android SDK Build-Tools
  - Android Emulator
  - SDK Platform-Tools

**Progress indicator will show percentage complete.**

- [ ] **Click "Finish"** when complete

✅ **Checkpoint**: Android SDK is downloaded and installed

---

### Step 3: Note Your SDK Location

**VERY IMPORTANT**: You'll need this path for environment variables.

- [ ] **Open Android Studio** (if closed)
- [ ] **Click "More Actions"** → **"SDK Manager"**
  - Or: Menu → **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**

**Look at the top of the window:**

```
Android SDK Location: C:\Users\abhis\AppData\Local\Android\Sdk
```

- [ ] **Copy this exact path** (you'll need it in Step 5)
- [ ] **Write it down or keep this window open**

**My SDK Location** (fill this in):

```
_____________________________________________
```

✅ **Checkpoint**: SDK location identified

---

### Step 4: Install Required SDK Packages

Still in SDK Manager:

#### SDK Platforms Tab:

- [ ] **Check "Show Package Details"** (bottom right)
- [ ] **Install these API levels** (check the boxes):
  - ☑️ **Android 14.0 (API 34)** - Latest
  - ☑️ **Android 13.0 (API 33)**
  - ☑️ **Android 12.0 (API 31)**
  - ☑️ **Android 11.0 (API 30)** - Minimum recommended

#### SDK Tools Tab:

- [ ] **Click "SDK Tools" tab** (top of window)
- [ ] **Check "Show Package Details"** (bottom right)
- [ ] **Install these tools** (check the boxes):
  - ☑️ **Android SDK Build-Tools 34.0.0** (latest version)
  - ☑️ **Android SDK Command-line Tools** (latest)
  - ☑️ **Android SDK Platform-Tools** (latest)
  - ☑️ **Android Emulator** (latest)
  - ☑️ **Intel x86 Emulator Accelerator (HAXM)** (Windows only - speeds up emulator)

- [ ] **Click "Apply"** button (bottom right)
- [ ] **Review packages** in confirmation dialog
- [ ] **Click "OK"**
- [ ] **Accept licenses** (click "Accept" for each)
- [ ] **Click "OK"** to start download
- [ ] **Wait for download and installation** (5-10 minutes)
- [ ] **Click "Finish"** when done
- [ ] **Click "OK"** to close SDK Manager

✅ **Checkpoint**: All required SDK packages installed

---

### Step 5: Set Environment Variables (CRITICAL)

**This is the most important step for Flutter to work!**

#### 5a. Open Environment Variables

**Method 1** (Quickest):

- [ ] **Press** `Win + R` on keyboard
- [ ] **Type**: `sysdm.cpl`
- [ ] **Press Enter**
- [ ] **Click "Advanced" tab**
- [ ] **Click "Environment Variables" button**

**Method 2** (Alternative):

- [ ] Right-click **"This PC"** → **Properties**
- [ ] **Click "Advanced system settings"**
- [ ] **Click "Environment Variables"**

✅ You should see a window with "User variables" and "System variables"

#### 5b. Add ANDROID_HOME Variable

- [ ] Under **"User variables for abhis"**, click **"New"**
- [ ] **Variable name**: `ANDROID_HOME`
- [ ] **Variable value**: Paste your SDK location from Step 3
  - Example: `C:\Users\abhis\AppData\Local\Android\Sdk`
  - ⚠️ **IMPORTANT**: Use YOUR exact path, no trailing slash
- [ ] **Click "OK"**

✅ **Checkpoint**: ANDROID_HOME created

#### 5c. Add JAVA_HOME Variable

Android Studio includes Java. We need to point to it.

- [ ] Under **"User variables"**, click **"New"** again
- [ ] **Variable name**: `JAVA_HOME`
- [ ] **Variable value**: `C:\Program Files\Android\Android Studio\jbr`
  - This is the Java Runtime included with Android Studio
- [ ] **Click "OK"**

✅ **Checkpoint**: JAVA_HOME created

#### 5d. Update PATH Variable

- [ ] Under **"User variables"**, find and select **"Path"**
- [ ] **Click "Edit"**
- [ ] **Click "New"** button
- [ ] **Add this line**: `%ANDROID_HOME%\platform-tools`
- [ ] **Click "New"** again
- [ ] **Add this line**: `%ANDROID_HOME%\cmdline-tools\latest\bin`
- [ ] **Click "New"** again
- [ ] **Add this line**: `%ANDROID_HOME%\emulator`
- [ ] **Click "New"** again
- [ ] **Add this line**: `%JAVA_HOME%\bin`
- [ ] **Click "OK"**
- [ ] **Click "OK"** again (close Environment Variables)
- [ ] **Click "OK"** again (close System Properties)

✅ **Checkpoint**: PATH updated with Android tools

---

### Step 6: Verify Installation (MUST RESTART TERMINAL)

**CRITICAL**: Close ALL PowerShell/CMD windows and open a NEW one.

- [ ] **Close all terminal windows**
- [ ] **Open NEW PowerShell** (Windows search → "PowerShell")

**Run these verification commands:**

```powershell
# 1. Check ANDROID_HOME
echo $env:ANDROID_HOME
```

- [ ] **Should show**: `C:\Users\abhis\AppData\Local\Android\Sdk` (or your path)

```powershell
# 2. Check ADB (Android Debug Bridge)
adb version
```

- [ ] **Should show**: `Android Debug Bridge version 1.x.x`

```powershell
# 3. Check Java
java -version
```

- [ ] **Should show**: `openjdk version "17.x.x"` or `"11.x.x"`

```powershell
# 4. Check Flutter Doctor
cd c:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src\gurukool_teacher
flutter doctor
```

- [ ] **Should show**: `[✓] Android toolchain - develop for Android devices`

**If any command fails**, environment variables didn't load. Restart terminal and try again.

✅ **Checkpoint**: Environment verified

---

### Step 7: Accept Android Licenses

```powershell
flutter doctor --android-licenses
```

- [ ] **Type "y"** for each license (5-7 licenses)
- [ ] **Press Enter** after each "y"
- [ ] **Wait until it says**: "All SDK package licenses accepted"

✅ **Checkpoint**: Licenses accepted

---

### Step 8: Final Flutter Doctor Check

```powershell
flutter doctor -v
```

**Expected output**:

```
[✓] Flutter (Channel stable, 3.x.x)
[✓] Android toolchain - develop for Android devices (Android SDK version 34.0.0)
[✓] Chrome - develop for the web
[✓] Android Studio (version 2024.x)
[!] Connected device (no devices available) ← This is OK for now
```

- [ ] **Verify**: `[✓] Android toolchain` shows checkmark
- [ ] **Verify**: `[✓] Android Studio` shows checkmark

✅ **Checkpoint**: Flutter recognizes Android SDK

---

### Step 9: Build Your First APK! 🎉

```powershell
# Make sure you're in the Flutter project
cd c:\Users\abhis\Documents\Side-Hustle\gurukool-homeschool-src\gurukool_teacher

# Clean previous builds
flutter clean

# Get dependencies
flutter pub get

# Build release APK (this will take 3-10 minutes first time)
flutter build apk --release
```

**Watch for**:

- [ ] **Gradle download** (first time only - 2-3 minutes)
- [ ] **Building** messages
- [ ] **Final message**: `✓ Built build\app\outputs\flutter-apk\app-release.apk (XX.X MB)`

**If successful**:

```powershell
# Open the folder with your APK
explorer build\app\outputs\flutter-apk
```

- [ ] **Verify**: You see `app-release.apk` file

✅ **SUCCESS**: APK built successfully!

---

## 🎯 What to Do Next

### Install APK on Android Device

1. **Enable Developer Options** on your Android phone:
   - Settings → About Phone → Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings → Developer Options → USB Debugging → ON

3. **Connect phone to PC** with USB cable

4. **Verify connection**:

   ```powershell
   adb devices
   ```

   Should show your device

5. **Install APK**:

   ```powershell
   adb install build\app\outputs\flutter-apk\app-release.apk
   ```

6. **Launch app on phone**: Find "GuruKool Teacher" in app drawer

7. **Test QR Scanner**:
   - Login: `teacher@example.com` / `teacher123`
   - Open QR scanner
   - Scan test QR codes from `test-qr-codes/test-qr-codes.html`

---

## 🆘 Troubleshooting

### "ANDROID_HOME not set" after Step 6

**Fix**:

1. Verify environment variable is created (repeat Step 5b)
2. Restart terminal (MUST close and reopen)
3. Try `echo $env:ANDROID_HOME` again

### "adb: command not found"

**Fix**:

1. Verify PATH includes `%ANDROID_HOME%\platform-tools` (repeat Step 5d)
2. Restart terminal
3. Try again

### "License not accepted" during APK build

**Fix**:

```powershell
flutter doctor --android-licenses
# Type 'y' for all
```

### APK build fails with Gradle error

**Fix**:

```powershell
cd gurukool_teacher
flutter clean
flutter pub get
flutter build apk --release --verbose
```

Check error message and search for solution.

---

## 📊 Progress Tracker

**Installation Progress**: \_\_ / 9 steps complete

- [ ] Step 1: Run installer
- [ ] Step 2: Setup wizard
- [ ] Step 3: Note SDK location
- [ ] Step 4: Install SDK packages
- [ ] Step 5: Set environment variables
- [ ] Step 6: Verify installation
- [ ] Step 7: Accept licenses
- [ ] Step 8: Flutter doctor check
- [ ] Step 9: Build APK

**Estimated Time**: 1-2 hours total

---

## 🎉 Completion Checklist

When you can check ALL of these, you're done:

- [ ] Android Studio installed
- [ ] SDK packages downloaded
- [ ] `flutter doctor` shows `[✓] Android toolchain`
- [ ] `app-release.apk` file exists
- [ ] APK installs on Android device
- [ ] App launches and login works
- [ ] QR scanner works with camera

**You are now ready to build Android apps!** 🚀

---

## 📝 Notes & Issues

Use this space to note any issues you encountered and how you resolved them:

```
Issue: _______________________________________________
Solution: _____________________________________________

Issue: _______________________________________________
Solution: _____________________________________________
```

---

**Need help?** Refer to [ANDROID_SDK_SETUP_GUIDE.md](ANDROID_SDK_SETUP_GUIDE.md) for detailed troubleshooting.
