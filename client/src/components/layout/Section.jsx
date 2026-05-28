/**
 * Section.jsx — Global layout primitive
 * Standard content section with an optional header row (title + count badge + link action).
 *
 * Replaces the dashboard-local Section component.
 * All pages should import this from components/layout, not from features/dashboard/ui.
 *
 * Usage:
 *   <Section title="My Clubs" count={5} linkLabel="Browse all →" onLink={() => navigate('/clubs')}>
 *     {children}
 *   </Section>
 *
 *   <Section>  {/* header-less section, just adds the cc-section gap rhythm *\/}
 *     {children}
 *   </Section>
 */
import Button from "../ui/Button";

/**
 * @param {{
 *   title?: string,
 *   count?: number,
 *   linkLabel?: string,
 *   onLink?: () => void,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function Section({ title, count, linkLabel, onLink, children, className = "" }) {
  const hasHeader = title || (linkLabel && onLink);

  return (
    <div className={`cc-section ${className}`.trim()}>
      {hasHeader && (
        <div className="cc-section-header">
          <div className="cc-section-title-row">
            {title && (
              <h2 className="text-heading-sm font-bold text-cc">{title}</h2>
            )}
            {typeof count === "number" && count > 0 && (
              <span className="text-micro font-mono tabular-nums px-1.5 py-px bg-cc-surface-weak text-muted rounded-md">
                {count}
              </span>
            )}
          </div>

          {linkLabel && onLink && (
            <Button variant="ghost" size="sm" onClick={onLink} className="text-caption text-accent">
              {linkLabel}
            </Button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
