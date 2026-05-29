/**
 * Modal.jsx — Glass-blur modal with sub-components
 *
 * Usage:
 *   <Modal open={open} onClose={onClose} title="Edit Profile" size="md">
 *     <Modal.Body>...</Modal.Body>
 *     <Modal.Footer>
 *       <Button variant="ghost" onClick={onClose}>Cancel</Button>
 *       <Button variant="primary" loading={saving}>Save</Button>
 *     </Modal.Footer>
 *   </Modal>
 */
import { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";

const SIZES = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-2xl",
  full: "max-w-5xl",
};

export default function Modal({ open, onClose, title, size = "md", children, className }) {
  const panelRef = useRef(null);

  /* Body scroll lock */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Escape key */
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  /* Focus trap */
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first)?.focus();
      }
    };
    el.addEventListener("keydown", trap);
    first?.focus();
    return () => el.removeEventListener("keydown", trap);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-backdrop backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative z-10 w-full rounded-2xl border border-border-subtle bg-surface/95 backdrop-blur-xl shadow-2xl animate-slide-up overflow-hidden",
          SIZES[size] ?? SIZES.md,
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
            <h2 id="modal-title" className="text-heading-sm font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-surface-hover"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

Modal.Body = function ModalBody({ className, children }) {
  return <div className={cn("px-6 py-5 overflow-y-auto max-h-[70vh]", className)}>{children}</div>;
};

Modal.Footer = function ModalFooter({ className, children }) {
  return (
    <div className={cn("flex items-center justify-end gap-2 px-6 py-4 border-t border-border-subtle bg-surface-weak/60", className)}>
      {children}
    </div>
  );
};
