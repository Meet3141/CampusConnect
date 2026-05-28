/**
 * PageContainer.jsx
 * Provides consistent max-width + horizontal padding for page content areas.
 *
 * Usage:
 *   <PageContainer>          → 1280px content width
 *   <PageContainer wide>     → 1440px dashboard/data width
 *   <PageContainer reading>  → 720px prose width
 *   <PageContainer inset>    → full-width with padding only (no max-width cap)
 */

/**
 * @param {{ wide?: boolean, reading?: boolean, inset?: boolean, as?: string, className?: string, children: React.ReactNode }} props
 */
export default function PageContainer({
  wide = false,
  reading = false,
  inset = false,
  as: Tag = "div",
  className = "",
  children,
}) {
  let cls = "cc-page";
  if (wide)    cls = "cc-page-wide";
  if (reading) cls = "cc-page-reading";
  if (inset)   cls = "cc-page-inset";

  return (
    <Tag className={`${cls} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
