/**
 * Input.jsx — Shared input field with label, error, hint, prefix/suffix slots
 * Semantic Token Migration: Layer A — zero raw dark-only colour values.
 *
 * Usage:
 *   <Input label="Event Title" placeholder="..." required error={errors.title} />
 *   <Input prefix={<Search size={14} />} placeholder="Search…" />
 *   <Input size="sm" suffix={<span className="text-muted">/</span>} />
 */
import React, { useId } from "react";
import { cn } from "../../utils/cn";
import { AlertCircle } from "lucide-react";

/* ── Base: semantic surface + border tokens, no raw dark opacity hacks ── */
const INPUT_BASE = [
  "input-standard w-full rounded-xl text-sm transition-all duration-150 focus:outline-none",
  "bg-white border border-border-subtle",
  "text-brand placeholder:text-text-muted",
  "focus:border-border-focus focus:ring-2 focus:ring-border-focus/20",
].join(" ");

const SIZE_CLS = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3 text-sm",
};

/* Error state — uses semantic error token, theme-agnostic */
const ERROR_CLS = "border-error/40 bg-error/5 focus:border-error focus:ring-error/15";

/**
 * @param {{
 *   label?: string,
 *   hint?: string,
 *   error?: string,
 *   required?: boolean,
 *   prefix?: React.ReactNode,
 *   suffix?: React.ReactNode,
 *   size?: 'sm'|'md'|'lg',
 *   className?: string,
 * } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
const Input = React.forwardRef(function Input(
  { label, hint, error, required, prefix, suffix, size = "md", className, id: idProp, ...props },
  ref
) {
  const autoId = useId();
  const id     = idProp || autoId;
  const descId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const hasAffix = prefix || suffix;

  const inputEl = (
    <input
      ref={ref}
      id={id}
      required={required}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={descId}
      className={cn(
        INPUT_BASE,
        SIZE_CLS[size] ?? SIZE_CLS.md,
        error ? ERROR_CLS : "",
        prefix && "pl-9",
        suffix && "pr-9",
        className
      )}
      {...props}
    />
  );

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
      {hasAffix ? (
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center">
              {prefix}
            </span>
          )}
          {inputEl}
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted flex items-center">
              {suffix}
            </span>
          )}
        </div>
      ) : inputEl}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-error text-[11px]" role="alert">
          <AlertCircle size={11} className="shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
