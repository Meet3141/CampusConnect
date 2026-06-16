/**
 * motionUtilities.ts — Reusable Motion and Animation Utilities
 *
 * Provides:
 * - CSS-in-JS motion helper functions
 * - Transition builders for common patterns
 * - Easing function libraries
 * - Reduced-motion adaptation utilities
 * - GPU-safe animation builders
 */

import { HOVER_DURATIONS, HOVER_EASING, SHADOW_ELEVATION } from "./hoverTokens";

/**
 * Create a transition string with proper easing
 */
export const createTransition = (
  property: string | string[] = "all",
  duration: string = HOVER_DURATIONS.normal,
  easing: string = HOVER_EASING.standard
): string => {
  const props = Array.isArray(property) ? property : [property];
  return props.map((prop) => `${prop} ${duration} ${easing}`).join(", ");
};

/**
 * Create GPU-friendly transform with automatic optimization
 */
export const createGPUTransform = (
  transforms: Record<string, string | number>
): string => {
  const parts: string[] = [];

  if (transforms.translateX) parts.push(`translateX(${transforms.translateX})`);
  if (transforms.translateY) parts.push(`translateY(${transforms.translateY})`);
  if (transforms.scale) parts.push(`scale(${transforms.scale})`);
  if (transforms.scaleX) parts.push(`scaleX(${transforms.scaleX})`);
  if (transforms.scaleY) parts.push(`scaleY(${transforms.scaleY})`);
  if (transforms.rotate) parts.push(`rotate(${transforms.rotate})`);
  if (transforms.skewX) parts.push(`skewX(${transforms.skewX})`);
  if (transforms.skewY) parts.push(`skewY(${transforms.skewY})`);

  return parts.join(" ");
};

/**
 * Create elevation shadow with semantic intensity
 */
export const createElevationShadow = (
  intensity: "subtle" | "soft" | "elevated" | "focus"
): string => {
  return SHADOW_ELEVATION[`elevation-${intensity}`];
};

/**
 * Hover state builder for cards
 * Combines transform, shadow, and transition
 */
export const createCardHoverStyle = (
  intensity: "subtle" | "interactive" | "emphasis" = "interactive"
): Record<string, string> => {
  const baseTransition = createTransition(
    ["transform", "box-shadow", "border-color"],
    HOVER_DURATIONS.normal,
    HOVER_EASING.standard
  );

  const styles: Record<string, Record<string, string>> = {
    subtle: {
      transition: baseTransition,
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: createElevationShadow("subtle"),
      },
    },
    interactive: {
      transition: baseTransition,
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: createElevationShadow("soft"),
      },
    },
    emphasis: {
      transition: baseTransition,
      "&:hover": {
        transform: "scale(1.02)",
        boxShadow: createElevationShadow("elevated"),
      },
    },
  };

  return styles[intensity];
};

/**
 * Button hover builder
 * Combines transform, brightness, shadow
 */
export const createButtonHoverStyle = (
  type: "primary" | "secondary" | "ghost" | "icon" = "primary",
  hasMagnetic = false
): Record<string, string> => {
  const baseTransition = createTransition(
    ["transform", "box-shadow", "background-color", "color", "border-color"],
    HOVER_DURATIONS.normal,
    HOVER_EASING.standard
  );

  const styles: Record<string, Record<string, string>> = {
    primary: {
      transition: baseTransition,
      "&:hover": {
        transform: "translateY(-1px)",
        filter: "brightness(1.06)",
        boxShadow: createElevationShadow("soft"),
      },
    },
    secondary: {
      transition: baseTransition,
      "&:hover": {
        borderColor: "currentColor",
        backgroundColor: "var(--cc-legacy-rgba-248-249-250-008)",
      },
    },
    ghost: {
      transition: baseTransition,
      "&:hover": {
        backgroundColor: "var(--cc-legacy-rgba-248-249-250-006)",
        color: "currentColor",
      },
    },
    icon: {
      transition: baseTransition,
      "&:hover": {
        transform: "scale(1.08)",
      },
    },
  };

  return styles[type];
};

/**
 * Navigation hover builder
 * Smooth active state transitions
 */
