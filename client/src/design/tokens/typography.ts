/**
 * Font families — consume CSS custom properties only.
 * Actual font loading is handled in index.html via <link> + preconnect.
 * Raw stacks listed as comments for reference; do not use them directly in components.
 *
 *   Heading/Display: "Sora" (wght 400–800)
 *   Body:            "Manrope" (wght 300–800)
 *   Mono:            "JetBrains Mono" (wght 400–600)  [loaded via local fallback]
 */
export const fontFamilies = {
  /** Sora → Manrope → system sans */
  heading: 'var(--cc-font-heading)',
  /** Sora → Manrope → system sans */
  display: 'var(--cc-font-heading)',
  /** Manrope → system sans */
  body: 'var(--cc-font-body)',
  /** JetBrains Mono → Consolas → monospace */
  mono: 'var(--cc-font-family-mono)',
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeights = {
  tight: "1.1",
  snug: "1.25",
  normal: "1.6",
  relaxed: "1.75",
} as const;

export const letterSpacing = {
  tight: "-0.02em",
  normal: "0em",
  wide: "0.01em",
  extraWide: "0.02em",
} as const;

export const typography = {
  displayXl: {
    fontSize: "clamp(2.75rem, 2.2rem + 2.4vw, 4rem)",
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  displayLg: {
    fontSize: "clamp(2.25rem, 1.9rem + 1.8vw, 3.25rem)",
    lineHeight: "1.15",
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  headingXl: {
    fontSize: "clamp(1.875rem, 1.6rem + 1.1vw, 2.5rem)",
    lineHeight: "1.2",
    fontWeight: fontWeights.semibold,
    letterSpacing: "-0.01em",
  },
  headingLg: {
    fontSize: "clamp(1.5rem, 1.3rem + 0.9vw, 2rem)",
    lineHeight: "1.25",
    fontWeight: fontWeights.semibold,
    letterSpacing: "-0.01em",
  },
  headingMd: {
    fontSize: "clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)",
    lineHeight: "1.3",
    fontWeight: fontWeights.semibold,
  },
  headingSm: {
    fontSize: "clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem)",
    lineHeight: "1.35",
    fontWeight: fontWeights.semibold,
  },
  bodyLg: {
    fontSize: "clamp(1rem, 0.98rem + 0.2vw, 1.125rem)",
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
  },
  bodyMd: {
    fontSize: "clamp(1rem, 0.98rem + 0.1vw, 1.0625rem)",
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.regular,
  },
  bodySm: {
    fontSize: "clamp(0.9375rem, 0.92rem + 0.08vw, 0.98rem)",
    lineHeight: "1.55",
    fontWeight: fontWeights.regular,
  },
  caption: {
    fontSize: "clamp(0.8125rem, 0.8rem + 0.05vw, 0.875rem)",
    lineHeight: "1.4",
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  micro: {
    fontSize: "clamp(0.75rem, 0.74rem + 0.04vw, 0.8rem)",
    lineHeight: "1.35",
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.extraWide,
  },
} as const;
