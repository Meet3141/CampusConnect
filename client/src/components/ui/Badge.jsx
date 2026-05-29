/**
 * Badge.jsx — Global status/category badge (Semantic Token Migration: Layer D)
 * All variants now use semantic CSS tokens via Tailwind mappings.
 * Dark/light theme compatible — no raw dark-only Tailwind colours.
 *
 * Usage:
 *   <Badge variant="upcoming" />
 *   <Badge variant="success" dot />
 *   <Badge size="sm">Custom</Badge>
 */
import { cn } from "../../utils/cn";

const VARIANTS = {
  /* ── Event statuses — semantic feedback tokens ── */
  upcoming:         "bg-primary-soft   text-primary   border-primary-border",
  ongoing:          "bg-success/10     text-success    border-success/20",
  completed:        "bg-surface-weak   text-text-muted border-border-subtle",
  cancelled:        "bg-error/10       text-error      border-error/20",
  draft:            "bg-surface-weak   text-text-muted border-border-subtle",
  pending_approval: "bg-warning/10     text-warning    border-warning/20",
  pending:          "bg-warning/10     text-warning    border-warning/20",

  /* ── Member statuses ── */
  active:           "bg-success/10     text-success    border-success/20",
  rejected:         "bg-error/10       text-error      border-error/20",
  blocked:          "bg-error/8        text-error      border-error/15",

  /* ── Semantic ── */
  success:          "bg-success/10     text-success    border-success/20",
  warning:          "bg-warning/10     text-warning    border-warning/20",
  error:            "bg-error/10       text-error      border-error/20",
  info:             "bg-info/10        text-info        border-info/20",

  /* ── Neutral ── */
  default:          "bg-surface-weak   text-text-muted border-border-subtle",

  /* ── Category accents — kept distinct for discoverability ── */
  technical:        "bg-accent-soft    text-accent     border-accent-border",
  cultural:         "bg-category-cultural-soft text-category-cultural border-category-cultural",
  sports:           "bg-success/10     text-success    border-success/20",
  academic:         "bg-warning/10     text-warning    border-warning/20",
  arts:             "bg-category-arts-soft text-category-arts border-category-arts",
  hackathon:        "bg-primary-soft   text-primary   border-primary-border",
  workshop:         "bg-category-workshop-soft text-category-workshop border-category-workshop",
  webinar:          "bg-accent-soft    text-accent     border-accent-border",
  meeting:          "bg-surface-weak   text-text-muted border-border-subtle",
  conference:       "bg-warning/10     text-warning    border-warning/20",
  competition:      "bg-error/10       text-error      border-error/20",
  other:            "bg-surface-weak   text-text-muted border-border-subtle",
};

const SIZES = {
  xs: "text-[9px] px-1.5 py-px",
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-0.5",
};

/* Dot colours — semantic where available, specific hex only for category accents */
const DOT_COLORS = {
  upcoming:         "bg-primary",
  ongoing:          "bg-success",
  active:           "bg-success",
  success:          "bg-success",
  warning:          "bg-warning",
  pending:          "bg-warning",
  pending_approval: "bg-warning",
  error:            "bg-error",
  cancelled:        "bg-error",
  rejected:         "bg-error",
  info:             "bg-info",
  technical:        "bg-accent",
  webinar:          "bg-accent",
  hackathon:        "bg-primary",
  cultural:         "bg-category-cultural",
  arts:             "bg-category-arts",
  workshop:         "bg-category-workshop",
  conference:       "bg-warning",
  competition:      "bg-error",
  default:          "bg-text-muted",
};

/**
 * @param {{
 *   variant?: keyof VARIANTS,
 *   size?: 'xs'|'sm'|'md',
 *   dot?: boolean,
 *   className?: string,
 *   children?: React.ReactNode,
 * }} props
 */
export default function Badge({
  variant = "default",
  size = "sm",
  dot = false,
  className,
  children,
}) {
  const label = children ?? variant.replace("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold capitalize",
        VARIANTS[variant] ?? VARIANTS.default,
        SIZES[size] ?? SIZES.sm,
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT_COLORS[variant] ?? "bg-text-muted")}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

/* Convenience export for any page that reads raw variant classes */
export const BADGE_VARIANTS = VARIANTS;
