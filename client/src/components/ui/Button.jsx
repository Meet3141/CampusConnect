const styles = {
  base:
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-40 disabled:pointer-events-none",
  variants: {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    secondary:
      "bg-cc-surface-weak hover:bg-cc-surface text-cc border border-cc-soft hover:border-cc-strong",
    ghost: "text-cc-muted hover:text-cc hover:bg-cc-surface",
    danger:
      "bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30",
  },
  sizes: {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  },
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}) {
  const variantClass = styles.variants[variant] || styles.variants.primary;
  const sizeClass = styles.sizes[size] || styles.sizes.md;

  return (
    <button
      type={type}
      className={`${styles.base} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    />
  );
}