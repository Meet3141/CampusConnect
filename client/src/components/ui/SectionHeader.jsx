/**
 * SectionHeader.jsx — Reusable section heading primitive
 * Replaces duplicated title + count + action row patterns across 8+ pages.
 *
 * Usage:
 *   <SectionHeader title="My Clubs" count={5} />
 *   <SectionHeader title="Events" action={{ label: "Browse all →", onClick: () => navigate('/events') }} />
 *   <SectionHeader title="Analytics" subtitle="Last 30 days" icon={BarChart2} />
 *   <SectionHeader as="h3" title="Recent Activity" compact />
 */
import { cn } from "../../utils/cn";
import Button from "./Button";

/**
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   count?: number,
 *   icon?: React.ComponentType<{ size?: number, className?: string }>,
 *   action?: { label: string, onClick: () => void },
 *   as?: string,
 *   compact?: boolean,
 *   className?: string,
 * }} props
 */
export default function SectionHeader({
  title,
  subtitle,
  count,
  icon: Icon,
  action,
  as: Tag = "div",
  compact = false,
  className,
}) {
  return (
    <Tag
      className={cn(
        "flex items-center justify-between gap-3 min-h-[28px]",
        compact ? "mb-2" : "mb-3",
        className
      )}
    >
      {/* Left: icon + title + subtitle + count */}
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <Icon size={compact ? 14 : 16} className="text-text-muted shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <h2
            className={cn(
              "font-semibold text-text-primary leading-tight truncate",
              compact ? "text-[13px]" : "text-[14px]"
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="type-caption mt-px truncate">{subtitle}</p>
          )}
        </div>
        {typeof count === "number" && count > 0 && (
          <span className="inline-flex items-center px-1.5 py-px bg-surface-secondary border border-border-subtle rounded-md text-[10px] font-mono tabular-nums text-text-muted shrink-0">
            {count}
          </span>
        )}
      </div>

      {/* Right: optional action */}
      {action && (
        <Button
          variant="ghost"
          size="sm"
          onClick={action.onClick}
          className="text-text-muted hover:text-text-primary shrink-0 text-[11px]"
        >
          {action.label}
        </Button>
      )}
    </Tag>
  );
}
