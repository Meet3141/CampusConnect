/**
 * SplitLayout.jsx — Semantic two-pane layout with adaptive collapse
 *
 * Variants:
 *   "equal"  → 1fr : 1fr  (50/50 split)
 *   "chat"   → 3fr : 2fr  (60/40 split — conversation dominant)
 *   "aside"  → 1fr : 280px (main content + fixed aside)
 *
 * All variants collapse to a single column at their breakpoint.
 * Exposes SplitLayout.Primary and SplitLayout.Secondary sub-components
 * for semantic slot naming.
 *
 * Usage:
 *   <SplitLayout variant="chat">
 *     <SplitLayout.Primary>...</SplitLayout.Primary>
 *     <SplitLayout.Secondary>...</SplitLayout.Secondary>
 *   </SplitLayout>
 *
 *   <SplitLayout variant="aside" gap="lg">
 *     <div>Main</div>
 *     <aside>Sidebar</aside>
 *   </SplitLayout>
 */
import { cn } from "../../utils/cn";

const VARIANT_CLASS = {
  equal:  "cc-split-layout",
  chat:   "cc-split-chat",
  aside:  "cc-split-with-aside",
};

/**
 * @param {{
 *   variant?: 'equal'|'chat'|'aside',
 *   gap?: 'sm'|'md'|'lg',
 *   align?: 'start'|'center'|'stretch',
 *   as?: string,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
function SplitLayout({
  variant  = "equal",
  gap,
  align,
  as: Tag  = "div",
  className,
  children,
}) {
  const gapClass = {
    sm: "gap-3",
    md: "gap-5",
    lg: "gap-6",
  }[gap] ?? "";

  const alignClass = {
    start:   "items-start",
    center:  "items-center",
    stretch: "items-stretch",
  }[align] ?? "";

  return (
    <Tag
      className={cn(
        VARIANT_CLASS[variant] ?? VARIANT_CLASS.equal,
        gapClass,
        alignClass,
        className
      )}
    >
      {children}
    </Tag>
  );
}

/** Primary pane — dominant content side */
function Primary({ as: Tag = "div", className, children }) {
  return (
    <Tag className={cn("min-w-0", className)}>
      {children}
    </Tag>
  );
}

/** Secondary pane — sidebar, chat panel, supplementary content */
function Secondary({ as: Tag = "div", className, children }) {
  return (
    <Tag className={cn("min-w-0", className)}>
      {children}
    </Tag>
  );
}

SplitLayout.Primary   = Primary;
SplitLayout.Secondary = Secondary;

export default SplitLayout;
