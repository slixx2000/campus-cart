# Campus Cart Launch Readiness Checklist

**Date**: March 20, 2026
**Target Launch Date**: [To be set]

---

## QUICK SUMMARY OF CHANGES

✅ Removed hardcoded fake metrics (4.8 rating, 12 sales, "Quick Responder")
✅ Standardized trust model messaging across all pages
✅ Added verification status indicator in header
✅ Improved seller info on product page with real signals only
✅ Enhanced sell form with contextual helper text
✅ Added Trust & Safety section to About page
✅ Updated profile verification state messaging
✅ Verified listing deduplication prevents duplicates

---

## PRE-LAUNCH VERIFICATION CHECKLIST

### SECTION 1: PRODUCT PAGE (CRITICAL)

**Location**: `/product/[any-id]`

- [ ] **No Hardcoded Metrics Visible**
  - [ ] ❌ Hardcoded "4.8" rating NOT shown
  - [ ] ❌ Hardcoded "(12 sales)" NOT shown
  - [ ] ❌ "Quick Responder" badge NOT shown
  
- [ ] **Real Seller Signals Visible**
  - [ ] ✅ Seller name displayed
  - [ ] ✅ Verified badge shown if `is_verified_student = true`
  - [ ] ✅ Pioneer badge shown if `is_pioneer_seller = true`
  - [ ] ✅ University name displayed
  - [ ] ✅ Listing date shown ("Listed [date]")
  - [ ] ✅ "View Profile" link present

- [ ] **Mobile Experience**
  - [ ] 📱 Tested on iPhone SE (375px width)
  - [ ] 📱 Tested on Galaxy A14 (375px width)
  - [ ] 📱 Tested on iPad (768px width)
  - [ ] ✅ Seller card properly spaced (no overflow)
  - [ ] ✅ CTA buttons full-width
  - [ ] ✅ Trust signals visible without scrolling seller card

- [ ] **Desktop Experience**
  - [ ] 🖥️ Tested on Chrome (1920px width)
  - [ ] 🖥️ Tested on Safari
  - [ ] ✅ Seller card properly sized
  - [ ] ✅ Layout looks balanced

- [ ] **Dark Mode**
  - [ ] 🌙 Verified badge color correct (emerald)
  - [ ] 🌙 Pioneer badge color correct (amber)
  - [ ] 🌙 Text readable on dark background
  - [ ] 🌙 No color contrast issues

---

### SECTION 2: HEADER & VERIFICATION STATUS (HIGH PRIORITY)

**Location**: All pages (sticky header)

- [ ] **Verification Status Indicator on "Sell Item" Button**
  - [ ] **Verified User**:
    - [ ] 🟢 Green dot visible on button
    - [ ] Hover tooltip: "Verified - Ready to sell"
    - [ ] Button leads to sell form
  - [ ] **Unverified User**:
    - [ ] 🟡 Amber dot visible on button
    - [ ] Hover tooltip: "Not verified - Link student email to sell"
    - [ ] Button still leads to sell page (but shows gate)
  - [ ] **Not Signed In**:
    - [ ] Button shows no status indicator
    - [ ] Button leads to sign-up/sign-in

- [ ] **Mobile Menu Verification Status**
  - [ ] 📱 Tested on mobile breakpoint (<768px)
  - [ ] ✅ Click menu button → opens menu
  - [ ] ✅ "My Profile" link shown
  - [ ] ✅ Verified badge/icon shown next to "My Profile" if verified
  - [ ] ✅ Icon not shown if unverified (clean look)

- [ ] **Desktop Navigation**
  - [ ] 🖥️ "Sell Item" button includes status dot
  - [ ] 🖥️ Dot color correct based on verification status

---

### SECTION 3: PROFILE SETTINGS (CRITICAL)

**Location**: `/profile/settings`

- [ ] **Unverified State**
  - [ ] Icon: 🎓 (school)
  - [ ] Text: "Browsing as a guest. Selling requires verification."
  - [ ] Helper: "Link your university student email below..."
  - [ ] Background: Gray/neutral
  - [ ] Input field: "Link student email" clear and visible

- [ ] **Pending State** (after email submitted but not approved)
  - [ ] Icon: ⏳ (hourglass)
  - [ ] Text: "Email linked. Awaiting verification."
  - [ ] Helper: "Approval typically takes 24 hours..."
  - [ ] Background: Amber/yellow
  - [ ] Shows student email that's pending

- [ ] **Verified State**
  - [ ] Icon: ✅ (verified)
  - [ ] Text: "You're verified! Ready to sell."
  - [ ] Helper: "You can now create listings and sell..."
  - [ ] Background: Green/emerald
  - [ ] Shows verified at date

- [ ] **Mobile Experience**
  - [ ] 📱 All text readable
  - [ ] 📱 Icons properly sized
  - [ ] 📱 Input fields full-width
  - [ ] 📱 No text overflow

---

### SECTION 4: SELL PAGE & FORM (HIGH PRIORITY)

**Location**: `/sell`

