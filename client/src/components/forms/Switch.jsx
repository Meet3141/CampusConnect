/**
 * Switch.jsx — Accessible toggle switch (replaces 3 raw button toggle patterns)
 *
 * Usage:
 *   <Switch label="Show on Volunteer Hub" checked={form.show} onChange={(val) => set(val)} />
 *   <Switch label="Dark mode" description="Applies across the app" checked={...} onChange={...} />
 */
import { cn } from "../../utils/cn";

/**
 * @param {{
 *   label?: string,
 *   description?: string,
 *   checked: boolean,
 *   onChange: (value: boolean) => void,
 *   disabled?: boolean,
 *   className?: string,
 * }} props
 */
export default function Switch({ label, description, checked, onChange, disabled, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {(label || description) && (
        <div className="min-w-0">
          {label && <p className="text-sm font-medium text-cc">{label}</p>}
          {description && <p className="text-[11px] text-muted mt-0.5">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-color-brand)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          checked ? "bg-[var(--cc-color-brand)]" : "bg-cc-surface border border-cc-soft",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}
