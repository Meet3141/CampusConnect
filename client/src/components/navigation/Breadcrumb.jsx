/**
 * Breadcrumb.jsx — Page breadcrumb trail
 *
 * Usage:
 *   <Breadcrumb items={["Dashboard", "Clubs"]} />
 *   <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, "Clubs"]} />
 */
import { cn } from "../../utils/cn";

export default function Breadcrumb({ items = [], className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 flex-wrap", className)}>
      {items.map((item, i) => {
        const isObj = typeof item === "object";
        const label = isObj ? item.label : item;
        const href  = isObj ? item.href  : null;
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-cc-muted text-[11px] select-none" aria-hidden="true">
                /
              </span>
            )}
            {href && !isLast ? (
              <a
                href={href}
                className="text-[11px] text-cc-muted hover:text-cc transition-colors font-mono tracking-widest uppercase"
              >
                {label}
              </a>
            ) : (
              <span
                className={cn(
                  "text-[11px] font-mono tracking-widest uppercase",
                  isLast ? "text-muted" : "text-cc-muted"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
