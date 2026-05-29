/**
 * Drawer.jsx — Side-panel off-canvas drawer
 *
 * Usage:
 *   <Drawer open={open} onClose={onClose} title="Filters" side="right" size="md">
 *     content
 *   </Drawer>
 */
import { useEffect } from "react";
import { cn } from "../../utils/cn";

const SIZES = { sm: "max-w-xs", md: "max-w-sm", lg: "max-w-md", xl: "max-w-lg" };

const SIDE_CLS = {
  left:  { panel: "left-0 h-full", enter: "translate-x-0", exit: "-translate-x-full" },
  right: { panel: "right-0 h-full", enter: "translate-x-0", exit: "translate-x-full" },
  bottom:{ panel: "bottom-0 w-full", enter: "translate-y-0", exit: "translate-y-full" },
};

export default function Drawer({ open, onClose, title, side = "right", size = "md", children, className }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  const s = SIDE_CLS[side] ?? SIDE_CLS.right;

  return (
    <div className={cn("fixed inset-0 z-overlay", !open && "pointer-events-none")}>
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-backdrop backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute flex flex-col bg-surface border-border-subtle shadow-2xl transition-transform duration-300",
          s.panel,
          side !== "bottom" && cn("w-full", SIZES[size]),
          side === "left" && "border-r",
          side === "right" && "border-l",
          side === "bottom" && "border-t rounded-t-2xl",
          open ? s.enter : s.exit,
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
            <h2 className="text-heading-sm font-semibold text-text-primary">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-primary transition-colors p-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
