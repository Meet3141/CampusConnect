import React from "react";
import { STATUS_STYLE, CATEGORY_ACCENT } from "./eventStyles";

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
  const durationMs = ev.date && ev.endDate ? new Date(ev.endDate).getTime() - new Date(ev.date).getTime() : 0;
  const durationLabel = durationMs > 0
    ? `${Math.floor(durationMs / 3600000)}h ${Math.round((durationMs % 3600000) / 60000)}m`.replace(/^0h\s/, "")
    : "";

  return (
    <div
      onClick={() => onClick && onClick(ev)}
      className={`group rounded-2xl border border-white/7 border-l-2 ${accent} bg-white/2 hover:bg-white/5 hover:border-white/14 p-5 cursor-pointer transition-all`}
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
          <span>{dateStr}{timeStr ? ` · ${timeStr}` : ""}{durationLabel ? ` · ${durationLabel}` : ""}</span>
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
};
