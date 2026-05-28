/**
 * HOVER SYSTEM DOCUMENTATION
 * 
 * CampusConnect Production-Grade Hover Interaction System
 * 
 * Philosophy: Motion must improve clarity, not distract.
 * All hover interactions are designed to be premium, subtle, responsive, alive, 
 * professional, and production-ready.
 */

# Hover System Architecture

## Overview

The hover system is a comprehensive, production-grade interaction framework that brings the CampusConnect platform to life through subtle, purposeful motion and visual feedback.

**Core Philosophy:**
- ✅ Hover improves clarity and discoverability
- ✅ Hover provides responsive feedback
- ✅ Hover improves emotional engagement
- ✅ Hover respects accessibility (prefers-reduced-motion)
- ❌ No excessive animation or distraction
- ❌ No layout shifts or janky performance

**Design Quality:** Modern startup aesthetic + enterprise polish

## File Structure

```
client/src/
├── design/tokens/
│   ├── hoverTokens.ts              # Core design tokens (durations, easing, shadow elevations)
│   ├── motionUtilities.ts          # CSS-in-JS motion helpers
│   ├── hoverStateUtilities.ts      # React hooks for hover state management
│   ├── interactiveVariants.ts      # CSS class variants for components
│   └── index.ts                    # Central export point
├── styles/
│   └── hover.css                   # Global hover CSS rules (~500 lines)
└── components/
    └── [Card/Button/Nav components updated with hover classes]
```

## Core Hover Levels

### 1. `hover-subtle`
**Purpose:** Minor feedback for low-priority interactions
**Use Cases:** Links, tags, breadcrumbs, secondary nav items
**Behavior:**
- Border color tint
- Slight opacity shift (80ms)
- No transform

**Example:**
```html
<a className="hover-subtle">Link text</a>
```

### 2. `hover-interactive`
**Purpose:** Standard card and control feedback
**Use Cases:** Cards, buttons, table rows, clickable containers
**Behavior:**
- `translateY(-2px)` elevation
- Soft shadow emphasis
- Border color emphasis
- Duration: 180ms

**Example:**
```html
<article className="cc-card cc-event-card">Card content</article>
```

### 3. `hover-emphasis`
**Purpose:** Primary CTA and high-priority elements
**Use Cases:** Primary buttons, featured cards, hero actions
**Behavior:**
- `scale(1.02)` subtle growth
- Elevated shadow
- Brightness shift (+6%)
- Duration: 180ms (emphasized easing)

**Example:**
```html
<button className="cc-btn-primary">Primary Action</button>
```

## Motion Tokens

**Durations:**
- `--cc-hover-duration-fast: 120ms` — Quick feedback (icons, badges)
- `--cc-hover-duration-normal: 180ms` — Standard interactions (cards, buttons)
- `--cc-hover-duration-slow: 240ms` — Emphasis transitions

**Easing Functions:**
- `ease-out` — Standard smooth deceleration
- `cubic-bezier(0.16, 1, 0.3, 1)` — Emphasized "bounce" feel
- `cubic-bezier(0.4, 0, 0.2, 1)` — Gentle deceleration

**Shadow Elevations:**
```css
--cc-shadow-hover-elevation-subtle: 0 2px 8px rgba(0, 79, 159, 0.08);
--cc-shadow-hover-elevation-soft: 0 4px 16px rgba(0, 79, 159, 0.12);
--cc-shadow-hover-elevation-elevated: 0 8px 24px rgba(0, 79, 159, 0.16);
--cc-shadow-hover-elevation-focus: 0 4px 12px rgba(0, 188, 235, 0.15);
```

## Component-Specific Behaviors

### Cards

#### `cc-event-card`
**Applies to:** EventCard component
**On hover:**
- Elevation: `translateY(-2px)`
- Shadow: Soft elevation
- Border: Accent tint
- Metadata: Color emphasis
- Duration: 180ms

**CSS:**
```css
.cc-event-card {
  transition: border-color 180ms ease-out, box-shadow 180ms ease-out, transform 180ms ease-out;
}
.cc-event-card:hover {
  border-color: var(--cc-accent);
  box-shadow: var(--cc-shadow-elevation-soft);
  transform: translateY(-2px);
}
.cc-event-card .cc-event-metadata {
  transition: color 180ms ease-out;
}
.cc-event-card:hover .cc-event-metadata {
  color: var(--cc-accent);
}
```

#### `cc-club-card`
**Applies to:** ClubCard component
**On hover:**
- Elevation: `translateY(-2px)`
- Border: Accent emphasis
- Actions: Fade-in reveal
- Social energy: Subtle scale
- Duration: 180ms

**Features:**
- Action buttons appear smoothly
- Accent border on hover
- Soft shadow elevation

