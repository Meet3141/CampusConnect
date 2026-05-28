/**
 * design/tokens/colors.ts
 * Primitive + semantic color tokens for CampusConnect.
 * All semantic values reference CSS variables so they theme correctly.
 */

/* ── Primitive brand palette ── */
export const brandColors = {
  steelAzure:  "#004F9F",   // Primary authority blue
  brightSnow:  "#F8F9FA",   // Light background base
  skySurge:    "#00BCEB",   // Accent / interaction energy
  white:       "#FFFFFF",
  graphite:    "#333333",   // Body text on light
} as const;

/* ── Primitive neutral scale (dark theme surfaces) ── */
export const neutralColors = {
  midnight:  "#0A0F1A",
  deepSpace: "#0F1724",
  slate:     "#141C2B",
  steel:     "#1C2433",
  fog:       "#94A3B8",
} as const;

/* ── Semantic light-theme color spec ── */
export const lightSemanticSpec = {
  primary:         "#004F9F",
  primaryHover:    "#0062C4",
  primarySoft:     "rgba(0, 79, 159, 0.08)",
  primaryBorder:   "rgba(0, 79, 159, 0.14)",
  accent:          "#00BCEB",
  accentSoft:      "rgba(0, 188, 235, 0.08)",
  accentBorder:    "rgba(0, 188, 235, 0.18)",
  background:      "#F8F9FA",
  surface:         "#FFFFFF",
  surfaceSecondary:"#F3F6F9",
  surfaceHover:    "rgba(0, 188, 235, 0.04)",
  surfaceActive:   "rgba(0, 79, 159, 0.06)",
  textPrimary:     "#333333",
  textSecondary:   "rgba(51, 51, 51, 0.72)",
  textMuted:       "rgba(51, 51, 51, 0.52)",
  textDisabled:    "rgba(51, 51, 51, 0.32)",
  borderSubtle:    "rgba(0, 79, 159, 0.08)",
  borderDefault:   "rgba(0, 79, 159, 0.12)",
  borderHover:     "rgba(0, 188, 235, 0.18)",
  borderFocus:     "rgba(0, 79, 159, 0.24)",
  success:         "#00C27A",
  warning:         "#FFB020",
  error:           "#FF4D6D",
  info:            "#5AA9FF",
} as const;

/* ── Primitive status palette ── */
export const statusColors = {
  success: "#22C55E",  // dark theme
  warning: "#F59E0B",  // dark theme
  error:   "#EF4444",  // dark theme
  info:    "#38BDF8",  // dark theme
} as const;

/* ── Semantic references (CSS variable-backed) ── */
export const semanticColors = {
  brand:           "var(--cc-color-brand)",
  brandHover:      "var(--cc-color-brand-hover)",
  background:      "var(--cc-color-background)",
  surface:         "var(--cc-color-surface)",
  surfaceElevated: "var(--cc-color-surface-elevated)",
  surfaceSecondary:"var(--cc-color-surface-secondary)",
  surfaceHover:    "var(--cc-color-surface-hover)",
  surfaceActive:   "var(--cc-color-surface-active)",
  textPrimary:     "var(--cc-color-text-primary)",
  textSecondary:   "var(--cc-color-text-secondary)",
  textMuted:       "var(--cc-color-text-muted)",
  textDisabled:    "var(--cc-color-text-disabled)",
  border:          "var(--cc-color-border)",
  borderSubtle:    "var(--cc-color-border-subtle)",
  borderHover:     "var(--cc-color-border-hover)",
  borderFocus:     "var(--cc-color-border-focus)",
  accent:          "var(--cc-color-accent)",
  accentSoft:      "var(--cc-color-accent-soft)",
  primarySoft:     "var(--cc-color-primary-soft)",
  primaryBorder:   "var(--cc-color-primary-border)",
  success:         "var(--cc-color-success)",
  warning:         "var(--cc-color-warning)",
  error:           "var(--cc-color-error)",
  info:            "var(--cc-color-info)",
} as const;
