# Face Recognition Troubleshooting Guide

## Issue: "Camera fails to open on mobile"

If the face recognition works on your desktop (localhost) but fails on your mobile device (accessed via IP address), the issue is almost certainly **HTTPS**.

### 1. The Secure Context Requirement

Browser security policies **block** camera access (`getUserMedia`) on any site that is **not** served over HTTPS.

- `http://localhost:3000` ✅ Allowed (Localhost is an exception)
- `http://192.168.1.5:3000` ❌ **BLOCKED** (Insecure HTTP)
- `https://myapp.vercel.app` ✅ Allowed (HTTPS)

### 2. Solutions for Testing on Mobile

#### Option A: Use a Tunnel (Recommended for Dev)

Use a tool like `ngrok` or `cloudflared` to expose your local port 3000 via a public HTTPS URL.

**Using ngrok:**

1.  Install ngrok.
2.  Run: `ngrok http 3000`
3.  Copy the `https://....ngrok-free.app` URL.
4.  Open that HTTPS URL on your mobile phone.
5.  **Note**: Authentication cookies might behave differently (SameSite policies), but camera will work.

#### Option B: Deploy to Staging

Deploy your branch to Vercel or similar. It provides HTTPS by default.

#### Option C: Enabling Insecure Origins (Chrome/Android only)

If you must use IP address:

1.  On your Android phone, open Chrome.
2.  Go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
3.  Add `http://YOUR_PC_IP:3000` to the text box.
4.  Enable the flag and Relaunch Chrome.
5.  Now the camera should work on that specific IP.

### 3. Automatic QR Code Fallback

The application automatically detects when face recognition is unavailable and falls back to QR code verification. This happens when:

- The app is accessed over HTTP (not HTTPS) on mobile
- The browser does not support `getUserMedia`
- The `NEXT_PUBLIC_ENABLE_FACE_RECOGNITION` feature flag is set to `false`

When auto-fallback activates, the teacher sees the QR code check-in UI directly. If face recognition is available (HTTPS + camera API), the teacher sees both Face Scan and QR Code options with Face Scan recommended.

### 4. Other Potential Issues

- **Permissions**: Ensure you clicked "Allow" when the browser asked for camera permissions. If you denied it once, you must go to Browser Settings > Site Settings > Camera to reset it.
- **iOS Safari**: Requires user interaction to play video sometimes? (We have `autoplay` and `playsInline` set, which usually works).
- **Memory**: If the page crashes, the Face API models might be too heavy for the device. (We use `ssd_mobilenetv1` which is optimized for mobile).
- **Model Caching**: Face-api models (~12MB) are cached via the PWA service worker and IndexedDB/Cache API for faster subsequent loads on mobile.
