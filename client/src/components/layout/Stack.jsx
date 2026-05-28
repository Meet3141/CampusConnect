/**
 * Stack.jsx
 * Vertical (or horizontal) stack with tokenized gap.
 *
 * Usage:
 *   <Stack gap="md">...</Stack>         → flex-col, gap-4
 *   <Stack gap="lg" horizontal>...</Stack> → flex-row items-center, gap-6
 *   <Stack as="ul" gap="sm">...</Stack>
 */

const GAP_MAP = {
  xs: "stack-xs",
  sm: "stack-sm",
  md: "stack-md",
  lg: "stack-lg",
  xl: "stack-xl",
};

const H_GAP_MAP = {
  xs: "hstack-xs",
  sm: "hstack-sm",
  md: "hstack-md",
  lg: "hstack-lg",
};

/**
 * @param {{ gap?: 'xs'|'sm'|'md'|'lg'|'xl', horizontal?: boolean, as?: string, className?: string, children: React.ReactNode }} props
 */
export default function Stack({
  gap = "md",
  horizontal = false,
  as: Tag = "div",
  className = "",
  children,
}) {
  const map  = horizontal ? H_GAP_MAP : GAP_MAP;
  const base = map[gap] ?? (horizontal ? "hstack-md" : "stack-md");

  return (
    <Tag className={`${base} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
