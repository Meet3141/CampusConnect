/**
 * FilterBar.jsx — Reusable filter pill row
 * Replaces duplicated filter pill patterns in Events, ExternalEvents, ClubList, etc.
 *
 * Usage:
 *   <FilterBar
 *     filters={["All", "upcoming", "ongoing", "completed"]}
 *     value={filter}
 *     onChange={setFilter}
 *   />
 *   // With custom labels:
 *   <FilterBar
 *     filters={[
 *       { value: "all", label: "All" },
 *       { value: "upcoming", label: "Upcoming" },
 *     ]}
 *     value={filter}
 *     onChange={setFilter}
 *   />
 */
import { cn } from "../../utils/cn";

export default function FilterBar({ filters = [], value, onChange, className }) {
  return (
    <div className={cn("flex gap-1.5 flex-wrap", className)} role="group" aria-label="Filter options">
      {filters.map((f) => {
        const isObj = typeof f === "object";
        const val   = isObj ? f.value : f;
        const label = isObj ? f.label : f;
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(val)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition-all duration-150 border",
              active
                ? "bg-[var(--cc-color-brand)] text-[var(--cc-color-on-brand)] border-[var(--cc-color-brand)] shadow-sm shadow-[var(--cc-color-brand)]/20"
                : "bg-white-03 text-muted border-white/7 hover:border-white/14 hover:text-cc"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
