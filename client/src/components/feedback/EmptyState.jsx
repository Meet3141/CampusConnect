/**
 * EmptyState.jsx — Friendly empty/zero-data state
 * Semantic Token Migration: Layer B — semantic tokens replace raw colour values.
 *
 * Usage:
 *   import { Building2 } from "lucide-react";
 *   <EmptyState icon={Building2} title="No clubs yet" description="Join a club to get started." />
 *   <EmptyState icon="📭" title="No events" action={{ label: "Browse Events", onClick: ... }} />
 *   <EmptyState variant="search" searchQuery="react native" />
 */
import React from "react";
import { Search, AlertTriangle, Inbox } from "lucide-react";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";

/**
 * @param {{
 *   icon?: React.ComponentType<{size?: number}> | string,
 *   title?: string,
 *   description?: string,
 *   action?: { label: string, onClick: () => void, variant?: string },
 *   secondaryAction?: { label: string, onClick: () => void },
 *   variant?: 'default'|'search'|'error',
 *   searchQuery?: string,
 *   className?: string,
 *   compact?: boolean,
 * }} props
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant  = "default",
  searchQuery,
  className,
  compact  = false,
}) {
  const resolvedIcon  = icon ?? (variant === "search" ? Search : variant === "error" ? AlertTriangle : Inbox);
  const resolvedTitle =
    title ??
    (variant === "search"
      ? `No results for "${searchQuery}"`
      : variant === "error"
      ? "Something went wrong"
      : "Nothing here yet");

  const resolvedDescription =
    description ??
    (variant === "search"
      ? "Try different keywords or clear your filters."
      : variant === "error"
      ? "Please try again or contact support if the problem persists."
      : undefined);

  /* ── Icon container background — semantic tokens ── */
  const iconBg = {
    default: "bg-primary-soft",
    search:  "bg-surface-secondary",
    error:   "bg-error/8",
  }[variant] ?? "bg-primary-soft";

  /* ── Icon colour — semantic tokens ── */
  const iconColor = {
    default: "text-primary",
    search:  "text-text-muted",
    error:   "text-error",
  }[variant] ?? "text-primary";

  /* ── Ring — semantic border tokens ── */
  const iconRing = {
    default: "ring-primary-border",
    search:  "ring-border-subtle",
    error:   "ring-error/20",
  }[variant] ?? "ring-primary-border";

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center gap-4 rounded-2xl border border-dashed",
        "border-border-subtle animate-fade-scale",
        compact ? "py-8 px-4" : "py-14 px-8",
        className
      )}
    >
      {/* Icon container */}
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl mb-1 ring-1 ring-inset",
          compact ? "w-14 h-14" : "w-20 h-20",
          iconBg,
          iconRing
        )}
        aria-hidden="true"
      >
        {typeof resolvedIcon === "function" ||
        (resolvedIcon && typeof resolvedIcon === "object" && "render" in resolvedIcon)
          ? React.createElement(resolvedIcon, {
              size:      compact ? 24 : 36,
              className: iconColor,
            })
          : (
            <span className={compact ? "text-3xl" : "text-4xl"}>
              {resolvedIcon}
            </span>
          )}
      </span>

      {/* Text */}
      <div className="space-y-1.5 max-w-xs">
        <p className={cn("font-semibold text-text-primary", compact ? "text-body-sm" : "text-heading-sm")}>
          {resolvedTitle}
        </p>
        {resolvedDescription && (
          <p className="text-caption text-text-muted leading-relaxed">
            {resolvedDescription}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
          {action && (
            <Button variant={action.variant || "primary"} size={compact ? "sm" : "md"} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size={compact ? "sm" : "md"} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
