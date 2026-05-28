/**
 * ConfirmDialog.jsx — Glass-blur confirmation modal for destructive actions
 *
 * Usage:
 *   <ConfirmDialog
 *     open={confirm}
 *     title="Delete Event?"
 *     description="This cannot be undone."
 *     confirmLabel="Delete"
 *     variant="danger"
 *     onConfirm={handleDelete}
 *     onCancel={() => setConfirm(false)}
 *     loading={deleting}
 *   />
 */
import { useEffect } from "react";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) {
  /* Lock body scroll while open */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Escape key */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onCancel?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className={cn(
        "relative z-10 w-full max-w-sm rounded-2xl border border-cc-soft bg-cc-surface/95 backdrop-blur-xl p-6 shadow-2xl",
        "animate-slide-up"
      )}>
        <h2 id="confirm-title" className="text-heading-sm font-semibold text-cc mb-2">{title}</h2>
        {description && <p className="text-body-sm text-muted mb-5">{description}</p>}
        <div className="flex items-center justify-end gap-2 mt-5">
          <Button variant="ghost" size="md" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="md" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
