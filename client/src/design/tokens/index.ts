/**
 * index.ts — Hover System Exports
 *
 * Central export point for all hover system utilities
 * Import everything from this file for consistent hover behavior
 */

// Design tokens
export * from "./hoverTokens";
export * from "./motionUtilities";
export * from "./hoverStateUtilities";
export * from "./interactiveVariants";

// Re-export common patterns
export {
  HOVER_LEVELS,
  SURFACE_HOVER,
  BUTTON_HOVER,
  NAVIGATION_HOVER,
  SHADOW_ELEVATION,
} from "./hoverTokens";

export {
  createTransition,
  createGPUTransform,
  createElevationShadow,
  createCardHoverStyle,
  createButtonHoverStyle,
  createNavHoverStyle,
  createTableRowHoverStyle,
  createInputFocusStyle,
} from "./motionUtilities";

export {
  useHoverState,
  useMagneticHover,
  useReducedMotion,
  useClickFeedback,
  useActionReveal,
} from "./hoverStateUtilities";

export {
  INTERACTIVE_VARIANTS,
  composeInteractiveClasses,
  composeMotionClasses,
  buildHoverVariant,
} from "./interactiveVariants";
