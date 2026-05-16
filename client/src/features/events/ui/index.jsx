import React from "react";

export const STATUS_STYLE = {
  upcoming:         "bg-indigo-950 text-indigo-300 border-indigo-800",
  ongoing:          "bg-emerald-950 text-emerald-300 border-emerald-800",
  completed:        "bg-white/[0.04] text-slate-500 border-white/[0.06]",
  cancelled:        "bg-red-950 text-red-400 border-red-900",
  draft:            "bg-slate-900 text-slate-400 border-slate-700",
  pending_approval: "bg-yellow-950 text-yellow-400 border-yellow-800",
};

export const CATEGORY_ACCENT = {
  technical: "border-l-cyan-500",
  cultural:  "border-l-purple-500",
  sports:    "border-l-emerald-500",
  academic:  "border-l-amber-500",
  arts:      "border-l-rose-500",
  other:     "border-l-slate-500",
};

export function StatusPill({ status }) {
  const cls = STATUS_STYLE[status] || STATUS_STYLE.completed;
  const text = status === "pending_approval" ? "Pending" : status;
  return (
    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      {text}
    </span>
  );
}

export function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-white font-medium text-right max-w-[60%] truncate">{value}</dd>
    </div>
  );
}

export function EventCard({ ev, onClick }) {
  const accent = CATEGORY_ACCENT[ev._clubCategory] || CATEGORY_ACCENT.other;
  const dateStr = ev.date
    ? new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "—";
  const timeStr = ev.date
    ? new Date(ev.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <div
      onClick={() => onClick && onClick(ev)}
      className={`group rounded-2xl border border-white/[0.07] border-l-2 ${accent} bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] p-5 cursor-pointer transition-all`}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <StatusPill status={ev.status} />
        <span className="text-[10px] text-slate-600 truncate max-w-[40%]" title={ev._clubName}>
          {ev._clubName}
        </span>
      </div>

      <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors line-clamp-2 mb-3">
        {ev.title}
      </h3>

      <div className="space-y-1">
        <p className="text-slate-500 text-[11px] flex items-center gap-1.5">
          <span>📅</span>
          <span>{dateStr}{timeStr ? ` · ${timeStr}` : ""}</span>
        </p>
        {ev.venue && (
          <p className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <span>📍</span>
            <span className="truncate">{ev.venue}</span>
          </p>
        )}
        {ev.maxAttendees && (
          <p className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <span>👥</span>
            <span>{ev.attendees?.filter(a => a.status === "registered").length || 0} / {ev.maxAttendees} registered</span>
          </p>
        )}
      </div>
    </div>
  );
}



import VolunteerPanel from "./VolunteerPanel";
import VolunteerRow from "./VolunteerRow";

export { VolunteerPanel, VolunteerRow };

export default {
  StatusPill,
  InfoRow,
  EventCard,
  VolunteerPanel,
  VolunteerRow,
  STATUS_STYLE,
  CATEGORY_ACCENT,
};
