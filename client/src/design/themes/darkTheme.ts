import { brandColors, neutralColors, statusColors } from "../tokens/colors";

export const darkTheme = {
  name: "dark",
  colors: {
    brand: brandColors.steelAzure,
    brandHover: "var(--cc-legacy-hex-0a63c7)",
    background: neutralColors.midnight,
    surface: neutralColors.deepSpace,
    surfaceElevated: neutralColors.slate,
    surfaceHover: "var(--cc-legacy-rgba-248-249-250-006)",
    surfaceWeak: "var(--cc-legacy-rgba-248-249-250-003)",
    surfaceOverlay: "var(--cc-legacy-rgba-10-15-26-088)",
    textPrimary: brandColors.brightSnow,
    textSecondary: "var(--cc-legacy-hex-c7d2e0)",
    textMuted: neutralColors.fog,
    textInverse: neutralColors.midnight,
    border: "var(--cc-legacy-rgba-248-249-250-012)",
    borderStrong: "var(--cc-legacy-rgba-248-249-250-022)",
    accent: brandColors.skySurge,
    success: statusColors.success,
    warning: statusColors.warning,
    error: statusColors.error,
    info: statusColors.info,
    focus: brandColors.skySurge,
  },
} as const;
