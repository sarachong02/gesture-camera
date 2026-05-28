# Ocean Design System
> Feed this file into Claude Code to match your prototype to your design system.

---

## 1. Color Palette

```css
:root {
  /* Primary */
  --color-primary:        #1A657B;   /* Deep ocean teal — buttons, links, key UI */
  --color-primary-light:  #B5D7C5;   /* Seafoam mint — secondary surfaces, highlights */

  /* Neutrals */
  --color-white:          #FFFFFF;   /* Pure white — cards, text on dark */
  --color-sand:           #F5EDDE;   /* Warm sand — page backgrounds, empty states */

  /* Extended Palette (derived) */
  --color-primary-dark:   #134E5E;   /* Deeper teal — hover states, pressed buttons */
  --color-primary-xlight: #D6EBE4;   /* Very light teal — subtle tints */
  --color-overlay:        rgba(26, 101, 123, 0.18);  /* Glass tint for overlays */
  --color-overlay-dark:   rgba(19, 78, 94, 0.55);   /* Darker glass — modals, backdrops */

  /* Semantic */
  --color-text-primary:   #1A657B;   /* Headings on light backgrounds */
  --color-text-body:      #1A4A56;   /* Body copy — slightly darker for readability */
  --color-text-inverse:   #FFFFFF;   /* Text on dark/teal surfaces */
  --color-text-muted:     rgba(26, 101, 123, 0.55);  /* Placeholders, captions */

  /* Backgrounds */
  --color-bg-base:        #F5EDDE;   /* Default page background */
  --color-bg-card:        #FFFFFF;   /* Card / panel background */
  --color-bg-subtle:      #B5D7C5;   /* Subtle section bg */
}
```

---

## 2. Typography

```css
/* Import fonts in your <head> or global CSS */
@import url('https://fonts.googleapis.com/css2?family=Gilda+Display&family=Inter:wght@400;600&display=swap');

:root {
  /* Font Families */
  --font-display: 'Gilda Display', Georgia, serif;
  --font-body:    'Inter', system-ui, sans-serif;

  /* Scale */
  --text-title:      100px;   /* Gilda Display, Regular (400) */
  --text-body-large:  40px;   /* Inter, Semibold (600) */
  --text-body:        24px;   /* Inter, Regular (400) */

  /* Line Heights */
  --leading-title:      1.05;
  --leading-body-large: 1.3;
  --leading-body:       1.6;

  /* Letter Spacing */
  --tracking-title:      -0.02em;
  --tracking-body-large:  0em;
  --tracking-body:        0.01em;
}

/* Utility classes */
.text-title {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--text-title);
  line-height: var(--leading-title);
  letter-spacing: var(--tracking-title);
  color: var(--color-text-primary);
}

.text-body-large {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--text-body-large);
  line-height: var(--leading-body-large);
  color: var(--color-text-body);
}

.text-body {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: var(--text-body);
  line-height: var(--leading-body);
  letter-spacing: var(--tracking-body);
  color: var(--color-text-body);
}
```

---

## 3. Glass UI — Buttons & Surfaces

Inspired by iOS frosted glass (UIVisualEffectView). Use `backdrop-filter: blur` + semi-transparent backgrounds.

```css
:root {
  /* Glass tokens */
  --glass-blur:           16px;
  --glass-blur-heavy:     28px;
  --glass-bg-light:       rgba(255, 255, 255, 0.25);
  --glass-bg-teal:        rgba(26, 101, 123, 0.22);
  --glass-border:         rgba(255, 255, 255, 0.45);
  --glass-border-teal:    rgba(26, 101, 123, 0.30);
  --glass-shadow:         0 8px 32px rgba(26, 101, 123, 0.18);
  --glass-shadow-heavy:   0 16px 48px rgba(26, 101, 123, 0.28);

  /* Border radius */
  --radius-sm:   10px;
  --radius-md:   16px;
  --radius-lg:   24px;
  --radius-xl:   32px;
  --radius-pill: 999px;
}

/* ── Primary Glass Button ─────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 18px;
  letter-spacing: 0.01em;
  border-radius: var(--radius-pill);
  border: 1px solid var(--glass-border-teal);
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
  text-decoration: none;
}

/* Primary — teal glass */
.btn-primary {
  background: var(--glass-bg-teal);
  color: var(--color-text-inverse);
  border-color: var(--glass-border-teal);
  box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.2);
  padding: 14px 32px;
}
.btn-primary:hover {
  background: rgba(26, 101, 123, 0.38);
  box-shadow: var(--glass-shadow-heavy);
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0);
  background: rgba(26, 101, 123, 0.50);
}

/* Secondary — white glass */
.btn-secondary {
  background: var(--glass-bg-light);
  color: var(--color-primary);
  border-color: var(--glass-border);
  box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.4);
  padding: 14px 32px;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.40);
  box-shadow: var(--glass-shadow-heavy);
  transform: translateY(-1px);
}

/* Ghost / Outline */
.btn-ghost {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
  padding: 14px 32px;
}
.btn-ghost:hover {
  background: rgba(26, 101, 123, 0.08);
}

/* Icon-only (circular) */
.btn-icon {
  padding: 12px;
  border-radius: 50%;
  background: var(--glass-bg-light);
  border-color: var(--glass-border);
}
```

