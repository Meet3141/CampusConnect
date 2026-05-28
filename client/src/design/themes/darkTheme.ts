import { brandColors, neutralColors, statusColors } from "../tokens/colors";

export const darkTheme = {
  name: "dark",
  colors: {
    brand: brandColors.steelAzure,
    brandHover: "#0A63C7",
    background: neutralColors.midnight,
    surface: neutralColors.deepSpace,
    surfaceElevated: neutralColors.slate,
    surfaceHover: "rgba(248, 249, 250, 0.06)",
    surfaceWeak: "rgba(248, 249, 250, 0.03)",
    surfaceOverlay: "rgba(10, 15, 26, 0.88)",
    textPrimary: brandColors.brightSnow,
    textSecondary: "#C7D2E0",
    textMuted: neutralColors.fog,
    textInverse: neutralColors.midnight,
    border: "rgba(248, 249, 250, 0.12)",
    borderStrong: "rgba(248, 249, 250, 0.22)",
    accent: brandColors.skySurge,
    success: statusColors.success,
    warning: statusColors.warning,
    error: statusColors.error,
    info: statusColors.info,
    focus: brandColors.skySurge,
  },
} as const;
