# CampusCart Android APK Build Guide

This document describes how to build the CampusCart Android APK for distribution.

## Overview

The CampusCart mobile app is built with React Native and Expo. There are two primary ways to generate an Android APK:

1. **Expo EAS Cloud Build** (Recommended) - No local setup required
2. **Local Gradle Build** - Requires Android SDK and toolchain

## Option 1: Expo EAS Cloud Build (Recommended)

### Prerequisites
- Expo account at https://expo.dev
- EAS CLI installed: `npm install -g eas-cli`

### Steps

1. **Authenticate with Expo:**
   ```bash
   cd mobile
   eas login
   ```

2. **Build the APK:**
   ```bash
   eas build --platform android
   ```

3. **Wait for build completion:**
   - The build will run on Expo's servers
   - You'll receive a link to download the APK
   - Typical build time: 10-15 minutes

4. **Download the APK:**
   - Visit the provided download link
   - The APK will be ready for distribution

### Build Profiles

The project includes two build profiles in `mobile/eas.json`:

- **preview** - Builds as APK (good for testing on devices)
- **production** - Builds as aab (for Google Play Store)

To build preview:
```bash
eas build --platform android --profile preview
```

## Option 2: Local Gradle Build

### Prerequisites

- **Java 17 JDK**: `sudo apt-get install openjdk-17-jdk`
- **Android SDK** (35GB+):
  - Install via Android Studio, or
  - Use cmdline-tools: `sudo apt-get install android-sdk-cmdline-tools-latest`
- **Environment Variables:**
  ```bash
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
  export ANDROID_HOME=/path/to/android-sdk
  export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
  ```

### Steps

1. **Install Android SDK components:**
   ```bash
   cd mobile/android
   sdkmanager "platforms;android-35" "platforms;android-24" "build-tools;35.0.0"
   ```

2. **Generate the APK:**
   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   ```

3. **Locate the APK:**
   ```bash
   # APK will be at:
   mobile/android/app/build/outputs/apk/release/app-release.apk
   ```

### Troubleshooting

**Issue:** `SDK location not found`
- **Solution:** Set `ANDROID_HOME` environment variable to your Android SDK directory

**Issue:** `Gradle daemon exited unexpectedly`
- **Solution:** Clear gradle cache: `./gradlew --stop && rm -rf ~/.gradle/caches`

**Issue:** Memory errors during build
- **Solution:** Increase gradle heap: `export GRADLE_OPTS="-Xmx2048m"`

## Web Integration

Once the APK is built, it can be distributed through:

1. **CampusCart Downloads Page** (`/downloads`)
   - Link: https://campuscart.com/downloads
   - Android users see a prominent download button
   - Contains build status and Expo EAS link

2. **Direct Download**
   - Host the APK file in `public/downloads/app.apk`
   - Users can download directly

3. **External Services**
   - GitHub Releases
   - Firebase App Distribution
   - Google Play Store

## Version Management

- Mobile app version is defined in `mobile/package.json`
- Web downloads page displays this version
- Update the version in package.json before each release
- Use semantic versioning (e.g., 0.1.0, 0.2.0, 1.0.0)

## Distribution

The downloads page (`src/app/downloads/page.tsx`) will automatically:

1. Detect if the user is on an Android device
2. Display the Android download button prominently
3. Show iOS as "Coming Soon"
4. Link to Expo EAS for latest builds
5. Provide developer instructions for local builds

## Current Status

- ✅ Mobile app developed with dark mode support
- ✅ Downloads page created at `/downloads`
- ✅ Header navigation links added
- ⏳ APK build pipeline ready (awaiting first build)
- ⏳ APK hosting infrastructure pending

## Next Steps

1. Set up Expo EAS and build the first APK
2. Test APK on Android devices
3. Host APK in public folder or external service
4. Update downloads page with direct download link
5. Promote through university channels

## Questions?

Contact the development team for questions about the build process or distribution setup.
