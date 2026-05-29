export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Brand ── */
        brand:               "var(--cc-color-brand)",
        "brand-hover":       "var(--cc-color-brand-hover)",
        primary:             "var(--cc-color-brand)",
        "primary-hover":     "var(--cc-color-brand-hover)",
        "primary-soft":      "var(--cc-color-primary-soft)",
        "primary-border":    "var(--cc-color-primary-border)",
        "primary-50":        "var(--cc-color-primary-50)",
        "primary-100":       "var(--cc-color-primary-100)",
        "primary-200":       "var(--cc-color-primary-200)",
        "primary-300":       "var(--cc-color-primary-300)",
        "primary-400":       "var(--cc-color-primary-400)",
        "primary-500":       "var(--cc-color-primary-500)",
        "primary-600":       "var(--cc-color-primary-600)",
        "primary-700":       "var(--cc-color-primary-700)",
        "primary-800":       "var(--cc-color-primary-800)",
        "primary-900":       "var(--cc-color-primary-900)",

        /* ── Surfaces ── */
        background:          "var(--cc-color-background)",
        surface:             "var(--cc-color-surface)",
        "surface-elevated":  "var(--cc-color-surface-elevated)",
        "surface-secondary": "var(--cc-color-surface-secondary)",
        "surface-hover":     "var(--cc-color-surface-hover)",
        "surface-active":    "var(--cc-color-surface-active)",
        "surface-weak":      "var(--cc-color-surface-weak)",
        "surface-overlay":   "var(--cc-color-surface-overlay)",

        /* ── Text ── */
        "text-primary":      "var(--cc-color-text-primary)",
        "text-secondary":    "var(--cc-color-text-secondary)",
        "text-muted":        "var(--cc-color-text-muted)",
        "text-disabled":     "var(--cc-color-text-disabled)",
        "on-brand":          "var(--cc-color-on-brand)",

        /* ── Borders ── */
        border:              "var(--cc-color-border)",
        "border-strong":     "var(--cc-color-border-strong)",
        "border-subtle":     "var(--cc-color-border-subtle)",
        "border-hover":      "var(--cc-color-border-hover)",
        "border-focus":      "var(--cc-color-border-focus)",

        /* ── Accent ── */
        accent:              "var(--cc-color-accent)",
        "accent-soft":       "var(--cc-color-accent-soft)",
        "accent-border":     "var(--cc-color-accent-border)",

        /* ── Feedback ── */
        success:             "var(--cc-color-success)",
        warning:             "var(--cc-color-warning)",
        error:               "var(--cc-color-error)",
        info:                "var(--cc-color-info)",
      },
      spacing: {
        0: "var(--cc-space-0)",
        1: "var(--cc-space-1)",
        2: "var(--cc-space-2)",
        3: "var(--cc-space-3)",
        4: "var(--cc-space-4)",
        5: "var(--cc-space-5)",
        6: "var(--cc-space-6)",
        8: "var(--cc-space-8)",
        10: "var(--cc-space-10)",
        12: "var(--cc-space-12)",
        16: "var(--cc-space-16)",
        20: "var(--cc-space-20)",
        24: "var(--cc-space-24)",
        32: "var(--cc-space-32)",
        40: "var(--cc-space-40)",
        48: "var(--cc-space-48)",
        64: "var(--cc-space-64)",
        80: "var(--cc-space-80)",
        96: "var(--cc-space-96)",
      },
      borderRadius: {
        sm:      "var(--cc-radius-sm)",
        md:      "var(--cc-radius-md)",
        lg:      "var(--cc-radius-lg)",
        xl:      "var(--cc-radius-xl)",
        "2xl":   "var(--cc-radius-2xl)",
        pill:    "var(--cc-radius-pill)",
        /* ── Semantic radius aliases ── */
        soft:    "var(--cc-radius-lg)",   // 12px — interactive elements
        premium: "var(--cc-radius-xl)",   // 16px — cards, panels
      },
      boxShadow: {
        sm:          "var(--cc-shadow-sm)",
        md:          "var(--cc-shadow-md)",
        lg:          "var(--cc-shadow-lg)",
        xl:          "var(--cc-shadow-xl)",
        /* ── Semantic shadow aliases ── */
        soft:        "var(--cc-shadow-soft)",      // card-level flat depth
        overlay:     "var(--cc-shadow-overlay)",   // dropdown/modal depth
        card:        "var(--cc-shadow-card)",       // surface-to-background
        "hover-sm":  "var(--cc-shadow-hover-sm)",  // subtle lift
        "hover-md":  "var(--cc-shadow-hover-md)",  // card lift
      },
      fontFamily: {
        heading: "var(--cc-font-heading)",
        display: "var(--cc-font-heading)",
        body: "var(--cc-font-body)",
        mono: "var(--cc-font-family-mono)",
      },
      width: {
        sidebar: "var(--cc-sidebar-expanded)",
        "sidebar-rail": "var(--cc-sidebar-collapsed)",
      },
      height: {
        topbar: "var(--cc-topbar-height)",
      },
      minWidth: {
        sidebar: "var(--cc-sidebar-expanded)",
        "sidebar-rail": "var(--cc-sidebar-collapsed)",
      },
      fontSize: {
        "display-xl": ["var(--cc-font-size-display-xl)", { lineHeight: "var(--cc-line-height-display-xl)", letterSpacing: "var(--cc-letter-spacing-display)" }],
        "display-lg": ["var(--cc-font-size-display-lg)", { lineHeight: "var(--cc-line-height-display-lg)", letterSpacing: "var(--cc-letter-spacing-display)" }],
        "heading-xl": ["var(--cc-font-size-heading-xl)", { lineHeight: "var(--cc-line-height-heading-xl)", letterSpacing: "-0.01em" }],
        "heading-lg": ["var(--cc-font-size-heading-lg)", { lineHeight: "var(--cc-line-height-heading-lg)", letterSpacing: "-0.01em" }],
        "heading-md": ["var(--cc-font-size-heading-md)", { lineHeight: "var(--cc-line-height-heading-md)" }],
        "heading-sm": ["var(--cc-font-size-heading-sm)", { lineHeight: "var(--cc-line-height-heading-sm)" }],
        "body-lg": ["var(--cc-font-size-body-lg)", { lineHeight: "var(--cc-line-height-body-lg)" }],
        "body-md": ["var(--cc-font-size-body-md)", { lineHeight: "var(--cc-line-height-body-md)" }],
        "body-sm": ["var(--cc-font-size-body-sm)", { lineHeight: "var(--cc-line-height-body-sm)" }],
        caption: ["var(--cc-font-size-caption)", { lineHeight: "var(--cc-line-height-caption)", letterSpacing: "var(--cc-letter-spacing-caption)" }],
        micro: ["var(--cc-font-size-micro)", { lineHeight: "var(--cc-line-height-micro)", letterSpacing: "var(--cc-letter-spacing-micro)" }],
      },
      fontWeight: {
        regular: "var(--cc-font-weight-regular)",
        medium: "var(--cc-font-weight-medium)",
        semibold: "var(--cc-font-weight-semibold)",
        bold: "var(--cc-font-weight-bold)",
      },
      lineHeight: {
        "display-xl": "var(--cc-line-height-display-xl)",
        "display-lg": "var(--cc-line-height-display-lg)",
        "heading-xl": "var(--cc-line-height-heading-xl)",
        "heading-lg": "var(--cc-line-height-heading-lg)",
        "heading-md": "var(--cc-line-height-heading-md)",
        "heading-sm": "var(--cc-line-height-heading-sm)",
        "body-lg": "var(--cc-line-height-body-lg)",
        "body-md": "var(--cc-line-height-body-md)",
        "body-sm": "var(--cc-line-height-body-sm)",
        caption: "var(--cc-line-height-caption)",
        micro: "var(--cc-line-height-micro)",
      },
      letterSpacing: {
        display: "var(--cc-letter-spacing-display)",
        caption: "var(--cc-letter-spacing-caption)",
        micro: "var(--cc-letter-spacing-micro)",
      },
      zIndex: {
        base: "var(--cc-z-base)",
        dropdown: "var(--cc-z-dropdown)",
        sticky: "var(--cc-z-sticky)",
        overlay: "var(--cc-z-overlay)",
        modal: "var(--cc-z-modal)",
        toast: "var(--cc-z-toast)",
        tooltip: "var(--cc-z-tooltip)",
      },
      transitionDuration: {
        fast:   "var(--cc-motion-fast)",
        normal: "var(--cc-motion-normal)",
        slow:   "var(--cc-motion-slow)",
        spring: "var(--cc-motion-spring)",
      },
      transitionTimingFunction: {
        standard:   "var(--cc-motion-ease-standard)",
        emphasized: "var(--cc-motion-ease-emphasized)",
        /* ── Semantic aliases ── */
        premium:    "var(--cc-motion-ease-emphasized)", // alias for easy use
        spring:     "var(--cc-motion-ease-spring)",
        decelerate: "var(--cc-motion-ease-decelerate)",
      },
      screens: {
        xs: "360px",
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
  },
};
