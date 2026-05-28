/**
 * hoverTokens.ts — Hover Interaction Design Tokens
 *
 * Centralized hover behavior patterns following "Premium Restraint" philosophy:
 * - Subtle elevation and refinement
 * - GPU-friendly transforms (translate, scale, opacity only)
 * - Consistent motion timing and easing
 * - Accessibility-first (prefers-reduced-motion support)
 * - Platform-grade production quality
 */

export const HOVER_DURATIONS = {
  fast: "120ms",
  normal: "180ms",
  slow: "240ms",
} as const;

export const HOVER_EASING = {
  standard: "ease-out",
  emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
  gentle: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/**
 * Hover Intensity Levels
 * Define semantic hover behavior tiers
 */
export const HOVER_LEVELS = {
  /**
   * hover-subtle: Minimal feedback for low-priority interactions
   * Use: Links, tags, breadcrumbs, secondary nav items
   * Motion: Border tint, 80ms opacity shift
   */
  subtle: {
    duration: HOVER_DURATIONS.fast,
    easing: HOVER_EASING.standard,
    transform: "none",
    borderTint: true,
    opacityShift: 0.06,
  },

  /**
   * hover-interactive: Standard interaction feedback
   * Use: Cards, buttons, selectable items, table rows
   * Motion: translateY(-2px), soft shadow, border emphasis
   */
  interactive: {
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    transform: "translateY(-2px)",
    shadowElevation: "soft",
    borderTint: true,
  },

  /**
   * hover-emphasis: Primary CTA and high-priority elements
   * Use: Primary buttons, featured cards, hero CTAs, critical actions
   * Motion: Subtle scale, brightness shift, elevated shadow
   */
  emphasis: {
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.emphasized,
    transform: "scale(1.02)",
    shadowElevation: "elevated",
    brightness: 1.08,
  },
} as const;

/**
 * Surface-Specific Hover Behaviors
 */
export const SURFACE_HOVER = {
  card: {
    transform: "translateY(-2px)",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    shadow: "elevation-soft",
    borderBehavior: "subtle-emphasis",
  },

  dashboardCard: {
    transform: "translateY(-1px)",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    shadow: "elevation-subtle",
    borderBehavior: "color-tint",
    actionReveal: true,
  },

  clubCard: {
    transform: "translateY(-2px)",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    shadow: "elevation-soft",
    borderBehavior: "accent-emphasis",
    actionReveal: true,
    socialEnergy: true,
  },

  eventCard: {
    transform: "translateY(-2px)",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    shadow: "elevation-soft",
    metadataEmphasis: true,
    borderBehavior: "accent-tint",
  },

  tableRow: {
    transform: "none",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    backgroundTint: "soft",
    actionReveal: true,
  },

  chatRow: {
    transform: "none",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    backgroundTint: "soft",
    unreadEmphasis: true,
  },
} as const;

/**
 * Button-Specific Hover Behaviors
 */
export const BUTTON_HOVER = {
  primary: {
    transform: "translateY(-1px)",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    shadow: "elevation-soft",
    brightness: 1.06,
    magnetic: { enabled: true, maxDistance: 3 },
  },

  secondary: {
    transform: "none",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    borderEmphasis: true,
    surfaceTint: true,
  },

  ghost: {
    transform: "none",
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    backgroundFadeIn: true,
    textEmphasis: true,
  },

  icon: {
    transform: "scale(1.06)",
    duration: HOVER_DURATIONS.fast,
    easing: HOVER_EASING.standard,
    colorTint: true,
  },
} as const;

/**
 * Navigation-Specific Hover Behaviors
 */
export const NAVIGATION_HOVER = {
  sidebarItem: {
    activateTransition: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    backgroundTint: true,
    iconEmphasis: true,
  },

  tabItem: {
    underlineAnimation: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    textEmphasis: true,
  },

  navLink: {
    duration: HOVER_DURATIONS.fast,
    easing: HOVER_EASING.standard,
    underlineReveal: true,
    textTint: true,
  },
} as const;

/**
 * Input-Specific Hover Behaviors
 */
export const INPUT_HOVER = {
  textInput: {
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    borderEmphasis: true,
    focusPrep: true,
  },

  checkbox: {
    duration: HOVER_DURATIONS.fast,
    easing: HOVER_EASING.standard,
    borderHighlight: true,
  },

  select: {
    duration: HOVER_DURATIONS.normal,
    easing: HOVER_EASING.standard,
    borderTint: true,
  },
} as const;

/**
 * Shadow Elevation System
 * GPU-friendly elevation through box-shadow only (no height change)
 */
export const SHADOW_ELEVATION = {
  "elevation-subtle": "0 2px 8px rgba(0, 79, 159, 0.08)",
  "elevation-soft": "0 4px 16px rgba(0, 79, 159, 0.12)",
  "elevation-elevated": "0 8px 24px rgba(0, 79, 159, 0.16)",
  "elevation-focus": "0 4px 12px rgba(0, 188, 235, 0.15)",
} as const;

/**
 * Mobile/Touch Adaptation
 * Gracefully degrades hover for touch devices
 */
export const MOBILE_ADAPTATION = {
  hoverToTap: {
    preserveMotion: true,
    reduceDuration: true,
    durationMultiplier: 1.2, // Slightly longer on mobile
    reduceTransformIntensity: true,
    transformScale: 0.7, // 70% of desktop effect
  },
  prefersReducedMotion: {
    duration: "1ms", // Instant
    transform: "none",
    disableTransitions: true,
  },
} as const;

/**
 * Semantic Hover Mapping
 * Purpose-driven hover states by semantic intent
 */
export const SEMANTIC_HOVER = {
  "hover-primary": {
    purpose: "Authority interactions (primary CTAs, important actions)",
    colorScheme: "brand-blue",
    intensity: "emphasis",
  },

  "hover-secondary": {
    purpose: "Neutral interactions (standard actions, navigation)",
    colorScheme: "neutral",
    intensity: "interactive",
  },

  "hover-success": {
    purpose: "Positive action interactions (confirmations, saves)",
    colorScheme: "success-green",
    intensity: "interactive",
  },

  "hover-warning": {
    purpose: "Pending/review interactions (alerts, reviews needed)",
    colorScheme: "warning-amber",
    intensity: "interactive",
  },

  "hover-danger": {
    purpose: "Destructive interactions (deletes, removals)",
    colorScheme: "error-red",
    intensity: "interactive",
  },

  "hover-accent": {
    purpose: "Accent interactions (discovery, exploration)",
    colorScheme: "accent-cyan",
    intensity: "interactive",
  },
} as const;

/**
 * Quality Assurance Checklist
 * Use to validate hover implementation consistency
 */
export const QA_CHECKLIST = {
  cohesion: "All hover interactions feel unified and intentional",
  usability: "Hover interactions improve clarity, not hinder it",
  performance: "All transforms are GPU-friendly, no layout shifts",
  accessibility: "Keyboard focus equals or exceeds hover quality",
  motion: "No motion feels excessive, all animations purposeful",
  mobile: "Touch devices receive appropriate adaptation",
  contrast: "All hover states maintain WCAG contrast ratios",
  emotional: "Platform feels alive, premium, and professional",
} as const;

export default {
  HOVER_DURATIONS,
  HOVER_EASING,
  HOVER_LEVELS,
  SURFACE_HOVER,
  BUTTON_HOVER,
  NAVIGATION_HOVER,
  INPUT_HOVER,
  SHADOW_ELEVATION,
  MOBILE_ADAPTATION,
  SEMANTIC_HOVER,
  QA_CHECKLIST,
};
