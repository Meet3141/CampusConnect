import React from "react";

const STATUS_CONFIG = {
  normal: {
    label: "Normal",
    color: "var(--cc-color-success)",
    bg: "var(--cc-color-success-soft)",
    risk: "Low",
    icon: "🟢",
  },
  warning: {
    label: "Warning",
    color: "var(--cc-color-warning)",
    bg: "var(--cc-color-warning-soft)",
    risk: "Medium",
    icon: "🟡",
  },
  review: {
    label: "Review",
    color: "var(--cc-color-brand)",
    bg: "var(--cc-color-surface-brand)",
    risk: "High",
    icon: "🟠",
  },
  blocked: {
    label: "Blocked",
    color: "var(--cc-color-danger)",
    bg: "var(--cc-color-danger-soft)",
    risk: "Critical",
    icon: "🔴",
  },
  probation: {
    label: "Probation",
    color: "var(--cc-color-warning)",
    bg: "var(--cc-color-warning-soft)",
    risk: "High",
    icon: "🟣",
  },
};

export default function GovernanceStatusBadge({ status = "normal", compact = false, showTooltip = true, className = "" }) {
  const config = STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.normal;
  
  const badgeContent = (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.color,
      }}
    >
      {config.icon} {!compact && config.label}
    </span>
  );

  if (showTooltip) {
    return (
      <div className="relative group inline-block">
        {badgeContent}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--cc-color-surface-elevated)] border border-[var(--cc-color-border-strong)] rounded-lg shadow-xl text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <p className="font-semibold" style={{ color: config.color }}>{config.label} Status</p>
          <p className="text-[var(--cc-color-text-muted)] mt-0.5">Risk Level: <span className="font-mono text-[var(--cc-color-text-primary)]">{config.risk}</span></p>
        </div>
      </div>
    );
  }

  return badgeContent;
}
