/**
 * Tooltip.jsx — CSS-positioned tooltip (no JS positioning library)
 *
 * Usage:
 *   <Tooltip content="Log out">
 *     <button>...</button>
 *   </Tooltip>
 *   <Tooltip content="Profile settings" side="right">
 *     <Avatar name="AK" />
 *   </Tooltip>
 */
import { cn } from "../../utils/cn";

/**
 * @param {{
 *   content: string,
 *   side?: 'top'|'bottom'|'left'|'right',
 *   delay?: number,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function Tooltip({ content, side = "top", className, children }) {
  if (!content) return children;

  const positions = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={cn(
          "absolute z-50 pointer-events-none whitespace-nowrap rounded-lg px-2.5 py-1.5",
          "bg-cc-surface border border-cc-soft shadow-lg text-[11px] text-cc font-medium",
          "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100",
          "transition-all duration-150",
          positions[side] ?? positions.top,
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
