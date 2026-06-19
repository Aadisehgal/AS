#!/data/data/com.termux/files/usr/bin/bash

# ============================================================
# MANU AI - Termux Build Script
# Complete on-device Android APK build without Android Studio
# ============================================================

set -e

echo "========================================"
echo "  MANU AI - Termux Build Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "[1/10] Checking prerequisites..."

if ! command -v pkg &> /dev/null; then
    echo -e "${RED}Error: Termux package manager not found. Are you in Termux?${NC}"
    exit 1
fi

# Step 2: Update packages
echo "[2/10] Updating Termux packages..."
pkg update -y
pkg upgrade -y

# Step 3: Install required packages
echo "[3/10] Installing build dependencies..."
pkg install -y     openjdk-21     gradle     git     nodejs     yarn     wget     unzip     aapt2     apksigner     android-tools     libxml2     libxslt

# Step 4: Setup Android SDK
echo "[4/10] Setting up Android SDK..."

ANDROID_SDK_DIR="$HOME/android-sdk"
mkdir -p "$ANDROID_SDK_DIR"

# Download command line tools if not present
if [ ! -d "$ANDROID_SDK_DIR/cmdline-tools" ]; then
    echo "Downloading Android SDK command line tools..."
    cd "$ANDROID_SDK_DIR"
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-12266719_latest.zip
    unzip -q commandlinetools-linux-12266719_latest.zip
    mkdir -p cmdline-tools/latest
    mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true
    rm -f commandlinetools-linux-12266719_latest.zip
fi

# Set environment variables
export ANDROID_HOME="$ANDROID_SDK_DIR"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

# Add to bashrc for persistence
if ! grep -q "ANDROID_HOME" "$HOME/.bashrc"; then
    echo "export ANDROID_HOME=$ANDROID_SDK_DIR" >> "$HOME/.bashrc"
    echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> "$HOME/.bashrc"
    echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> "$HOME/.bashrc"
fi

# Accept licenses
yes | sdkmanager --licenses > /dev/null 2>&1 || true

# Install required SDK components
echo "Installing SDK platforms and build tools..."
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" "extras;android;m2repository" > /dev/null 2>&1 || true

# Step 5: Setup project directory
echo "[5/10] Setting up project..."

PROJECT_DIR="$HOME/manu-ai"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Project directory exists. Updating...${NC}"
    cd "$PROJECT_DIR"
    git pull origin main 2>/dev/null || echo "No git remote configured"
else
    echo "Creating project directory..."
    mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Step 6: Install Node.js dependencies
echo "[6/10] Installing Node.js dependencies..."

if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please extract the MANU AI project first.${NC}"
    echo "Run: unzip manu-ai.zip -d $HOME/"
    exit 1
fi

# Install dependencies with yarn (faster than npm)
yarn install --no-immutable || npm install

# Step 7: Fix node_modules build issues for Termux
echo "[7/10] Fixing node_modules for Termux compatibility..."

# Fix react-native-background-timer
if [ -d "node_modules/react-native-background-timer" ]; then
    echo "Patching react-native-background-timer..."
    cd node_modules/react-native-background-timer/android
    if [ -f "build.gradle" ]; then
        # Add namespace if missing
        if ! grep -q "namespace" build.gradle; then
            sed -i '1s/^/android {\n    namespace "com.ocetnik.timer"\n}\n/' build.gradle
        fi
        # Fix buildConfig
        if ! grep -q "buildConfig" build.gradle; then
            sed -i '/android {/a\    buildFeatures { buildConfig true }' build.gradle
        fi
    fi
    cd "$PROJECT_DIR"
fi

# Fix react-native-share
if [ -d "node_modules/react-native-share" ]; then
    echo "Patching react-native-share..."
    cd node_modules/react-native-share/android
    if [ -f "build.gradle" ]; then
        if ! grep -q "buildConfig" build.gradle; then
            sed -i '/android {/a\    buildFeatures { buildConfig true }' build.gradle
        fi
    fi
    cd "$PROJECT_DIR"
fi

