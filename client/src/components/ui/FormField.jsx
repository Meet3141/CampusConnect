/**
 * FormField.jsx — Enhanced wrapper for form fields (Semantic Token Migration: Layer D)
 * - Label uses type-label semantic class
 * - Error state uses semantic error token
 * - Required asterisk uses semantic error token
 */
import React, { useId } from "react";
import { AlertCircle } from "lucide-react";

export default function FormField({ label, required, hint, error, className, children }) {
  const id = useId();

  const child =
    React.Children.count(children) === 1
      ? React.cloneElement(React.Children.only(children), {
          id: children.props?.id || id,
          "aria-invalid": error ? "true" : undefined,
          "aria-describedby": error ? `${id}-error` : undefined,
        })
      : children;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="type-label">
            {label}
            {required && (
              <span className="text-error ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
          {hint && (
            <span className="text-micro text-text-muted font-mono opacity-70">{hint}</span>
          )}
        </div>
      )}
      {child}
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-error text-caption"
          role="alert"
        >
          <AlertCircle size={12} className="shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
