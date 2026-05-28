/**
 * Textarea.jsx — Shared textarea field (same API as Input)
 * Semantic Token Migration: Layer A — zero raw dark-only colour values.
 *
 * Usage:
 *   <Textarea label="Description" required error={errors.desc} rows={4} />
 *   <Textarea autoResize placeholder="Write something…" />
 */
import React, { useId, useEffect, useRef, useCallback } from "react";
import { cn } from "../../utils/cn";
import { AlertCircle } from "lucide-react";

const BASE = [
  "w-full rounded-xl text-sm transition-all duration-150 focus:outline-none resize-none",
  "bg-surface-weak border border-border-subtle",
  "text-text-primary placeholder:text-text-muted",
  "focus:bg-surface focus:border-border-focus focus:ring-2 focus:ring-border-focus/20",
].join(" ");

const ERROR_CLS = "border-error/40 bg-error/5 focus:border-error focus:ring-error/15";

const Textarea = React.forwardRef(function Textarea(
  { label, hint, error, required, size = "md", autoResize = false, className, id: idProp, rows = 4, onChange, ...props },
  ref
) {
  const autoId   = useId();
  const id       = idProp || autoId;
  const innerRef = useRef(null);

  const combinedRef = (node) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const resize = useCallback(() => {
    const el = innerRef.current;
    if (el && autoResize) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [autoResize]);

  useEffect(() => { resize(); }, [resize]);

  const handleChange = (e) => {
    resize();
    onChange?.(e);
  };

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
      <textarea
        ref={combinedRef}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={handleChange}
        className={cn(
          BASE,
          size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
          error ? ERROR_CLS : "",
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-error text-[11px]" role="alert">
          <AlertCircle size={11} className="shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

export default Textarea;
