/**
 * EventCard.jsx — Phase 6 upgrade
 * - Expandable detail panel on click (description + venue link)
 * - Attendance mini-bar on default variant
 * - "X seats left" urgency label
 * - Live dot (pulsing) when status === "ongoing"
 * - Avatar stack from participants
 * - Compact but rich information hierarchy
 * - Light-theme compatible semantic tokens
 */
import { useState } from "react";
import Badge from "../ui/Badge";
import { cn } from "../../utils/cn";
import { MapPin, Calendar, Clock, ChevronDown } from "lucide-react";

const CATEGORY_ACCENT = {
  technical: "border-l-cyan-500",
  cultural: "border-l-purple-500",
  sports: "border-l-emerald-500",
  academic: "border-l-amber-500",
  arts: "border-l-rose-500",
  hackathon: "border-l-indigo-500",
  workshop: "border-l-teal-500",
  webinar: "border-l-sky-500",
  other: "border-l-slate-500",
};

const CATEGORY_BG_ACCENT = {
  technical: "from-cyan-500/8",
  cultural: "from-[var(--cc-color-brand)]/8",
  sports: "from-[var(--cc-color-success)]/8",
  academic: "from-[var(--cc-color-warning)]/8",
  arts: "from-[var(--cc-color-danger)]/8",
  hackathon: "from-[var(--cc-color-brand)]/8",
  workshop: "from-teal-500/8",
  webinar: "from-sky-500/8",
  other: "from-slate-500/8",
};

function isValidDate(d) { return d instanceof Date && !Number.isNaN(d.getTime()); }

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : null;
  if (!isValidDate(d)) return { date: "Date not set", time: "" };
  return {
    date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function getDuration(startStr, endStr) {
  const s = startStr ? new Date(startStr) : null;
  const e = endStr ? new Date(endStr) : null;
  if (!isValidDate(s) || !isValidDate(e)) return "";
  const ms = e - s;
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* Avatar stack — up to 3 initials */
function AvatarStack({ participants = [], max = 3 }) {
  if (!participants || participants.length === 0) return null;
  const shown = participants.slice(0, max);
  const colors = ["bg-[var(--cc-color-brand)]", "bg-purple-600", "bg-sky-600", "bg-teal-600"];
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((p, i) => {
        const name = p.name || p.userId?.name || "?";
        const init = name[0]?.toUpperCase() || "?";
        return (
          <div
            key={i}
            className={`w-5 h-5 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-[8px] font-bold text-[var(--cc-color-on-brand)] ring-1 ring-cc-bg`}
            title={name}
          >
            {init}
          </div>
        );
      })}
      {participants.length > max && (
        <div className="w-5 h-5 rounded-full bg-cc-surface-hover flex items-center justify-center text-[8px] font-semibold text-cc-muted ring-1 ring-cc-bg">
          +{participants.length - max}
        </div>
      )}
    </div>
  );
}

export default function EventCard({ event: ev, onClick, compact = false, variant = "default", className, index = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const accent = CATEGORY_ACCENT[ev.category || ev._clubCategory] ?? CATEGORY_ACCENT.other;
  const bgAccent = CATEGORY_BG_ACCENT[ev.category || ev._clubCategory] ?? CATEGORY_BG_ACCENT.other;
  const { date: dateStr, time: timeStr } = formatDate(ev.date || ev.createdAt);
  const duration = getDuration(ev.date, ev.endDate);
  const endDate = ev.endDate ? new Date(ev.endDate) : null;

  const dateLabel =
    ev.status === "completed" && isValidDate(endDate)
      ? `Completed ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : [dateStr, timeStr, duration].filter(Boolean).join(" · ");

  // Capacity
  const registered = ev.attendees?.filter((a) => a.status === "registered").length || 0;
  const capacity = ev.maxAttendees || 0;
  const capacityPct = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
  const nearFull = capacityPct >= 80;
  const seatsLeft = capacity > 0 ? capacity - registered : null;

  const isLive = ev.status === "ongoing";
  const participants = ev.attendees || ev.participants || [];

  const handleExpand = (e) => {
    e.stopPropagation();
    setExpanded((x) => !x);
  };


  /* ── Default / compact card ── */
  return (
    <article
      style={{ animationDelay: `${index * 45}ms` }}
      className={cn(
        "group rounded-2xl border border-t-[3px]",
        accent, "border-cc-soft",
        "bg-cc-surface",
        compact ? "p-3.5" : "p-4",
        "animate-pop-in",
        "cc-event-card",
        className
      )}
    >
      {/* Top row: status badge (left) + club name (right) */}
      <div className="flex items-center justify-between mb-2.5 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={ev.status} size="sm" />
        </div>
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
          {ev._clubName && (
            <span className="text-[10px] text-cc-muted truncate font-medium" title={ev._clubName}>
              {ev._clubName}
            </span>
          )}
        </div>
      </div>

      {/* Title — clickable to navigate */}
      <h3
        onClick={onClick}
        className={cn(
          "font-bold text-cc group-hover:text-primary transition-colors line-clamp-2 cursor-pointer",
          compact ? "text-xs mb-2" : "text-[13px] mb-2.5"
        )}
      >
        {ev.title}
      </h3>

      {/* Meta */}
      {!compact && (
        <div className="space-y-1">
          <p className="text-cc-muted text-[11px] flex items-center gap-1.5">
            <Calendar size={11} className="shrink-0 opacity-60" />
            <span>{dateLabel}</span>
          </p>
          {ev.venue && (
            <p className="text-cc-muted text-[11px] flex items-center gap-1.5">
              <MapPin size={11} className="shrink-0 opacity-60" />
              <span className="truncate">{ev.venue}</span>
            </p>
          )}

          {/* Capacity mini bar */}
          {capacity > 0 && (
            <div className="pt-1.5">
              <div className="flex items-center justify-between mb-1">
                <AvatarStack participants={participants} max={2} />
                <span className="text-[10px] text-muted ml-auto">{registered}/{capacity}</span>
              </div>
              <div className="h-1 rounded-full bg-cc-soft overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${capacityPct}%`,
                    backgroundColor: nearFull ? "var(--cc-color-warning)" : "var(--cc-color-success)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expand toggle */}
      {!compact && ev.description && (
        <button
          onClick={handleExpand}
          className="mt-2.5 flex items-center gap-1 text-[10px] text-cc-muted hover:text-cc transition-colors"
        >
          <ChevronDown
            size={11}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Less" : "Details"}
        </button>
      )}

      {/* Expandable panel */}
      {expanded && (
        <div className="cc-expand-panel mt-2 pt-2 border-t border-cc-soft">
          <p className="text-[11px] text-cc-muted leading-relaxed line-clamp-4">
            {ev.description}
          </p>
          {ev.registrationLink && (
            <a
              href={ev.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-block mt-2 text-[11px] transition-colors"
              style={{ color: 'var(--cc-color-brand)' }}
            >
              Register →
            </a>
          )}
        </div>
      )}
    </article>
  );
}