#### `cc-dashboard-card`
**Applies to:** Dashboard stat/info cards
**On hover:**
- Elevation: `translateY(-1px)` (subtle)
- Border: Color tint
- Background: Slight elevation
- Actions: Reveal with opacity transition
- Duration: 180ms

### Buttons

#### `cc-btn-primary`
**Behavior on hover:**
- Elevation: `translateY(-1px)`
- Shadow: Soft
- Brightness: +6% filter
- Duration: 180ms
- **Magnetic effect:** Optional cursor attraction (3px max)

```css
.cc-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--cc-shadow-elevation-soft);
  filter: brightness(1.06);
}
```

#### `cc-btn-secondary`
**Behavior on hover:**
- Border: Emphasis (stronger color)
- Background: Soft surface tint
- No transform
- Duration: 180ms

#### `cc-btn-ghost`
**Behavior on hover:**
- Background: Fade-in (from transparent)
- Text: Emphasis
- No transform
- Duration: 180ms

#### `cc-btn-icon`
**Behavior on hover:**
- Transform: `scale(1.08)`
- Color: Accent tint
- Duration: 120ms (fast)

### Navigation

#### `cc-sidebar-item`
**Behavior:**
- Default: Minimal
- Hover: `background-color: var(--cc-surface-hover)`
- Active: `border-left: 3px solid var(--cc-brand)`
- Active hover: Subtle background elevation
- Duration: 180ms

#### `cc-tab-item`
**Behavior:**
- Underline animation: Scale X from 0 to 1
- Text: Accent color on hover
- Duration: 180ms (emphasized easing)

```css
.cc-tab-item::after {
  content: "";
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.cc-tab-item:hover::after {
  transform: scaleX(1);
}
```

### Tables & Rows

#### `cc-table-row`
**Behavior:**
- Background: Soft hover tint
- Shadow: Inset subtle
- Actions: Fade-in with translate
- No transform
- Duration: 180ms

```css
.cc-table-row:hover {
  background-color: var(--cc-surface-hover);
  box-shadow: inset 0 0 0 1px rgba(248, 249, 250, 0.08);
}
.cc-table-row .cc-row-actions {
  opacity: 0;
  transform: translateX(-4px);
}
.cc-table-row:hover .cc-row-actions {
  opacity: 1;
  transform: translateX(0);
}
```

#### `cc-chat-row`
**Behavior:**
- Background: Soft tint on hover
- Unread emphasis: Border animation
- Duration: 180ms

### Forms

#### `cc-input`
**Hover behavior:**
- Border: Stronger color (soft → strong)
- Duration: 180ms

**Focus behavior:**
- Border: Accent color
- Shadow: Accent glow (0 0 0 3px rgba with accent)
- Outline: None (semantic focus ring)

```css
.cc-input:focus {
  border-color: var(--cc-accent);
  box-shadow: 0 0 0 3px rgba(0, 188, 235, 0.15);
  outline: none;
}
```

#### `cc-checkbox`
**Hover behavior:**
- Border: Brand color emphasis
- Duration: 120ms (fast)

**Checked state:**
- Background: Brand color
- Hover: Brand hover color

## React Hooks for Hover Management

### `useHoverState(onHoverStart?, onHoverEnd?)`
Simple hover state management

```typescript
const { isHovered, handlers } = useHoverState(() => {
  console.log('Hovered!');
});

<div {...handlers}>
  {isHovered && 'Hovering...'}
</div>
```

### `useMagneticHover(options)`
Cursor attraction effect for CTAs (minimal, 3px max)

```typescript
const { style, handlers } = useMagneticHover({ maxDistance: 3 });

<button style={style} {...handlers}>
  Click me
</button>
```

### `useReducedMotion()`
Detect and respect user's motion preferences

```typescript
const prefersReducedMotion = useReducedMotion();

if (prefersReducedMotion) {
  // Skip animations
}
```

### `useActionReveal(disabled?)`
Manage action button visibility on hover

```typescript
const { showActions, handlers } = useActionReveal();

<div {...handlers}>
  {showActions && <button>Edit</button>}
</div>
```

### `useClickFeedback(onPress?, duration?)`
Combined hover + click visual feedback

```typescript
const { isPressed, isHovered, handlers } = useClickFeedback();

<button {...handlers}>
  {isPressed ? 'Pressing!' : 'Click'}
</button>
```

## CSS Utility Classes

**Card patterns:**
```html
<!-- Basic interactive card -->
<article className="cc-card">Content</article>

<!-- Event card with metadata emphasis -->
<article className="cc-event-card">
  <div className="cc-event-metadata">Metadata</div>
</article>

<!-- Club card with action reveal -->
<article className="cc-club-card">
  <div className="cc-card-actions">Actions</div>
</article>

<!-- Dashboard card with subtle hover -->
<article className="cc-dashboard-card">
  <div className="cc-card-actions">Actions</div>
</article>
```