- [ ] **Unverified User Gating**
  - [ ] ✅ Shows "You can browse... but selling is for verified students only"
  - [ ] ✅ Clear link to go to profile settings
  - [ ] ✅ CTA button styling looks good
  - [ ] ✅ "Continue browsing" fallback link present

- [ ] **Verified User Form**
  - [ ] ✅ Form displayed without gate
  - [ ] ✅ Progress bar shows (Step 1 of X)

- [ ] **Form Fields Have Helper Text**
  - [ ] **Title field**:
    - [ ] For products: "What are you selling? Include brand/model if possible."
    - [ ] For services: "What service are you offering?"
    - [ ] Placeholder examples still present
  
  - [ ] **Description field**:
    - [ ] For products: "Describe condition, any defects, why you're selling..."
    - [ ] For services: "What's included? How long does it typically take?"
    - [ ] Placeholder still present
  
  - [ ] **Price field**:
    - [ ] Helper text: "Set your price. Check similar listings to stay competitive."
    - [ ] Currency (ZMW) prefix visible

- [ ] **Mobile Form**
  - [ ] 📱 All inputs touch-friendly (tap targets >44px)
  - [ ] 📱 No horizontal scroll
  - [ ] 📱 Helper text readable
  - [ ] 📱 Error messages readable
  - [ ] 📱 Upload successful
  - [ ] 📱 Form submission works

- [ ] **Desktop Form**
  - [ ] 🖥️ Layout looks balanced
  - [ ] 🖥️ Sidebar tips visible
  - [ ] 🖥️ All fields properly labeled

---

### SECTION 5: ABOUT PAGE (MEDIUM PRIORITY)

**Location**: `/about`

- [ ] **Trust & Safety Section Visible**
  - [ ] ✅ Section title: "Trust & Safety"
  - [ ] ✅ Section icon visible
  - [ ] ✅ Section appears between "How it works" and "Stats"

- [ ] **Trust & Safety Content (4 cards)**
  - [ ] **Card 1: "Who Can Browse?"**
    - [ ] Text: "Anyone can browse listings with any email. No verification required..."
    - [ ] Icon: readable and relevant
  
  - [ ] **Card 2: "Who Can Sell?"**
    - [ ] Text: "Only verified students can create listings and sell..."
    - [ ] Icon: readable and relevant
  
  - [ ] **Card 3: "Verification Badges"**
    - [ ] Text: Explains what the verified badge means
    - [ ] Shows verified icon
  
  - [ ] **Card 4: "Safe Transactions"**
    - [ ] Text: Guidance on meeting, messaging, payment safety
    - [ ] Icon: readable and relevant

- [ ] **Styling**
  - [ ] Cards properly spaced
  - [ ] Text readable
  - [ ] Desktop: 2-column grid
  - [ ] Mobile: 1-column stack
  - [ ] Dark mode readable

---

### SECTION 6: HOME FEED - DEDUPLICATION (MEDIUM PRIORITY)

**Location**: `/` (homepage)

- [ ] **Initial Load**
  - [ ] ✅ 3 feed sections load: New Listings, Nearby (if set), Recently Active
  - [ ] ✅ No duplicates visible in any section
  - [ ] ✅ No listing appears in multiple sections

- [ ] **After "Load More"**
  - [ ] ✅ Click "Load More" or scroll to bottom
  - [ ] ✅ Additional listings load
  - [ ] ✅ Still no duplicates
  - [ ] ✅ New listings don't repeat existing ones

- [ ] **Multiple Load More Clicks**
  - [ ] ✅ Click load more 3-4 times
  - [ ] ✅ All listings remain unique
  - [ ] ✅ Feed continues to load

- [ ] **Mobile**
  - [ ] 📱 Deduplication works same as desktop
  - [ ] 📱 No performance issues with loading

---

### SECTION 7: BROWSE PAGE (MEDIUM PRIORITY)

**Location**: `/browse`

- [ ] **Featured Section**
  - [ ] ✅ Shows listings with `featured = true`
  - [ ] ✅ No duplicates

- [ ] **Nearby Section** (if user set university)
  - [ ] ✅ Shows listings from user's university only
  - [ ] ✅ No duplicates
  - [ ] ✅ Section hides if no university set

- [ ] **All Listings Section**
  - [ ] ✅ Shows all listings (featured included)
  - [ ] ✅ No duplicates from Nearby/Featured
  - [ ] ✅ Sorted by latest

- [ ] **Tab Navigation**
  - [ ] ✅ Tabs: Featured | Nearby | All
  - [ ] ✅ Works properly
  - [ ] ✅ Mobile tabs not cut off

---

### SECTION 8: SELLER PROFILE PAGE (LOW PRIORITY)

**Location**: `/profile/[seller-id]`

- [ ] **Profile Header**
  - [ ] ✅ Seller name
  - [ ] ✅ Verified badge if `is_verified_student = true`
  - [ ] ✅ Pioneer badge if applicable
  - [ ] ✅ University displayed

- [ ] **Listings Tab**
  - [ ] ✅ Shows seller's listings
  - [ ] ✅ Each listing shows same trust signals (verified badge at top, not metrics)

---

### SECTION 9: AUTHENTICATION MESSAGING (MEDIUM PRIORITY)