# Fix all node_modules build.gradle files
find node_modules -name "build.gradle" -type f | while read file; do
    # Add namespace if missing
    if ! grep -q "namespace" "$file"; then
        pkg_name=$(grep -o 'package="[^"]*"' android/app/src/main/AndroidManifest.xml 2>/dev/null | head -1 | sed 's/package="//;s/"//')
        if [ -n "$pkg_name" ]; then
            sed -i "1s/^/android {\n    namespace \"$pkg_name\"\n}\n/" "$file" 2>/dev/null || true
        fi
    fi

    # Fix buildConfig
    if grep -q "buildConfigField\|resValue" "$file" 2>/dev/null; then
        if ! grep -q "buildFeatures" "$file"; then
            sed -i '/android {/a\    buildFeatures { buildConfig true }' "$file" 2>/dev/null || true
        fi
    fi

    # Fix Java version
    sed -i 's/JavaVersion.VERSION_1_8/JavaVersion.VERSION_17/g' "$file" 2>/dev/null || true
    sed -i 's/JavaVersion.VERSION_11/JavaVersion.VERSION_17/g' "$file" 2>/dev/null || true
    sed -i 's/jvmTarget = "1.8"/jvmTarget = "17"/g' "$file" 2>/dev/null || true
    sed -i 's/jvmTarget = "11"/jvmTarget = "17"/g' "$file" 2>/dev/null || true
done

# Step 8: Configure Gradle for Termux
echo "[8/10] Configuring Gradle for Termux..."

# Create local.properties
cat > android/local.properties << EOF
sdk.dir=$ANDROID_HOME
EOF

# Fix gradle.properties for Termux
if ! grep -q "org.gradle.daemon" android/gradle.properties; then
    echo "org.gradle.daemon=false" >> android/gradle.properties
fi

if ! grep -q "org.gradle.jvmargs" android/gradle.properties; then
    echo "org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=512m" >> android/gradle.properties
fi

# Fix aapt2 path for Termux
if [ -f "$HOME/.gradle/gradle.properties" ]; then
    if ! grep -q "android.aapt2FromMavenOverride" "$HOME/.gradle/gradle.properties"; then
        echo "android.aapt2FromMavenOverride=/data/data/com.termux/files/usr/bin/aapt2" >> "$HOME/.gradle/gradle.properties"
    fi
else
    mkdir -p "$HOME/.gradle"
    echo "android.aapt2FromMavenOverride=/data/data/com.termux/files/usr/bin/aapt2" > "$HOME/.gradle/gradle.properties"
fi

# Step 9: Build the APK
echo "[9/10] Building APK..."
echo -e "${YELLOW}This may take 10-30 minutes depending on your device...${NC}"

cd android

# Make gradlew executable
chmod +x gradlew

# Clean previous builds
./gradlew clean

# Build debug APK (faster than release)
./gradlew assembleDebug --no-daemon --stacktrace

# Check if build succeeded
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo -e "${GREEN}✓ Debug APK built successfully!${NC}"
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
else
    echo -e "${RED}✗ Debug build failed. Trying release build...${NC}"
    ./gradlew assembleRelease --no-daemon --stacktrace
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
fi

cd "$PROJECT_DIR"

# Step 10: Install APK
echo "[10/10] Installing APK..."

if [ -f "android/$APK_PATH" ]; then
    # Copy to storage for easy access
    cp "android/$APK_PATH" "$HOME/storage/downloads/manu-ai.apk"

    # Install via adb if available
    if command -v adb &> /dev/null; then
        echo "Installing via ADB..."
        adb install "android/$APK_PATH" || echo -e "${YELLOW}ADB install failed. Install manually from Downloads.${NC}"
    else
        echo -e "${GREEN}APK copied to Downloads folder.${NC}"
        echo "Install manually: ~/storage/downloads/manu-ai.apk"
    fi

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Build Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo "APK Location: android/$APK_PATH"
    echo "Downloads: ~/storage/downloads/manu-ai.apk"
else
    echo -e "${RED}Build failed. Check error logs above.${NC}"
    exit 1
fi

echo ""
echo "To run the app:"
echo "  adb shell am start -n com.manu.ai/.MainActivity"
echo ""
echo "To view logs:"
echo "  adb logcat | grep ReactNative"
