/**
 * Toast.jsx — Lightweight toast notification system
 * Features:
 *   - useToast() hook: toast(), success(), error(), info(), warning()
 *   - ToastContainer: fixed top-right placement, stacks up to 3
 *   - Auto-dismiss after 4s (configurable)
 *   - Manual dismiss
 *   - Entrance: animate-slide-in-right, exit: opacity fade
 *   - Semantic tokens — matches Alert variant system
 *
 * Setup (add once to App.jsx or root layout):
 *   import { ToastContainer } from "./components/feedback/Toast";
 *   <ToastContainer />
 *
 * Usage anywhere:
 *   import { useToast } from "./components/feedback/Toast";
 *   const { success, error } = useToast();
 *   success("Event created!");
 *   error("Failed to save.", { duration: 6000 });
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

/* ── Context ── */
const ToastCtx = createContext(null);

/* ── Toast styles — mirrors Alert semantic pattern ── */
const TOAST_STYLES = {
  success: { wrap: "bg-surface border-border-subtle",  Icon: CheckCircle2,  iconCls: "text-success"  },
  error:   { wrap: "bg-surface border-border-subtle",  Icon: AlertCircle,   iconCls: "text-error"    },
  warning: { wrap: "bg-surface border-border-subtle",  Icon: AlertTriangle, iconCls: "text-warning"  },
  info:    { wrap: "bg-surface border-border-subtle",  Icon: Info,          iconCls: "text-info"     },
  default: { wrap: "bg-surface border-border-subtle",  Icon: Info,          iconCls: "text-text-muted" },
};

/* ── Single Toast item ── */
function ToastItem({ id, type = "default", message, duration = 4000, onDismiss }) {
  const { wrap, Icon, iconCls } = TOAST_STYLES[type] ?? TOAST_STYLES.default;
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300); // wait for fade-out
  }, [id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 w-72 px-4 py-3 rounded-xl border shadow-[var(--cc-shadow-card)]",
        "transition-all duration-300",
        wrap,
        visible
          ? "opacity-100 translate-x-0 animate-slide-in-right"
          : "opacity-0 translate-x-4 pointer-events-none"
      )}
    >
      <Icon size={16} className={cn("shrink-0 mt-px", iconCls)} aria-hidden="true" />
      <p className="flex-1 min-w-0 text-sm text-text-primary leading-snug">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-text-muted hover:text-text-primary transition-colors rounded p-0.5"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ── Toast container — fixed top-right, max 3 visible ── */
export function ToastContainer() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.slice(-3).map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

/* ── Toast provider — wraps the app ── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "default", options = {}) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type, ...options }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ toasts, add, dismiss }}>
      {children}
      <ToastContainer />
    </ToastCtx.Provider>
  );
}

/* ── useToast hook — call anywhere inside ToastProvider ── */
export function useToast() {
  const ctx = useContext(ToastCtx);

  if (!ctx) {
    // Graceful no-op if called outside provider
    const noop = () => {};
    return { toast: noop, success: noop, error: noop, warning: noop, info: noop };
  }

  const { add } = ctx;

  return {
    /** Generic toast */
    toast:   (msg, opts) => add(msg, "default", opts),
    /** Success toast */
    success: (msg, opts) => add(msg, "success", opts),
    /** Error toast */
    error:   (msg, opts) => add(msg, "error",   opts),
    /** Warning toast */
    warning: (msg, opts) => add(msg, "warning", opts),
    /** Info toast */
    info:    (msg, opts) => add(msg, "info",    opts),
  };
}

/* Default export for convenience */
export default useToast;
