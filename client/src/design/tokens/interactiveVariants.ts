/**
 * interactiveVariants.ts — Tailwind/CSS Class Interactive Variants
 *
 * Provides semantic class variants for hover, focus, and active states
 * Designed to work with Tailwind CSS and custom CSS utilities
 *
 * Can be used in two ways:
 * 1. As Tailwind plugin configuration
 * 2. As inline class composition guide
 */

export const INTERACTIVE_VARIANTS = {
  /**
   * Card Hover Variants
   */
  card: {
    base: "border-cc-soft rounded-lg bg-cc-surface",
    hover: "hover:border-cc-strong hover:shadow-md hover:translate-y-[-2px]",
    interactive: "hover:bg-cc-surface-elevated hover:border-cc-strong",
  },

  dashboardCard: {
    base: "border-subtle rounded-lg bg-cc-surface",
    hover: "hover:border-hover hover:shadow-sm hover:translate-y-[-1px]",
    active: "group-hover:opacity-100",
    actionReveal: "group-hover:flex",
  },

  clubCard: {
    base: "border-cc-soft rounded-lg bg-cc-surface",
    hover:
      "hover:border-cc-brand hover:shadow-md hover:translate-y-[-2px] hover:border-accent",
    social: "group-hover:scale-105",
    actionReveal: "group-hover:translate-y-0 translate-y-2",
  },

  eventCard: {
    base: "border-cc-soft rounded-lg bg-cc-surface",
    hover: "hover:border-cc-accent hover:shadow-md hover:translate-y-[-2px]",
    metadataEmphasis: "group-hover:text-cc-accent",
  },

  /**
   * Button Hover Variants
   */
  button: {
    primary:
      "bg-cc-brand text-white hover:brightness-110 hover:translate-y-[-1px] hover:shadow-md",
    secondary:
      "border-cc-strong hover:border-cc-brand hover:bg-cc-surface-hover",
    ghost: "hover:bg-cc-surface-hover hover:text-cc-text",
    icon: "hover:scale-110 hover:text-cc-accent",
  },

  /**
   * Navigation Hover Variants
   */
  sidebarItem: {
    base: "px-3 py-2 rounded-md",
    hover: "hover:bg-cc-surface-hover",
    active: "bg-cc-surface-elevated border-l-2 border-cc-brand",
    activeHover: "group-hover:bg-cc-surface-hover",
  },

  tabItem: {
    base: "px-4 py-2 relative",
    hover: "hover:text-cc-accent",
    active: "border-b-2 border-cc-brand text-cc-brand",
    underline: "before:absolute before:bottom-0 before:h-0.5 before:bg-cc-brand",
  },

  navLink: {
    base: "relative inline-flex items-center",
    hover:
      "hover:text-cc-accent after:absolute after:bottom-0 after:h-0.5 after:w-full after:bg-cc-accent after:scale-x-0 hover:after:scale-x-100",
  },

  /**
   * Table Row Variants
   */
  tableRow: {
    base: "border-b border-cc-border-soft",
    hover: "hover:bg-cc-surface-hover hover:shadow-inner",
    actionReveal: "group-hover:opacity-100 opacity-0",
  },

  /**
   * Chat/Conversation Variants
   */
  chatRow: {
    base: "border-b border-cc-border-soft py-3",
    hover: "hover:bg-cc-surface-hover",
    unread: "border-l-2 border-cc-brand bg-cc-surface-elevated",
    unreadHover: "hover:border-l-4 hover:pl-1",
  },

  /**
   * Form Input Variants
   */
  input: {
    base: "border border-cc-border-soft rounded-lg px-3 py-2",
    hover: "hover:border-cc-border-strong",
    focus: "focus:border-cc-accent focus:ring-2 focus:ring-cc-accent/20 focus:outline-none",
    error: "border-cc-error focus:border-cc-error focus:ring-cc-error/20",
  },

  /**
   * Checkbox/Radio Variants
   */
  checkbox: {
    base: "w-4 h-4 border border-cc-border-strong rounded",
    hover: "hover:border-cc-brand",
    checked: "bg-cc-brand border-cc-brand",
    checkedHover: "hover:bg-cc-brand-hover",
  },

  /**
   * Link Variants
   */
  link: {
    base: "text-cc-brand underline-offset-2",
    hover: "hover:underline hover:text-cc-brand-hover",
    subtle: "text-cc-text-secondary hover:text-cc-accent",
  },

  /**
   * Badge/Tag Variants
   */
  badge: {
    base: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
    solid: "bg-cc-brand text-white",
    outline: "border border-cc-border-soft text-cc-text",
    outlineHover: "hover:border-cc-accent hover:text-cc-accent",
  },

  /**
   * Empty State Variants
   */
  emptyState: {
    base: "flex flex-col items-center justify-center py-12",
    actionHover: "hover:scale-105 hover:text-cc-accent",
  },

  /**
   * Focus Ring Variants (Accessibility)
   */
  focusRing: {
    brand: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cc-brand",
    accent:
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cc-accent",
  },
} as const;

