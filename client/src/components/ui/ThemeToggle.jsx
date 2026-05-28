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
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-transparent hover:border-cc-soft hover:bg-cc-surface-weak transition-all"
      >
        {theme === "dark"
          ? <Moon size={16} className="text-slate-400 hover:text-white transition-colors" />
          : <Sun  size={24} className="text-amber-400" />}
      </button>
    </div>
  );
}
