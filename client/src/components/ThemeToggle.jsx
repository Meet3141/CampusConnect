import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("cc_theme") || "dark";
    } catch (e) {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("cc_theme", theme);
    } catch (e) {}
  }, [theme]);

  return (
    <div className={className}>
      <button
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        title="Toggle theme"
        className="px-3 py-2 rounded-lg text-sm border border-transparent hover:border-cc-soft transition-all"
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}
