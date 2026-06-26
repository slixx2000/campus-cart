# Quick Start: Build & Deploy APK

## 5-Minute Setup (Expo EAS - Recommended)

```bash
# 1. Install Expo CLI globally
npm install -g eas-cli

# 2. Navigate to mobile directory
cd /home/shaun/campus-cart/mobile

# 3. Login to Expo (creates account if needed)
eas login

# 4. Build APK
eas build --platform android --profile preview

# 5. Wait for build completion (~10-15 min)
# You'll get a download link

# 6. Download and test APK on Android device
```

## Verify Download Page Works

The web app now has a downloads page:

```bash
# In browser, navigate to:
localhost:3000/downloads  # (or your deployed URL)

# On Android device, it will show:
# - Android section highlighted
# - Button linking to Expo EAS builds
# - iOS "Coming Soon"
```

## Once You Have an APK

To make it downloadable directly from the web:

```bash
# 1. Place APK in public folder
cp ~/Downloads/campuscart-v0.1.0.apk /home/shaun/campus-cart/public/downloads/

# 2. Update downloads page src/app/downloads/page.tsx
# Change the Expo link to:
<a href="/downloads/campuscart-v0.1.0.apk" download>
  Download CampusCart for Android
</a>

# 3. Rebuild web app (if needed)
npm run build
```

## Files Ready Now

✅ **src/app/downloads/page.tsx** - Download landing page (ready)
✅ **src/components/HeaderClient.tsx** - Navigation added (ready)
✅ **ANDROID_BUILD_GUIDE.md** - Complete build documentation (ready)
✅ **mobile/eas.json** - EAS configuration (ready)

## Mobile App Status

✅ Dark mode implemented across all screens
✅ Theme persistence with storage
✅ All TypeScript validation passing
✅ Ready for APK build

## What Users See

**On their browser (desktop):** Link to mobile app → directs to Expo EAS/direct download
**On their Android phone:** Same link → auto-highlights Android download button

---

**Next action:** Run `eas build --platform android` and download your first APK!
