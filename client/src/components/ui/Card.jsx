/**
 * Card.jsx — Unified card primitive (Semantic Token Migration: Layer D)
 * All variants now consume semantic utility classes and CSS tokens.
 * Zero raw Tailwind colour classes.
 *
 * Usage:
 *   <Card>...</Card>
 *   <Card variant="interactive" onClick={...}>...</Card>
 *   <Card variant="elevated" padding="lg">
 *     <Card.Header title="My Card" action={<Button>Edit</Button>} />
 *     <Card.Body>content</Card.Body>
 *     <Card.Footer>footer</Card.Footer>
 *   </Card>
 */
import { cn } from "../../utils/cn";

const VARIANTS = {
  /* depth-1 surface — primary card */
  default:     "surface-primary",
  /* depth-1 + explicit soft shadow */
  elevated:    "surface-primary shadow-soft",
  /* interactive-card: tiny elevation shift on hover */
  interactive: "surface-primary interactive-card",
  /* analytics widget: elevated analysis surface */
  analytics:   "widget-analytics",
  /* compact stat display surface */
  stat:        "widget-stat",
  /* flat activity stream surface */
  activity:    "widget-activity",
  /* section grouping tint, no border */
  grouped:     "surface-grouped",
  /* secondary surface with visible border */
  secondary:   "surface-secondary",
  /* minimal: no shadow, just border */
  compact:     "bg-surface-weak border border-border-subtle rounded-lg",
};

const PADDING = {
  none: "",
  xs:   "p-3",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6",
  xl:   "p-8",
};

function Card({
  variant = "default",
  padding = "md",
  as: Tag = "div",
  className,
  children,
  hoverable = false,
  animateIn = false,
  staggerIndex = 0,
  ...props
}) {
  /* hoverable on non-interactive variants: add card-lift manually */
  const hoverCls =
    hoverable && variant !== "interactive"
      ? "interactive-card"
      : "";

  return (
    <Tag
      className={cn(
        "overflow-hidden",
        VARIANTS[variant] ?? VARIANTS.default,
        PADDING[padding] ?? PADDING.md,
        hoverCls,
        animateIn && "animate-pop-in",
        className
      )}
      style={animateIn ? { animationDelay: `${staggerIndex * 55}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}

Card.Header = function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-4", className)}>
      <div className="min-w-0">
        {title    && <h3 className="type-heading truncate">{title}</h3>}
        {subtitle && <p  className="type-caption mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

Card.Body = function CardBody({ className, children }) {
  return <div className={cn("", className)}>{children}</div>;
};

Card.Footer = function CardFooter({ className, children }) {
  return (
    <div className={cn(
      "flex items-center justify-end gap-2 mt-5 pt-4 border-t border-border-subtle",
      className
    )}>
      {children}
    </div>
  );
};

/* Divider inside a card body — semantic token border */
Card.Divider = function CardDivider({ className }) {
  return <hr className={cn("border-border-subtle my-4", className)} />;
};

export default Card;
