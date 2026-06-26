# CampusCart Mobile Download Page - Architecture

## URL Structure

```
/downloads                    - Main download page
  ├── Detects Android device
  ├── Shows Android (highlighted)
  ├── Shows iOS (Coming Soon)
  └── Links back to home
```

## Page Components

### Hero Section
- Title: "Get CampusCart"
- Subtitle: "Download our mobile app..."

### Android Card (Responsive)
- Android logo
- "Android v0.1.0"
- Status note about development
- CTA: "View Available Builds on Expo EAS"
- Developer: Instructions for local builds

### iOS Card (Placeholder)
- Apple logo
- "iOS - Coming Soon"
- Placeholder for future releases

### Features Section (3-column grid)
1. **📱 Mobile First** - Browse from anywhere
2. **🔒 Student Verified** - Buy with confidence
3. **⚡ Instant Transactions** - Real-time messaging

### Footer
- Back to Home link

## Header Navigation (Updated)

### Desktop
```
CampusCart Logo | Search Bar | Browse | Mobile App | About | Sign In | Sell Item
```

### Mobile
```
Menu
├── Search
├── Browse
├── Mobile App          ← NEW
├── About
├── Sign In
└── Sell Item
```

## Responsive Design

- **Mobile** (<768px): Stacked layout, full-width cards
- **Desktop** (≥768px): 3-column features grid, inline nav

## Dark Mode Support

- All elements respond to `dark:` Tailwind classes
- Inherits theme from app root
- Automatically switches with system preference

## Integration Points

### 1. Navigation
File: `src/components/HeaderClient.tsx`
- Added link to `/downloads`
- Both desktop and mobile menu

### 2. Download Page
File: `src/app/downloads/page.tsx`
- React Client Component ('use client')
- Auto-detects Android user agent
- Responsive design
- Dark mode ready

### 3. Build Configuration
File: `mobile/eas.json`
- Preview profile (APK build)
- Production profile (AAB for Play Store)

## User Flow Diagram

```
User visits website
        ↓
    [Desktop]          [Mobile - Android]        [Mobile - iOS]
        ↓                      ↓                        ↓
   Click "Mobile App"   Auto-detects Android    Shows iOS placeholder
        ↓                      ↓                        ↓
  Opens /downloads     Android card highlighted  Can still view EAS
        ↓                      ↓                        ↓
  Can see all options   Prominent CTA button    All options visible
        ↓                      ↓
  Choose platform       Easy 1-click download
        ↓                      ↓
  [Expo EAS]    or    [Direct if APK uploaded]
        ⬇
   Download APK
        ↓
   Install on device
```

## Content Updates Needed

After first APK build, update:

1. **Update version in mobile/package.json**
   ```json
   "version": "0.2.0"
   ```

2. **Optional: Host APK directly**
   ```
   public/downloads/campuscart-v0.2.0.apk
   ```

3. **Update downloads page button (if self-hosting)**
   ```typescript
   href="/downloads/campuscart-v0.2.0.apk"
   ```

## Environment Detection

Page uses user agent detection:
```typescript
const userAgent = navigator.userAgent.toLowerCase();
const isAndroid = /android/.test(userAgent);
```

Styling changes:
- Android: Full highlight, primary color button
- Non-Android: Standard button, secondary styling

## Future Enhancements

1. **Version History** - Show old versions
2. **Update Notifications** - Prompt for app updates
3. **Analytics** - Track download count per platform
4. **Platform Detection** - Serve correct download automatically
5. **Installation Guide** - Step-by-step for first install
6. **Changelog** - What's new in each version

## Files Structure

```
/home/shaun/campus-cart/
├── src/
│   ├── app/
│   │   └── downloads/
│   │       └── page.tsx          ← NEW download page
│   └── components/
│       └── HeaderClient.tsx       ← MODIFIED (added link)
├── mobile/
│   ├── eas.json                  ← Build config
│   └── package.json              ← Version source
├── public/downloads/             ← APK hosting (when ready)
│   └── campuscart-v0.1.0.apk     ← After first build
├── ANDROID_BUILD_GUIDE.md        ← NEW detailed guide
├── MOBILE_DOWNLOAD_INTEGRATION.md ← NEW summary
├── QUICK_START_APK.md            ← NEW quick start
└── README.md
```

---

**Current Status:** ✅ Download page live and ready. Awaiting first APK build to activate direct download link.
