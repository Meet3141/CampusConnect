/**
 * design/themes/lightTheme.ts
 * Light theme token map — aligned to the Semantic Token Migration spec.
 * Consumed by ThemeProvider to set CSS variables on <html data-theme="light">.
 */
import { brandColors, lightSemanticSpec } from "../tokens/colors";

export const lightTheme = {
  name: "light",
  colors: {
    /* ── Brand ── */
    brand:              brandColors.steelAzure,
    brandHover:         lightSemanticSpec.primaryHover,

    /* ── Surfaces ── */
    background:         lightSemanticSpec.background,
    surface:            lightSemanticSpec.surface,
    surfaceElevated:    lightSemanticSpec.surface,
    surfaceSecondary:   lightSemanticSpec.surfaceSecondary,
    surfaceHover:       lightSemanticSpec.surfaceHover,
    surfaceActive:      lightSemanticSpec.surfaceActive,
    surfaceWeak:        "rgba(15, 23, 42, 0.03)",
    surfaceOverlay:     "rgba(248, 249, 250, 0.94)",

    /* ── Text ── */
    textPrimary:        lightSemanticSpec.textPrimary,
    textSecondary:      lightSemanticSpec.textSecondary,
    textMuted:          lightSemanticSpec.textMuted,
    textDisabled:       lightSemanticSpec.textDisabled,
    textInverse:        brandColors.brightSnow,

    /* ── Borders ── */
    border:             lightSemanticSpec.borderDefault,
    borderSubtle:       lightSemanticSpec.borderSubtle,
    borderStrong:       lightSemanticSpec.borderFocus,
    borderHover:        lightSemanticSpec.borderHover,
    borderFocus:        lightSemanticSpec.borderFocus,

    /* ── Accent & Primary soft tones ── */
    accent:             lightSemanticSpec.accent,
    accentSoft:         lightSemanticSpec.accentSoft,
    accentBorder:       lightSemanticSpec.accentBorder,
    primarySoft:        lightSemanticSpec.primarySoft,
    primaryBorder:      lightSemanticSpec.primaryBorder,

    /* ── Feedback ── */
    success:            lightSemanticSpec.success,
    warning:            lightSemanticSpec.warning,
    error:              lightSemanticSpec.error,
    info:               lightSemanticSpec.info,
    focus:              brandColors.steelAzure,
  },
} as const;
