export const STATUS_STYLE = {
  upcoming:         "bg-[var(--cc-color-surface-brand)] text-[var(--cc-color-brand)] border-[var(--cc-color-brand)]",
  ongoing:          "bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border-[var(--cc-color-success)]",
  completed:        "bg-[var(--cc-color-surface-elevated)] text-[var(--cc-color-text-muted)] border-[var(--cc-color-border)]",
  cancelled:        "bg-[var(--cc-color-danger-soft)] text-[var(--cc-color-danger)] border-[var(--cc-color-danger)]",
  draft:            "bg-[var(--cc-color-background)] text-[var(--cc-color-text-muted)] border-[var(--cc-color-border)]",
  pending_approval: "bg-[var(--cc-color-warning-soft)] text-[var(--cc-color-warning)] border-[var(--cc-color-warning)]",
};

export const CATEGORY_ACCENT = {
  technical: "border-l-cyan-500",
  cultural:  "border-l-purple-500",
  sports:    "border-l-emerald-500",
  academic:  "border-l-amber-500",
  arts:      "border-l-rose-500",
  other:     "border-l-slate-500",
};