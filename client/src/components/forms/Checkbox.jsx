/**
 * Checkbox.jsx — Accessible styled checkbox
 *
 * Usage:
 *   <Checkbox label="Count Warnings" checked={val} onChange={(e) => set(e.target.checked)} />
 *   <Checkbox label="Required field" required error="Must accept" />
 */
import React, { useId } from "react";
import { cn } from "../../utils/cn";

const Checkbox = React.forwardRef(function Checkbox(
  { label, error, required, className, id: idProp, ...props },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-3 text-sm text-cc cursor-pointer group select-none",
          props.disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            required={required}
            aria-invalid={error ? "true" : undefined}
            className="peer sr-only"
            {...props}
          />
          {/* Custom checkbox visual */}
          <div className={cn(
            "w-4 h-4 rounded flex items-center justify-center border transition-all duration-150",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/40 peer-focus-visible:ring-offset-1",
            props.checked
              ? "bg-indigo-600 border-indigo-600"
              : "bg-white/[0.04] border-white/[0.15] group-hover:border-indigo-500/50"
          )}>
            {props.checked && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {error && <p className="text-red-400 text-[11px] ml-7">{error}</p>}
    </div>
  );
});

export default Checkbox;
