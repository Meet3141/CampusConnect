import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = "cc_theme_preference";
const LEGACY_THEME_KEY = "cc_theme";
const THEME_VALUES = new Set(["light", "dark", "system"]);

const getStoredPreference = () => {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
    return THEME_VALUES.has(stored) ? stored : "light";
  } catch (e) {
    return "system";
  }
};

const getSystemTheme = () => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => setSystemTheme(event.matches ? "dark" : "light");

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, []);

  const theme = preference === "system" ? systemTheme : preference;

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.colorScheme = theme;
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    try {
      if (preference === "system") {
        localStorage.removeItem(THEME_STORAGE_KEY);
        localStorage.removeItem(LEGACY_THEME_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
        localStorage.removeItem(LEGACY_THEME_KEY);
      }
    } catch (e) {}
  }, [preference]);

  const value = useMemo(
    () => ({
      theme,
      preference,
      setPreference,
      setTheme: setPreference,
      isDark: theme === "dark",
      isLight: theme === "light",
      isSystem: preference === "system",
    }),
    [theme, preference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
