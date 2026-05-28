/**
 * Select.jsx — Styled select with label, error, required indicator
 * Semantic Token Migration: Layer A — zero raw dark-only colour values.
 *
 * Usage:
 *   <Select label="Club" required error={errors.clubId}>
 *     <option value="">Select a club…</option>
 *     {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
 *   </Select>
 */
import React, { useId } from "react";
import { cn } from "../../utils/cn";
import { AlertCircle } from "lucide-react";

const BASE = [
  "w-full rounded-xl px-4 py-2.5 text-sm cursor-pointer",
  "bg-surface-weak border border-border-subtle",
  "text-text-primary",
  "focus:outline-none focus:bg-surface focus:border-border-focus focus:ring-2 focus:ring-border-focus/20",
  "transition-all duration-150",
  /* Select arrow — uses theme-agnostic opacity instead of dark colour */
  "appearance-none",
].join(" ");

const ERROR_CLS = "border-error/40 bg-error/5 focus:border-error focus:ring-error/15";

const Select = React.forwardRef(function Select(
  { label, hint, error, required, className, id: idProp, children, ...props },
  ref
) {
  const autoId = useId();
  const id     = idProp || autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="type-label">
          {label}
          {required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
          {hint && (
            <span className="ml-2 normal-case tracking-normal text-text-muted font-normal font-mono text-[10px]">
              {hint}
            </span>
          )}
        </label>
      )}
      {/* Wrapper for custom chevron */}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(BASE, error ? ERROR_CLS : "", "pr-9", className)}
          {...props}
        >
          {children}
        </select>
        {/* Semantic chevron icon — replaces browser default arrow */}
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-error text-[11px]" role="alert">
          <AlertCircle size={11} className="shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
