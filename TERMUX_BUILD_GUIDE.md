# MANU AI - Termux Manual Build Guide

## Quick Start (One Command)
```bash
bash termux-build.sh
```

## Manual Step-by-Step Build

### 1. Install Termux
- Download from F-Droid (recommended) or GitHub releases
- NOT from Play Store (outdated)

### 2. Setup Termux
```bash
termux-setup-storage
pkg update && pkg upgrade -y
```

### 3. Install Dependencies
```bash
pkg install -y openjdk-21 gradle git nodejs yarn wget unzip aapt2 apksigner android-tools
```

### 4. Setup Android SDK
```bash
mkdir -p ~/android-sdk
cd ~/android-sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-12266719_latest.zip
unzip commandlinetools-linux-12266719_latest.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true
rm -f *.zip

export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Add to .bashrc for persistence
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

# Accept licenses and install SDK
yes | sdkmanager --licenses
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

### 5. Extract Project
```bash
cd ~
# Copy manu-ai.zip to Termux (via file manager or wget)
unzip manu-ai.zip -d $HOME/
cd manu-ai
```

### 6. Install Node Dependencies
```bash
yarn install --no-immutable
# OR if yarn fails:
npm install
```

### 7. Fix Node Modules for Termux
```bash
# Fix all build.gradle files in node_modules
find node_modules -name "build.gradle" -exec sed -i 's/JavaVersion.VERSION_1_8/JavaVersion.VERSION_17/g' {} \;
find node_modules -name "build.gradle" -exec sed -i 's/jvmTarget = "1.8"/jvmTarget = "17"/g' {} \;

# Fix aapt2 path
mkdir -p ~/.gradle
echo "android.aapt2FromMavenOverride=/data/data/com.termux/files/usr/bin/aapt2" > ~/.gradle/gradle.properties
```

### 8. Configure Project
```bash
cd android

# Create local.properties
echo "sdk.dir=$ANDROID_HOME" > local.properties

# Disable daemon (saves memory)
echo "org.gradle.daemon=false" >> gradle.properties
echo "org.gradle.jvmargs=-Xmx1024m" >> gradle.properties

chmod +x gradlew
```

### 9. Build APK
```bash
# Debug build (faster)
./gradlew assembleDebug --no-daemon

# Release build (requires signing)
./gradlew assembleRelease --no-daemon
```

### 10. Install APK
```bash
# Method 1: Via ADB (if connected)
adb install app/build/outputs/apk/debug/app-debug.apk

# Method 2: Copy to storage and install manually
cp app/build/outputs/apk/debug/app-debug.apk ~/storage/downloads/
# Then open file manager and tap the APK

# Method 3: Direct install
termux-open app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Out of Memory Error
```bash
# Increase swap
pkg install swapspace
# Or limit Gradle memory:
echo "org.gradle.jvmargs=-Xmx512m" >> android/gradle.properties
```

### AAPT2 Error
```bash
# Install Termux aapt2
pkg install aapt2
# Set override in ~/.gradle/gradle.properties:
echo "android.aapt2FromMavenOverride=/data/data/com.termux/files/usr/bin/aapt2" >> ~/.gradle/gradle.properties
```

### Gradle Daemon Issues
```bash
./gradlew --stop
# Or disable permanently:
echo "org.gradle.daemon=false" >> android/gradle.properties
```

### Java Version Issues
```bash
# Check Java version
java -version  # Should show OpenJDK 21
# If wrong, set JAVA_HOME:
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

### Build Too Slow
- Use `./gradlew assembleDebug` instead of release
- Disable daemon: `org.gradle.daemon=false`
- Limit memory: `org.gradle.jvmargs=-Xmx512m`
- Build on device with 4GB+ RAM for best results

## Post-Build Setup

1. Open MANU AI app
2. Go to Settings (top right)
3. Enter your OpenAI API key
4. Set your name and assistant name
5. Choose language (Hindi/English)
6. Enroll voice fingerprint (optional)
7. Start chatting!

## Voice Commands Examples
- "Open WhatsApp" - Opens WhatsApp
- "Call Rahul" - Dials contact
- "Flashlight on" - Turns on flashlight
- "Volume 50" - Sets volume to 50%
- "Open YouTube search funny videos" - Searches YouTube

## Features Available
- AI Chat with GPT-4o-mini
- Voice control (Hindi + English)
- 3D Avatar with emotions
- Ethical hacking tools
- WiFi/Bluetooth scanner
- File manager
- Notification capture
- Task scheduler
- And 20+ more features!
