/**
 * Alert.jsx — Inline alert banner for form errors, success messages
 * Semantic Token Migration: Layer B — semantic tokens matching Badge pattern.
 * Replaces hardcoded bg-red-950/30 border-red-900/50 patterns (dark-only).
 *
 * Usage:
 *   <Alert variant="error" title="Failed to create event" />
 *   <Alert variant="success" dismissible onDismiss={() => setOpen(false)}>
 *     Event created successfully!
 *   </Alert>
 *   <Alert variant="warning" title="Pending approval" description="Submitted for review." />
 */
import { cn } from "../../utils/cn";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

/* Semantic token pattern — mirrors Badge variant system */
const STYLES = {
  error:   {
    wrap: "bg-error/8 border-error/20 text-error",
    Icon: AlertCircle,
  },
  success: {
    wrap: "bg-success/8 border-success/20 text-success",
    Icon: CheckCircle2,
  },
  warning: {
    wrap: "bg-warning/8 border-warning/20 text-warning",
    Icon: AlertTriangle,
  },
  info:    {
    wrap: "bg-info/8 border-info/20 text-info",
    Icon: Info,
  },
};

/**
 * @param {{
 *   variant?: 'error'|'success'|'warning'|'info',
 *   title?: string,
 *   description?: string,
 *   children?: React.ReactNode,
 *   dismissible?: boolean,
 *   onDismiss?: () => void,
 *   className?: string,
 * }} props
 */
export default function Alert({
  variant = "error",
  title,
  description,
  children,
  dismissible,
  onDismiss,
  className,
}) {
  const { wrap, Icon } = STYLES[variant] ?? STYLES.error;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        wrap,
        className
      )}
    >
      {/* Lucide icon — consistent with FormField, Input error pattern */}
      <Icon size={16} className="shrink-0 mt-px opacity-90" aria-hidden="true" />

      <div className="flex-1 min-w-0">
        {title       && <p className="font-semibold leading-snug">{title}</p>}
        {description && <p className="text-[12px] opacity-80 mt-0.5 leading-relaxed">{description}</p>}
        {children    && <div className="mt-1">{children}</div>}
      </div>

      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