**Location**: `/auth/sign-up`, `/auth/sign-in`

- [ ] **Sign-up Page**
  - [ ] ✅ Heading: "Join CampusCart"
  - [ ] ✅ Subtitle: "Browse with any email. Sell only with a verified student account."

- [ ] **Sign-in Page**
  - [ ] ✅ No changes needed (verify it still works)

---

### SECTION 10: CONSISTENCY CHECK (CRITICAL)

**Cross-page messaging alignment**:

- [ ] **All pages say same thing about browsing**:
  - [ ] ✅ Sign-up: "Browse with any email..."
  - [ ] ✅ Sell gate: "You can browse CampusCart..."
  - [ ] ✅ Profile: "Browsing as a guest..." or "You're verified..."
  - [ ] ✅ About: "Anyone can browse..."

- [ ] **All pages say same thing about selling**:
  - [ ] ✅ Sign-up: "Sell only with verification..."
  - [ ] ✅ Sell gate: "Selling is for verified students..."
  - [ ] ✅ Profile: "Selling requires verification..." or "Ready to sell"
  - [ ] ✅ About: "Only verified students can sell..."

---

## BROWSER & DEVICE TESTING

### Browsers
- [ ] Chrome (Windows/Mac)
- [ ] Safari (Mac/iOS)
- [ ] Firefox (Windows/Mac)
- [ ] Edge (Windows)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Devices
- [ ] Desktop (1920px wide)
- [ ] Tablet (768px - iPad)
- [ ] Small phone (375px - iPhone SE)
- [ ] Large phone (414px - iPhone 12)
- [ ] Extra large (412px - Galaxy A14)

### Viewports
- [ ] 320px (very small phone)
- [ ] 375px (standard phone)
- [ ] 768px (tablet)
- [ ] 1024px (large tablet/small desktop)
- [ ] 1920px (desktop)

---

## PERFORMANCE CHECKLIST

- [ ] **Product page loads** < 2 seconds (mobile)
- [ ] **Product page loads** < 1 second (desktop)  
- [ ] **No CLS (Cumulative Layout Shift)** from fake metrics removal
- [ ] **Header verification indicator** loads instantly
- [ ] **Form helper text** doesn't cause layout jank
- [ ] **Images** still optimized and compressed

---

## ACCESSIBILITY CHECKLIST

- [ ] **Color contrast**: Verified badge (emerald), Pioneer (amber), text all WCAG AA or better
- [ ] **Button sizes**: All CTAs >= 44px (mobile) for WCAG touch target
- [ ] **Keyboard navigation**: Can tab through form fields
- [ ] **Alt text**: Images and badges have descriptive alt text
- [ ] **Icons**: All icons have tooltips or adjacent text
- [ ] **Mobile screen readers**: Tested with VoiceOver (iOS) or TalkBack (Android)

---

## ADMIN/CMS CHECKS

- [ ] **Admin panel**: Verification status badge still shows correctly
- [ ] **Admin approvals**: Can still approve verified students
- [ ] **Database**: No migration required, uses existing columns

---

## SIGN-OFF

**UAT Lead**: _________________________ **Date**: _______

**Product Manager**: _________________________ **Date**: _______

**Engineering Lead**: _________________________ **Date**: _______

**Before Launch**: ⬜ Ready | ⬜ Ready with notes | ⬜ Not ready

**Notes**:
```


```

---

## POST-LAUNCH MONITORING (First 24 Hours)

Track these metrics to ensure launch success:

- [ ] Zero complaints about "fake" ratings or sales counts
- [ ] No increase in support tickets about verification confusion
- [ ] New seller signup completion rate > [target]%
- [ ] Verified student conversion rate > [target]%
- [ ] Product view-to-message CTR unchanged or improved
- [ ] No performance degradation
- [ ] Mobile app doesn't display duplicate listings
- [ ] Header indicator displays correctly for all users

**Monitoring Duration**: First 48 hours post-launch

**Rollback Plan**: If critical issue found, revert [specific file] to previous version

---

## LAUNCH DAY TIMELINE

- [ ] **T-2h**: Final full regression test
- [ ] **T-1h**: Performance check, load test
- [ ] **T-30m**: Final screenshot check vs. VISUAL_CHANGES_GUIDE.md
- [ ] **T-0**: Deploy to production
- [ ] **T+15m**: Smoke tests from multiple regions
- [ ] **T+1h**: Check analytics for anomalies
- [ ] **T+24h**: Full analysis of user behavior

---

## SUCCESS CRITERIA

✅ **MUST BE TRUE** at launch:
1. No fake metrics displayed anywhere
2. Verification status visible without digging
3. Seller info shows only real signals
4. Users understand trust model from messaging
5. Mobile CTAs all proper size and clickable
6. No duplicate listings in feed
7. Form guidance helps first-time sellers

✅ **WILL BE MEASURED** post-launch:
1. New seller comfort level (survey)
2. Verified student conversion rate
3. Product trust signals impact (message rate)
4. Return visitor rate
5. Support tickets about confusion (should decrease)

---

**Prepared by**: Copilot
**Date**: March 20, 2026
**Version**: 1.0
