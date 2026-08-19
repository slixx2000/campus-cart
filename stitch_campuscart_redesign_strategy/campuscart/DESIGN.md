---
name: CampusCart
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1280px
---

## Brand & Style
The design system is engineered for a high-discipline, peer-to-peer university marketplace. The aesthetic prioritizes utility and trust, moving away from decorative trends like glassmorphism or organic blobs in favor of a **Startup-grade Minimalism**. 

The brand personality is professional and efficient, reflecting the fast-paced nature of campus life. Visual interest is generated through precise alignment, high-quality imagery, and purposeful typographic scale rather than ornamentation. The interface should feel like a specialized tool—reliable, transparent, and built to facilitate transactions without friction.

## Colors
The palette is rooted in a sophisticated neutral base to ensure product imagery remains the focal point. 

- **Primary:** Deep Slate (#0F172A) is used for core brand elements, heavy text, and primary actions to convey authority.
- **Secondary (Accent):** A vibrant Emerald (#10B981) provides a university-inspired growth signal, used sparingly for success states, price tags, and high-conversion call-to-actions.
- **Neutral:** A range of grays from Slate-50 (#F8FAFC) to Slate-400 (#94A3B8) manages the UI skeleton.
- **Borders:** A consistent, subtle border color (#E2E8F0) is used to define containers without adding visual weight.

## Typography
This design system utilizes **Geist** for its technical precision and monospaced-influenced tracking, which lends a "developer-tool" level of discipline to the marketplace. 

Typographic hierarchy is strict. Large display styles use tight letter spacing and heavy weights to command attention, while body text remains legible with generous line heights. Labels and metadata should use slightly increased tracking and medium weights to ensure clarity at small sizes, particularly for product categories and timestamps.

## Layout & Spacing
The layout follows a rigorous 8px grid system with a 4px baseline for micro-adjustments. 

- **Desktop:** 12-column fluid grid with 16px gutters. Max-width is capped at 1280px to maintain comfortable scanning lines for item listings.
- **Mobile:** 4-column fluid grid with 16px margins. 
- **Philosophy:** Spacing is used to group related information tightly (e.g., price and title) while using larger gaps (24px+) to separate distinct sections or product categories. Avoid "airy" layouts; prioritize information density that allows students to browse quickly.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Subtle Outlines** rather than traditional shadows. 

1.  **Level 0 (Background):** Slate-50 (#F8FAFC) for the main canvas.
2.  **Level 1 (Cards/Containers):** Pure White (#FFFFFF) with a 1px border (#E2E8F0).
3.  **Interaction (Hover):** Transition from a 1px border to a very soft, 4px blur shadow with 5% opacity to indicate interactivity.

This "Flat-Plus" approach maintains the disciplined feel while providing clear feedback. Avoid all gradients and blurs.

## Shapes
The shape language is restrained and architectural. 

- **Standard Radius:** 6px (applied to inputs, small buttons, and tags).
- **Large Radius:** 8px (applied to product cards and modal containers).
- **Pill Shape:** Reserved exclusively for status indicators (e.g., "Available", "Sold") to distinguish them from functional UI components.

Sharp corners (0px) may be used for decorative divider lines or image placeholders to reinforce the "professional" aesthetic.

## Components

### Buttons
- **Primary:** Solid #0F172A background, White text. High-contrast, sharp corners (6px), no gradients.
- **Secondary:** White background, 1px #E2E8F0 border, #0F172A text. 
- **Tertiary/Ghost:** No background or border. #64748B text, shifting to #0F172A on hover.

### Product Cards
Cards should be "image-first." The container has an 8px radius and a subtle 1px border. Product info is nested below the image with 12px padding. The price should be highlighted in #0F172A Bold, while the location/university tag uses #64748B.

### Input Fields
Inputs use a White background with a 1px #E2E8F0 border. On focus, the border shifts to #0F172A with a subtle 2px outer ring of the same color at 10% opacity. Placeholder text is #94A3B8.

### Navigation
- **Desktop:** A sticky top bar with a 1px bottom border. Links are #64748B, moving to #0F172A on active state. Search bars are integrated directly into the nav with a subtle background tint (#F1F5F9).
- **Mobile:** Bottom tab bar for core actions (Home, Search, Sell, Profile) using 24px stroke icons and 10px labels.

### Chips & Tags
Used for categories (e.g., "Textbooks", "Electronics"). Use #F1F5F9 background and #475569 text. No borders on chips.