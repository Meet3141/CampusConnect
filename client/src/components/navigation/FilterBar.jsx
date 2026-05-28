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
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                : "bg-white/[0.03] text-muted border-white/[0.07] hover:border-white/[0.14] hover:text-cc"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