export const createNavHoverStyle = (
  type: "sidebar" | "tab" | "link" = "link"
): Record<string, string> => {
  const baseTransition = createTransition(
    ["background-color", "color", "border-color"],
    HOVER_DURATIONS.normal,
    HOVER_EASING.standard
  );

  const styles: Record<string, Record<string, string>> = {
    sidebar: {
      transition: baseTransition,
      "&:hover": {
        backgroundColor: "var(--cc-legacy-rgba-248-249-250-008)",
      },
    },
    tab: {
      transition: baseTransition,
      "&:hover": {
        color: "var(--cc-accent)",
      },
    },
    link: {
      transition: baseTransition,
      "&:hover": {
        textDecoration: "underline",
        opacity: "0.9",
      },
    },
  };

  return styles[type];
};

/**
 * Table row hover builder
 * Soft highlight without aggressive background
 */
export const createTableRowHoverStyle = (): Record<string, string> => ({
  transition: createTransition(
    ["background-color", "box-shadow"],
    HOVER_DURATIONS.normal,
    HOVER_EASING.standard
  ),
  "&:hover": {
    backgroundColor: "var(--cc-legacy-rgba-248-249-250-004)",
    boxShadow: "inset 0 0 0 1px var(--cc-legacy-rgba-248-249-250-008)",
  },
});

/**
 * Input focus builder
 * Replaces aggressive focus rings with semantic accent
 */
export const createInputFocusStyle = (): Record<string, string> => ({
  transition: createTransition(
    ["border-color", "box-shadow"],
    HOVER_DURATIONS.normal,
    HOVER_EASING.standard
  ),
  "&:focus": {
    borderColor: "var(--cc-accent)",
    boxShadow: `0 0 0 3px var(--cc-legacy-rgba-0-188-235-015)`,
    outline: "none",
  },
});

/**
 * Reduced motion adapter
 * Returns styles that respect prefers-reduced-motion
 */
export const withReducedMotion = (
  normalStyles: Record<string, string>
): string => {
  return `
    @media (prefers-reduced-motion: reduce) {
      ${Object.entries(normalStyles)
        .map(([key, value]) => {
          if (value.includes("animation") || value.includes("transition")) {
            return `${key} { animation-duration: 1ms !important; transition-duration: 1ms !important; }`;
          }
          return "";
        })
        .join("\n")}
    }
  `;
};

/**
 * Mobile hover adapter
 * Converts hover to active/focus states for touch devices
 */
export const createMobileHoverFallback = (
  hoverStyle: Record<string, string>
): Record<string, string> => ({
  "@media (hover: none) and (pointer: coarse)": {
    transition: createTransition(
      ["transform", "box-shadow"],
      HOVER_DURATIONS.fast,
      HOVER_EASING.standard
    ),
    "&:active": hoverStyle,
  },
});

/**
 * Magnetic cursor effect builder (for buttons)
 * Creates subtle cursor attraction
 */
export const createMagneticStyle = (maxDistance = 3): string => {
  return `
    position: relative;
    cursor: pointer;
    
    @media (hover: hover) {
      &:hover {
        --mouse-x: 0px;
        --mouse-y: 0px;
        transform: translate(var(--mouse-x), var(--mouse-y)) translateY(-1px);
      }
    }
  `;
};

/**
 * Stagger animation builder
 * For sequential element animations (list items, tabs)
 */
export const createStaggerAnimation = (
  baseDelay = 0,
  delayIncrement = 40
): ((index: number) => string) => {
  return (index: number) => {
    const delay = baseDelay + index * delayIncrement;
    return `animation-delay: ${delay}ms;`;
  };
};

/**
 * Compat helper: CSS class string for hover utilities
 * Generate utility class names dynamically
 */
export const classifyHoverIntensity = (
  intensity: "subtle" | "interactive" | "emphasis"
): string => {
  return `hover-${intensity}`;
};

export default {
  createTransition,
  createGPUTransform,
  createElevationShadow,
  createCardHoverStyle,
  createButtonHoverStyle,
  createNavHoverStyle,
  createTableRowHoverStyle,
  createInputFocusStyle,
  withReducedMotion,
  createMobileHoverFallback,
  createMagneticStyle,
  createStaggerAnimation,
  classifyHoverIntensity,
};
