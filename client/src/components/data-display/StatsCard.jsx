/**
 * StatsCard.jsx — Global stat card for dashboards and analytics
 *
 * Usage:
 *   import { Building2 } from "lucide-react";
 *   <StatsCard icon={Building2} value={42} label="Total Clubs" sub="5 pending" accent="indigo" />
 *   <StatsCard icon={Calendar} value={128} label="Events" trend="+12%" trendDir="up" accent="violet" />
 */
import React from "react";
import { cn } from "../../utils/cn";

const ACCENTS = {
  indigo:  { text: "text-indigo-400",  ring: "ring-indigo-500/20",  bg: "bg-indigo-950/30"  },
  violet:  { text: "text-violet-400",  ring: "ring-violet-500/20",  bg: "bg-violet-950/30"  },
  emerald: { text: "text-emerald-400", ring: "ring-emerald-500/20", bg: "bg-emerald-950/30" },
  sky:     { text: "text-sky-400",     ring: "ring-sky-500/20",     bg: "bg-sky-950/30"     },
  amber:   { text: "text-amber-400",   ring: "ring-amber-500/20",   bg: "bg-amber-950/30"   },
  rose:    { text: "text-rose-400",    ring: "ring-rose-500/20",    bg: "bg-rose-950/30"    },
  teal:    { text: "text-teal-400",    ring: "ring-teal-500/20",    bg: "bg-teal-950/30"    },
  cyan:    { text: "text-cyan-400",    ring: "ring-cyan-500/20",    bg: "bg-cyan-950/30"    },
};

/**
 * @param {{
 *   icon: React.ComponentType<{size?: number, className?: string}>,
 *   value: number|string,
 *   label: string,
 *   sub?: string,
 *   accent?: keyof ACCENTS,
 *   trend?: string,
 *   trendDir?: 'up'|'down'|'neutral',
 *   onClick?: () => void,
 *   loading?: boolean,
 *   className?: string,
 * }} props
 */
export default function StatsCard({
  icon,
  value,
  label,
  sub,
  accent = "indigo",
  trend,
  trendDir = "neutral",
  onClick,
  loading,
  className,
}) {
  const a = ACCENTS[accent] ?? ACCENTS.indigo;
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-cc-soft p-5 transition-all duration-200",
        a.bg,
        onClick && "cursor-pointer hover:opacity-90 hover:-translate-y-px hover:shadow-md",
        className
      )}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3 ring-1", a.bg, a.ring)}>
        {icon && React.createElement(icon, { size: 18, className: a.text })}
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-20 bg-cc-surface-weak rounded animate-pulse mb-1" />
      ) : (
        <p className={cn("text-3xl font-bold tabular-nums mb-0.5", a.text)}>
          {value}
        </p>
      )}

      {/* Label */}
      <p className="text-xs text-muted">{label}</p>

      {/* Sub + trend row */}
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1.5">
          {sub && <p className="text-[11px] text-muted">{sub}</p>}
          {trend && (
            <span className={cn(
              "text-[11px] font-medium",
              trendDir === "up" ? "text-emerald-400" : trendDir === "down" ? "text-red-400" : "text-muted"
            )}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
