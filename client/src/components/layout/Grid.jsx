/**
 * Grid.jsx
 * Responsive grid with tokenized column counts and gaps.
 *
 * Usage:
 *   <Grid cols={3}>...</Grid>            → 3-col, collapses on tablet/mobile
 *   <Grid cols="auto">...</Grid>         → auto-fill ~280px columns
 *   <Grid cols="auto-sm">...</Grid>      → auto-fill ~220px columns (club mini cards)
 *   <Grid cols="auto-lg">...</Grid>      → auto-fill ~340px columns
 */

const COL_MAP = {
  2:       "cc-grid-2",
  3:       "cc-grid-3",
  4:       "cc-grid-4",
  "auto-sm": "cc-grid-auto-sm",
  auto:    "cc-grid-auto",
  "auto-lg": "cc-grid-auto-lg",
};

/**
 * @param {{ cols?: 2|3|4|'auto'|'auto-sm'|'auto-lg', as?: string, className?: string, children: React.ReactNode }} props
 */
export default function Grid({
  cols = "auto",
  as: Tag = "div",
  className = "",
  children,
}) {
  const base = COL_MAP[cols] ?? "cc-grid";

  return (
    <Tag className={`${base} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
