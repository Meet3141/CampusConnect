/**
 * Divider.jsx — Horizontal/vertical divider with optional label
 *
 * Usage:
 *   <Divider />
 *   <Divider label="or" />
 *   <Divider vertical className="h-5" />
 */
import { cn } from "../../utils/cn";

export default function Divider({ label, vertical = false, className }) {
  if (vertical) {
    return (
      <span className={cn("inline-block w-px bg-cc-border-soft self-stretch", className)} aria-hidden="true" />
    );
  }

  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)} role="separator">
        <span className="flex-1 h-px bg-cc-border-soft" />
        <span className="text-caption text-muted shrink-0">{label}</span>
        <span className="flex-1 h-px bg-cc-border-soft" />
      </div>
    );
  }

  return <hr className={cn("border-0 border-t border-cc-soft", className)} aria-hidden="true" />;
}