---

## 4. Glass Card / Surface

```css
.glass-card {
  background: var(--glass-bg-light);
  -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  backdrop-filter: blur(var(--glass-blur-heavy));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow-heavy);
  padding: 32px;
}

.glass-card-teal {
  background: var(--glass-bg-teal);
  border-color: var(--glass-border-teal);
}

/* Weather widget style (from prototype) */
.glass-widget {
  background: rgba(255, 255, 255, 0.18);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: var(--radius-xl);
  box-shadow: 0 12px 40px rgba(26, 101, 123, 0.22);
}
```

---

## 5. Spacing & Layout

```css
:root {
  --space-1:   4px;
  --space-2:   8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;
  --space-9:  96px;
  --space-10: 128px;
}
```

---

## 6. Iconography

- Style: **outlined**, thin stroke (~1.5px), rounded line caps
- Size tokens: `16px` (inline), `24px` (default), `32px` (feature), `48px` (hero)
- Color: inherits from parent or `var(--color-primary)`
- Recommended libraries: [Phosphor Icons](https://phosphoricons.com/) (`regular` weight) or [Lucide](https://lucide.dev/)

---

## 7. Motion

```css
:root {
  --ease-out:   cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* iOS spring-like */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  --duration-fast:   150ms;
  --duration-normal: 280ms;
  --duration-slow:   500ms;
}

/* Standard entrance */
.animate-enter {
  animation: fadeSlideUp var(--duration-normal) var(--ease-out) both;
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 8. Tailwind Config (if using Tailwind)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary:       '#1A657B',
        'primary-light': '#B5D7C5',
        sand:          '#F5EDDE',
        ocean: {
          50:  '#D6EBE4',
          100: '#B5D7C5',
          500: '#1A657B',
          700: '#134E5E',
          900: '#0C3340',
        },
      },
      fontFamily: {
        display: ['Gilda Display', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        title:      ['100px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '400' }],
        'body-lg':  ['40px',  { lineHeight: '1.3',  fontWeight: '600' }],
        body:       ['24px',  { lineHeight: '1.6',  letterSpacing: '0.01em' }],
      },
      borderRadius: {
        sm:   '10px',
        md:   '16px',
        lg:   '24px',
        xl:   '32px',
        pill: '999px',
      },
      backdropBlur: {
        glass: '16px',
        'glass-heavy': '28px',
      },
      boxShadow: {
        glass:       '0 8px 32px rgba(26, 101, 123, 0.18)',
        'glass-heavy': '0 16px 48px rgba(26, 101, 123, 0.28)',
      },
    },
  },
}
```

---

## 9. Quick-Reference Prompt for Claude Code

Paste this into any Claude Code session alongside your file:

```
Design system in use: Ocean Theme
- Primary: #1A657B | Light: #B5D7C5 | Sand: #F5EDDE | White: #FFFFFF
- Title: Gilda Display, 400, 100px | Body Large: Inter, 600, 40px | Body: Inter, 400, 24px
- Buttons: iOS-style glass UI — backdrop-filter blur(16px), semi-transparent teal or white bg, 1px glass border, pill radius, spring transition
- Cards: glass-card class — blur(28px), white/teal semi-transparent bg, rounded-xl, teal box-shadow
- Spacing scale: 4/8/12/16/24/32/48/64/96/128px
- Motion: ease-out cubic-bezier(0.22,1,0.36,1), 280ms default
- Icons: Phosphor Icons, regular/outlined weight
- Theme vibe: ocean, coastal, iOS-inspired frosted glass
```

---

*Ocean Design System v1.0 — generated from prototype screenshots*
