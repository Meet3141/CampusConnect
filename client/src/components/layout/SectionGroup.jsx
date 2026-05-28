/**
 * SectionGroup.jsx — Grouped surface wrapper for dashboard widget areas
 *
 * Wraps related sections in a subtle tinted surface to reduce floating-card
 * feeling and create visual grouping without heavy borders.
 *
 * Usage:
 *   <SectionGroup title="Campus Pulse" subtitle="Your clubs & recommendations">
 *     <Section title="My Clubs" ...>...</Section>
 *     <RecommendedRow .../>
 *   </SectionGroup>
 *
 *   <SectionGroup tinted={false}>  ← transparent, no background
 *     ...
 *   </SectionGroup>
 */
import { cn } from "../../utils/cn";

/**
 * @param {{
 *   title?: string,
 *   subtitle?: string,
 *   tinted?: boolean,
 *   as?: string,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function SectionGroup({
  title,
  subtitle,
  tinted   = true,
  as: Tag  = "div",
  className,
  children,
}) {
  return (
    <Tag
      className={cn(
        "stack-lg",
        tinted && "cc-section-group",
        className
      )}
    >
      {/* Optional group header — only rendered if title given */}
      {title && (
        <div className="hstack-sm justify-between">
          <div className="stack-xs">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted">
              {title}
            </p>
            {subtitle && (
              <p className="type-caption">{subtitle}</p>
            )}
          </div>
        </div>
      )}
      {children}
    </Tag>
  );
}
