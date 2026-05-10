import React from "react";

export default function FormField({ label, required, hint, error, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] uppercase tracking-widest text-cc-muted font-medium">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[11px] text-cc-muted font-mono">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-red-400 text-[11px] mt-1.5">{error}</p>}
    </div>
  );
}
