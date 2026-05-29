import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, setPreference } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className={className}>
      <button
        onClick={() => setPreference(nextTheme)}
        title={`Switch to ${nextTheme} mode`}
        aria-label={`Switch to ${nextTheme} mode`}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border-subtle hover:border-border-hover hover:bg-surface-hover transition-all"
      >
        {theme === "dark"
          ? <Moon size={16} className="text-text-muted hover:text-text-primary transition-colors" />
          : <Sun  size={22} className="text-warning" />}
      </button>
    </div>
  );
}
