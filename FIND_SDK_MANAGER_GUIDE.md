# How to Find SDK Manager in Android Studio

## ⚠️ Important: Android Studio is NOT JetBrains

**Android Studio** = Made by Google (for Android development)
**JetBrains IDEs** = IntelliJ IDEA, WebStorm, PyCharm (different products)

If you're in a JetBrains IDE, you won't find Android SDK settings!

---

## ✅ Verify You're in Android Studio

Look at the **title bar** of your IDE window:

**Correct**:

```
Android Studio Ladybug | 2024.x.x
```

**Wrong** (JetBrains IDE):

```
IntelliJ IDEA 2024.x
WebStorm 2024.x
PyCharm 2024.x
```

If you see a JetBrains IDE, **close it and open Android Studio instead**.

---

## 🎯 Find SDK Manager - 4 Methods

### Method 1: Welcome Screen (EASIEST)

When you **first open Android Studio**, you see a Welcome screen.

**Steps**:

1. **Open Android Studio** (not JetBrains IDE!)
2. You should see: **"Welcome to Android Studio"**
3. Look for **three dots (⋮)** or **gear icon (⚙️)** at the top right
4. Click **"More Actions"** → **"SDK Manager"**

**Alternative on Welcome Screen**:

- Click **"Customize"** (left sidebar)
- Click **"All Settings"**
- Navigate to: **Languages & Frameworks** → **Android SDK**

---

### Method 2: Toolbar Icon (If Project Open)

If you already have a project open:

**Steps**:

1. Look at the **top toolbar** (below menu bar)
2. Find this icon: 📦 (SDK Manager - looks like a cube/box)
3. **Click the SDK Manager icon**

**Can't find the icon?**

- Go to: **View** → **Appearance** → **Toolbar** (make sure it's checked)

---

### Method 3: File Menu (Windows/Linux)

**CORRECT PATH** (not what was in the guide!):

```
File → Settings → Languages & Frameworks → Android SDK
```

**Step-by-step**:

1. Click **File** (top left)
2. Click **Settings** (or press `Ctrl+Alt+S`)
3. In the left sidebar, expand **"Languages & Frameworks"**
4. Click **"Android SDK"**

**NOT** this path (that was incorrect):

```
❌ Appearance & Behavior → System Settings → Android SDK
```

---

### Method 4: macOS Users

```
Android Studio → Preferences → Languages & Frameworks → Android SDK
```

Or press: `Cmd + ,` (Command + Comma)

---

## 🔍 What You Should See

Once you find SDK Manager, you'll see:

```
┌─────────────────────────────────────────┐
│ Android SDK Location:                   │
│ C:\Users\abhis\AppData\Local\Android\Sdk│
└─────────────────────────────────────────┘

Tabs:
┌────────────┬──────────┬─────────────┐
│ SDK Platforms│ SDK Tools│ SDK Update Sites│
└────────────┴──────────┴─────────────┘

SDK Platforms:
☑ Android 14.0 (API 34)
☐ Android 13.0 (API 33)
☐ Android 12.0 (API 31)
```

---

## 🆘 Still Can't Find It?

### Option A: Use Command Line Instead

You can configure SDK using command line tools:

1. **Open PowerShell**
2. **Navigate to SDK**:

   ```powershell
   cd C:\Users\abhis\AppData\Local\Android\Sdk\cmdline-tools\latest\bin
   ```

3. **List installed packages**:

   ```powershell
   .\sdkmanager --list
   ```

4. **Install packages**:

   ```powershell
   # Install platform API 34
   .\sdkmanager "platforms;android-34"

   # Install build tools
   .\sdkmanager "build-tools;34.0.0"

   # Install platform tools
   .\sdkmanager "platform-tools"
   ```

5. **Accept licenses**:
   ```powershell
   .\sdkmanager --licenses
   ```
   Type 'y' for each license.

---

### Option B: Reinstall Android Studio

If Android Studio looks completely different than described:

1. **Verify download source**: Did you download from https://developer.android.com/studio ?
2. **Check version**: Should be Android Studio (not IntelliJ IDEA)
3. **Reinstall** if you accidentally installed a JetBrains IDE

---

## 📸 Visual Reference

### What Android Studio Welcome Screen Looks Like:

```
┌─────────────────────────────────────────────────┐
│  🤖 Welcome to Android Studio                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Projects                     ⋮ More Actions    │
│  ┌─────────────────────┐                        │
│  │ + New Project       │                        │
│  │ 📂 Open            │                        │
│  │ 📥 Get from VCS     │                        │
│  └─────────────────────┘                        │
│                                                 │
│  Customize            Learn                     │
│  Get Started          Resources                 │
└─────────────────────────────────────────────────┘
```

Click **⋮ More Actions** → **SDK Manager**

---

### What SDK Manager Looks Like:

```
┌─────────────────────────────────────────────────┐
│  Settings for New Projects                      │
├─────────────────────────────────────────────────┤
│  Languages & Frameworks                         │
│    ▼ Android SDK                          ◄━━━  │
│      Build Tools                                │
│      NDK                                        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Android SDK Location:                     │ │
│  │ C:\Users\abhis\AppData\Local\Android\Sdk │ │
│  │                                           │ │
│  │ ┌─────────────┬─────────┬────────────┐  │ │
│  │ │SDK Platforms│SDK Tools│SDK Update  │  │ │
│  │ └─────────────┴─────────┴────────────┘  │ │
│  │                                           │ │
│  │ Show Package Details               ☐     │ │
│  │                                           │ │
│  │ Name               API Level  Revision   │ │
│  │ ☑ Android 14.0    34         3          │ │
│  │ ☐ Android 13.0    33         3          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│                     [Cancel]  [Apply]  [OK]     │
└─────────────────────────────────────────────────┘
```

---

## ✅ Quick Checklist

Before proceeding, verify:

- [ ] I'm in **Android Studio** (not IntelliJ IDEA or other JetBrains IDE)
- [ ] Title bar says **"Android Studio"**
- [ ] I found SDK Manager using one of the 4 methods above
- [ ] I can see **"Android SDK Location"** field
- [ ] I can see tabs: **SDK Platforms** | **SDK Tools**

If you checked all boxes above, you're ready to continue installation!

---

## 🎯 Next Steps After Finding SDK Manager

Once you've opened SDK Manager:

1. **Note the SDK Location** (top of window)
   - Copy this path: `C:\Users\abhis\AppData\Local\Android\Sdk`
   - You'll need it for environment variables

2. **SDK Platforms Tab**:
   - Check: Android 14.0 (API 34)
   - Check: Android 13.0 (API 33)
   - Check: Android 12.0 (API 31)

3. **SDK Tools Tab**:
   - Check: Android SDK Build-Tools
   - Check: Android SDK Command-line Tools
   - Check: Android SDK Platform-Tools

4. **Click "Apply"** → **Accept licenses** → **OK**

5. **Wait for download** (5-10 minutes)

Continue with **ANDROID_STUDIO_INSTALLATION_STEPS.md** Step 5 (Environment Variables).

---

## 💡 Pro Tip

**Shortcut to SDK Manager** (works anywhere in Android Studio):

- Press `Ctrl+Alt+S` (Windows/Linux) or `Cmd+,` (macOS)
- Type "SDK" in search box
- Click **"Android SDK"** in results

---

## 🆘 Still Stuck?

**Take a screenshot** of your IDE window and I'll help identify what you're looking at!

The most common issue: Users accidentally open **IntelliJ IDEA** (JetBrains) instead of **Android Studio** (Google).

**Solution**: Close IntelliJ IDEA → Open Android Studio from Start Menu.