/**
 * Semantic hover class builder
 * Composes variant classes based on component type and state
 */
export const composeInteractiveClasses = (
  type:
    | "card"
    | "button"
    | "link"
    | "input"
    | "navItem"
    | "badge"
    | "tableRow",
  variant:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "solid",
  states: {
    isHovered?: boolean;
    isActive?: boolean;
    isDisabled?: boolean;
    isError?: boolean;
  } = {}
): string => {
  const classes: string[] = [];

  // Type base classes
  if (type === "card") {
    classes.push(INTERACTIVE_VARIANTS.card.base);
    if (!states.isDisabled) classes.push(INTERACTIVE_VARIANTS.card.hover);
  } else if (type === "button") {
    if (variant === "primary") {
      classes.push(INTERACTIVE_VARIANTS.button.primary);
    } else if (variant === "secondary") {
      classes.push(INTERACTIVE_VARIANTS.button.secondary);
    } else if (variant === "ghost") {
      classes.push(INTERACTIVE_VARIANTS.button.ghost);
    }
  } else if (type === "input") {
    classes.push(INTERACTIVE_VARIANTS.input.base);
    if (!states.isDisabled) classes.push(INTERACTIVE_VARIANTS.input.hover);
    if (states.isError) classes.push(INTERACTIVE_VARIANTS.input.error);
  } else if (type === "link") {
    classes.push(INTERACTIVE_VARIANTS.link.base);
    if (!states.isDisabled) classes.push(INTERACTIVE_VARIANTS.link.hover);
  }

  // Disabled state
  if (states.isDisabled) {
    classes.push("opacity-50 cursor-not-allowed");
  }

  return classes.filter(Boolean).join(" ");
};

/**
 * Motion class builder
 * Combines motion utilities with interactive variants
 */
export const composeMotionClasses = (
  duration: "fast" | "normal" | "slow" = "normal",
  easing: "standard" | "emphasized" | "gentle" = "standard"
): string => {
  const durationMap = {
    fast: "duration-120",
    normal: "duration-180",
    slow: "duration-240",
  };

  const easingMap = {
    standard: "ease-out",
    emphasized: "[cubic-bezier(0.16,1,0.3,1)]",
    gentle: "[cubic-bezier(0.4,0,0.2,1)]",
  };

  return `transition-all ${durationMap[duration]} ${easingMap[easing]}`;
};

/**
 * Responsive hover adapter
 * Applies appropriate hover classes based on device capability
 */
export const composeResponsiveHoverClasses = (
  hoverClass: string,
  touchClass?: string
): string => {
  const classes = [
    // Desktop hover
    `${hoverClass}`,
    // Mobile active/focus alternative
    touchClass ? `@media (hover: none) { ${touchClass} }` : "",
  ];

  return classes.filter(Boolean).join(" ");
};

/**
 * Elevation and shadow variants for hover states
 */
export const ELEVATION_VARIANTS = {
  subtle: "shadow-sm",
  soft: "shadow-md",
  elevated: "shadow-lg",
  focus: "shadow-md ring-2 ring-cc-accent/20",
} as const;

/**
 * Transform variants for hover states
 */
export const TRANSFORM_VARIANTS = {
  none: "",
  "lift-slight": "hover:translate-y-[-1px]",
  "lift-subtle": "hover:translate-y-[-2px]",
  scale: "hover:scale-105",
  "scale-slight": "hover:scale-102",
} as const;

/**
 * Utility to build complete hover variant string
 */
export const buildHoverVariant = (
  config: {
    transform?: keyof typeof TRANSFORM_VARIANTS;
    shadow?: keyof typeof ELEVATION_VARIANTS;
    duration?: "fast" | "normal" | "slow";
    easing?: "standard" | "emphasized" | "gentle";
    disabled?: boolean;
  } = {}
): string => {
  const {
    transform = "lift-subtle",
    shadow = "soft",
    duration = "normal",
    easing = "standard",
    disabled = false,
  } = config;

  if (disabled) return "opacity-50 cursor-not-allowed";

  const classes = [
    TRANSFORM_VARIANTS[transform],
    `hover:${ELEVATION_VARIANTS[shadow]}`,
    composeMotionClasses(duration, easing),
  ];

  return classes.filter(Boolean).join(" ");
};

export default {
  INTERACTIVE_VARIANTS,
  ELEVATION_VARIANTS,
  TRANSFORM_VARIANTS,
  composeInteractiveClasses,
  composeMotionClasses,
  composeResponsiveHoverClasses,
  buildHoverVariant,
};