**Button patterns:**
```html
<button className="cc-btn-primary">Primary</button>
<button className="cc-btn-secondary">Secondary</button>
<button className="cc-btn-ghost">Ghost</button>
<button className="cc-btn-icon"><Icon /></button>
```

**Navigation patterns:**
```html
<a className="cc-sidebar-item">Sidebar Link</a>
<button className="cc-tab-item">Tab</button>
<a className="cc-nav-link">Nav Link</a>
```

**Table patterns:**
```html
<tr className="cc-table-row">
  <td>Data</td>
  <td className="cc-row-actions">
    <button>Edit</button>
  </td>
</tr>
```

## Accessibility Compliance

### Keyboard Navigation
All hover effects are matched by keyboard focus states:
- Focus rings use semantic accent colors
- All interactive elements have visible focus indicators
- No hover-only information is hidden

### Reduced Motion Support
All animations respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .cc-card, .cc-btn-primary, /* etc */ {
    transition: none !important;
    animation-duration: 1ms !important;
  }
}
```

### Color Contrast
- All hover color changes maintain WCAG AA compliance
- Accent colors (0, 188, 235) checked against all backgrounds
- Focus rings provide 3:1 contrast minimum

### Touch Device Adaptation
Mobile devices receive adapted interactions:
```css
@media (hover: none) and (pointer: coarse) {
  /* Reduced transform intensity */
  .hover-interactive:active {
    transform: translateY(-1px);  /* 50% of desktop */
  }
  
  /* Longer transitions for clarity */
  .cc-card {
    transition-duration: 200ms;
  }
}
```

## Performance Optimization

### GPU-Friendly Transforms
Only these properties are animated (GPU-accelerated):
- ✅ `transform: translateX/Y/Z`
- ✅ `transform: scale`
- ✅ `transform: rotate`
- ✅ `opacity`
- ✅ `filter: brightness` (selective)

### Avoided Properties
These cause layout shifts and jank:
- ❌ `width`, `height`
- ❌ `margin`, `padding` changes
- ❌ `top`, `left` (use transform instead)
- ❌ Complex box-shadow changes (only elevation shadows)

### Motion Caching
CSS transitions leverage browser caching:
- Shared transition strings via CSS variables
- Keyframes pre-compiled at load
- No JavaScript-driven animation loops

## Component Implementation Examples

### EventCard with Hover System
```jsx
<article className="cc-event-card animate-pop-in">
  <h3>Event Title</h3>
  <div className="cc-event-metadata">
    <p>Date & Venue</p>
  </div>
</article>
```

### ClubCard with Action Reveal
```jsx
<article className="cc-club-card">
  <div className="cover">Cover image</div>
  <div className="body">
    <h3>Club Name</h3>
    <div className="cc-card-actions">
      <button>Join</button>
    </div>
  </div>
</article>
```

### Dashboard Card with Subtlety
```jsx
<article className="cc-dashboard-card">
  <h3>Stat Title</h3>
  <div className="cc-card-actions">
    <button>View More</button>
  </div>
</article>
```

### Primary Button with Optional Magnetic Effect
```jsx
import { useMagneticHover } from '@/design/tokens';

function CTAButton() {
  const { style, handlers } = useMagneticHover();
  
  return (
    <button className="cc-btn-primary" style={style} {...handlers}>
      Click Me
    </button>
  );
}
```

## QA Checklist

✅ **Cohesion:** All hover interactions feel unified and intentional
✅ **Usability:** Hover interactions improve clarity, not hinder it
✅ **Performance:** All transforms are GPU-friendly, no layout shifts
✅ **Accessibility:** Keyboard focus equals or exceeds hover quality
✅ **Motion:** No motion feels excessive, all animations purposeful
✅ **Mobile:** Touch devices receive appropriate adaptation
✅ **Contrast:** All hover states maintain WCAG contrast ratios
✅ **Emotional:** Platform feels alive, premium, and professional

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS 13+)
- ✅ Chrome Mobile (Android 8+)

**Vendor Prefixes:** Not required (modern browsers); Tailwind handles legacy fallbacks

## Future Enhancements

1. **Advanced Magnetic Effects:** More sophisticated cursor tracking for premium CTAs
2. **Gesture Adaptation:** SwipeUp/SwipeDown alternatives for mobile actions
3. **Physics-Based Motion:** Spring animations for bouncy emphasis states
4. **Haptic Feedback:** Vibration feedback integration (mobile)
5. **Micro-interactions:** Ripple effects, state confirmations, achievement animations

## Summary

The hover system brings CampusConnect to a professional, modern quality bar:
- **Premium Feel:** Subtle elevation and refinement
- **Clear Feedback:** Motion improves, not obscures interaction
- **Production Ready:** Accessibility-first, performance-optimized
- **Scalable:** Easy to apply to new components
- **Responsive:** Touch/keyboard/desktop all supported equally

All interactions follow the principle: **"Motion must earn its place."**
