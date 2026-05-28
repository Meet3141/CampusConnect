/**
 * Button.jsx — Phase 4 rewrite
 * Variants: primary | secondary | outline | ghost | danger | success
 * Sizes: sm | md | lg
 * Features: loading state, iconLeft/iconRight slots, as prop
 */
import { cn } from "../../utils/cn";

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus focus-visible:ring-offset-transparent disabled:opacity-40 disabled:pointer-events-none select-none";

const VARIANTS = {
  /* Authority blue — uses brand semantic token, softer premium feel */
  primary:
    "bg-primary hover:bg-primary-hover active:bg-primary text-white shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/30",
  /* Secondary — surface hierarchy, no hard colour */
  secondary:
    "bg-cc-surface-weak hover:bg-cc-surface border border-cc-soft hover:border-cc-strong text-cc hover:-translate-y-px hover:shadow-sm active:translate-y-0",
  /* Outline — brand border/text, subtle hover fill */
  outline:
    "border border-primary-border hover:border-primary text-primary hover:bg-primary-soft hover:-translate-y-px transition-all",
  /* Ghost — minimal, only surface on hover */
  ghost:
    "text-cc-muted hover:text-cc hover:bg-surface-hover active:scale-[0.97] transition-all",
  /* Danger — error semantic token */
  danger:
    "bg-error/8 hover:bg-error/16 text-error border border-error/20 hover:border-error/40 transition-all",
  /* Success — success semantic token */
  success:
    "bg-success/8 hover:bg-success/16 text-success border border-success/20 hover:border-success/40 transition-all",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs h-7",
  md: "px-4 py-2 text-sm h-9",
  lg: "px-5 py-2.5 text-sm h-10",
};

/* Canonical spinner for button loading state */
function BtnSpinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * @param {{
 *   variant?: 'primary'|'secondary'|'outline'|'ghost'|'danger'|'success',
 *   size?: 'sm'|'md'|'lg',
 *   loading?: boolean,
 *   iconLeft?: React.ReactNode,
 *   iconRight?: React.ReactNode,
 *   as?: string|React.ElementType,
 *   className?: string,
 *   children?: React.ReactNode,
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconLeft,
  iconRight,
  as: Tag = "button",
  type = "button",
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <Tag
      type={Tag === "button" ? type : undefined}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, className)}
      {...props}
    >
      {loading ? (
        <>
          <BtnSpinner />
          {children}
        </>
      ) : (
        <>
          {iconLeft && <span className="shrink-0">{iconLeft}</span>}
          {children}
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </>
      )}
    </Tag>
  );
}