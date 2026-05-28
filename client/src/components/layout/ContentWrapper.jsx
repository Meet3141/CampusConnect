/**
 * ContentWrapper.jsx — Consistent horizontal padding for page body content
 *
 * Replaces ad-hoc `px-5 lg:px-6` patterns across page files.
 * Uses .cc-content-wrapper which reads --cc-page-padding-x from the design token system.
 *
 * Usage:
 *   <ContentWrapper>
 *     <Section .../>
 *     <DashboardGrid .../>
 *   </ContentWrapper>
 *
 *   <ContentWrapper as="section" className="stack-lg">
 *     ...
 *   </ContentWrapper>
 */
import { cn } from "../../utils/cn";

/**
 * @param {{
 *   as?: string,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function ContentWrapper({
  as: Tag = "div",
  className,
  children,
}) {
  return (
    <Tag className={cn("cc-content-wrapper", className)}>
      {children}
    </Tag>
  );
}
