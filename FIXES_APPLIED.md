# MANU AI — All Fixes Applied

## 🔴 Critical Bug Fixes

### 1. OpenAI Streaming Fixed (`src/services/openai.ts`)
- **Before:** axios `responseType:'text'` — full response ek baar mein aata tha
- **After:** `fetch()` + `ReadableStream` + `TextDecoder` — real chunk-by-chunk streaming

### 2. Voice → AI Chat Fixed (`src/hooks/useVoiceControl.ts`)
- **Before:** Non-command voice messages sirf store mein save hote the, AI ko forward nahi hote the
- **After:** Unknown commands ab `streamChatCompletion()` ko call karte hain, AI ka response speak bhi karta hai

### 3. AdMob App ID Fixed (`app.json`)
- **Before:** `ca-app-pub-3684441716460567~1234567890` (placeholder)
- **After:** `ca-app-pub-3684441716460567~5579379323` (real ID)

### 4. Ad Unit IDs Fixed (`src/services/ads.ts`)
- Banner: `ca-app-pub-3684441716460567/7116352504` ✅
- Rewarded: `ca-app-pub-3684441716460567/7885822933` ✅
- Interstitial: `ca-app-pub-3684441716460567/4188433698` ✅ (was 1234567890)

### 5. AdMob App ID in AndroidManifest (`android/app/src/main/AndroidManifest.xml`)
- **After:** `ca-app-pub-3684441716460567~5579379323` set in `<meta-data>`

## 🟡 Missing Features Added

### 6. App Open Ad on Launch (`src/App.tsx`)
- App launch pe automatically `showAppOpenAd()` call hota hai (1.5s delay)
- App background se foreground aane pe bhi App Open Ad show hota hai

### 7. Stop Chat Button (`src/screens/ChatScreen.tsx`)
- Streaming ke dauran "■ Stop" button show hota hai
- User kisi bhi waqt AI response rok sakta hai

### 8. Interstitial Ads Triggered (`src/screens/ChatScreen.tsx`, `DashboardScreen.tsx`)
- ChatScreen kholne pe interstitial show hota hai (60s cooldown ke saath)
- Dashboard se Chat/Tools navigate karne pe bhi interstitial trigger hota hai

### 9. Banner Ad Size Fixed (`src/components/BannerAdComponent.tsx`)
- `BANNER` (fixed 320x50) → `ANCHORED_ADAPTIVE_BANNER` (responsive width)

## 🟢 Android Permissions Fixed (`AndroidManifest.xml`)

Added missing permissions:
- `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` (WiFi scan Android 9+ requires it)
- `ACCESS_WIFI_STATE` + `CHANGE_WIFI_STATE`
- `BLUETOOTH_SCAN` + `BLUETOOTH_CONNECT` (Android 12+ Bluetooth)
- `BLUETOOTH` + `BLUETOOTH_ADMIN` (Android 11 and below)

## ⚪ Still Pending (Manual Steps)

1. **Real GLB avatar files** — See `GLB_AVATARS_SETUP.md` for download instructions
2. **App Open Ad Unit ID** — Create App Open ad in AdMob console, replace `YOUR_APP_OPEN_ID` in `ads.ts`
3. **AI Memory ↔ Chat** — `aiMemory.ts` bana hai but `useChat.ts` se connected nahi
4. **Model selector** — Hardcoded `gpt-4o-mini`, settings mein selector add karna hai

---

## 🎨 Avatar3D — WebView Approach (Latest)

### Why WebView?
- `expo-gl` + Three.js in React Native → **app hang / crash** on low-end devices
- WebView runs in a **separate process** — main RN thread completely unaffected
- Three.js CDN loaded inside WebView — no native GL setup needed

### How it works
1. `buildAvatarHTML(glbFile, color)` — inline HTML+JS string generate hota hai
2. WebView renders Three.js scene with GLTFLoader
3. GLB file load: `file:///android_asset/avatars/<name>.glb`
4. If GLB missing/invalid → procedural sphere avatar (fallback)
5. Emotion + speaking state: `webViewRef.postMessage(JSON.stringify({type, value}))`

### Removed packages (no longer needed)
- `expo-gl` — removed
- `expo-asset` — removed
- `three` (npm) — removed (CDN se load hota hai WebView mein)
- `@types/three` — removed

### Added package
- `react-native-webview@^13.10.2`

### Supported emotions with animations
`happy`, `sad`, `angry`, `excited`, `thinking`, `love`, `anxious`, `neutral`

### Avatar change
When user changes avatar (after rewarded ad), WebView `key` prop change hota hai
→ WebView auto re-renders with new GLB + accent color.

---

## 🔧 V3 — QR / OCR / AR Made Real (Not Just Buttons)

### Problem found
V2 had buttons for QR Scan, OCR, and AR in ToolsScreen — but they were honest placeholders:
- QR Scan: launched scanner, never received the result back
- OCR: opened camera, never ran text recognition
- AR: button redirected the user to the Home screen (misleading)
- Sensor data: accelerometer/gyro/magnetometer/proximity/light all hardcoded to `0.0`

### What's now real

**QR Code Scanner**
- `MainActivity.onActivityResult()` now forwards results to `AppIntentsModule`
- `scanQRCode()` resolves with the **actual decoded QR text/URL**
- Falls back to prompting Play Store install if no scanner app found

**OCR (Text Recognition)**
- Camera capture now uses `FileProvider` (`file_paths.xml` + manifest `<provider>`) for a real full-resolution photo file
- `com.google.mlkit:text-recognition:16.0.0` added to `build.gradle`
- `captureAndRecognizeText()` resolves with the **actual recognized text** from the photo (on-device ML Kit, no network call)

**AR Overlay**
- Removed the misleading "send to Home screen" behavior
- Marked **"AR Overlay (Coming Soon)"** and disabled in the UI — honest instead of fake-functional
- Real ARCore implementation is out of scope for this version

**Sensors**
- `getSensorData()` now registers real `SensorEventListener`s and returns actual live values
- 1.5s safety timeout so promise still resolves if a sensor (e.g. proximity) doesn't fire

### Files changed
- `android/app/src/main/java/com/manu/ai/MainActivity.kt` — added `onActivityResult` forwarding
- `android/app/src/main/java/com/manu/ai/AppIntentsModule.kt` — real QR/OCR/sensor logic + companion object
- `android/app/build.gradle` — added ML Kit + core-ktx dependencies
- `android/app/src/main/AndroidManifest.xml` — added FileProvider
- `android/app/src/main/res/xml/file_paths.xml` — new file
- `src/services/qr.ts`, `src/services/ocr.ts` — return real data instead of fire-and-forget
- `src/screens/ToolsScreen.tsx` — shows real decoded/recognized results, AR button disabled
