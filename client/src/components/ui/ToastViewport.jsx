import { useToast } from "../../context/ToastContext";

const TYPE_STYLES = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-cc",
  error: "border-red-500/30 bg-red-500/10 text-cc",
  info: "border-slate-500/30 bg-slate-500/10 text-cc",
};

const TYPE_LABELS = {
  success: "Success",
  error: "Error",
  info: "Info",
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${TYPE_STYLES[toast.type]}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-cc-muted">
              {TYPE_LABELS[toast.type]}
            </div>
            <div className="min-w-0 flex-1 text-sm leading-5 text-cc">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-cc-muted hover:text-cc transition-colors"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}