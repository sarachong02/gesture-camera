---
name: project-design-system
description: Ocean Design System applied to the gesture camera prototype — tokens, typography, glass UI, and screen-by-screen theming decisions
metadata:
  type: project
---

The prototype uses the **Ocean Design System** (design-system.md). The full design system pass was applied 2026-05-27.

**Why:** Prototype was in a dark (#0a0a0a) monochrome theme; design system uses sand/teal/white palette with iOS-style frosted glass.

**How to apply:** When adding new screens or components, follow the zone rule below.

## Zone rule
- **Non-camera screens** (Start, Phone, Tutorial layout, CameraGate layout, ThankYou): `bg-sand` (#F5EDDE), teal text (`text-primary`), Gilda Display headings (`font-display`).
- **Camera-based screens** (FilterScreen, CameraScreen, CaptureScreen, viewport areas in Tutorial/Gate): keep `bg-black` for the video feed; apply ocean glass (`glass`, `glass-dark`, `glass-card-teal`) to overlay elements only.

## Key tokens in tailwind.config.js
- `primary` = #1A657B, `primary-light` = #B5D7C5, `primary-dark` = #134E5E, `sand` = #F5EDDE
- `font-display` = Gilda Display (loaded from Google Fonts in index.css)
- `rounded-pill` = 999px

## CSS utility classes in index.css
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost` — iOS-style glass buttons
- `.glass` — teal-tinted glass (rgba(26,101,123,0.22), blur 16px) — camera overlays/labels
- `.glass-dark` — dark teal glass (rgba(19,78,94,0.62), blur 20px) — high-contrast camera overlays
- `.glass-card` — light frosted card (white/28%, blur 28px) — panels on sand bg
- `.glass-card-teal` — teal frosted card — tutorial feedback badge, etc.

## Peace sign arc color
Changed from `#4ade80` (green) to `#B5D7C5` (primary-light seafoam) in CameraScreen.
