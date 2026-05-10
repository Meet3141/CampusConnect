/**
 * Bookmarks.jsx
 * Save events for later.
 *
 * API: GET /bookmarks         → { success, data } each entry has hydrated .event
 *      DELETE /bookmarks/:id  → { success, message }
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

const CAT_META = {
  hackathon:   { emoji: "💻", badge: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  workshop:    { emoji: "🛠",  badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:     { emoji: "🎙",  badge: "bg-sky-950 text-sky-300 border-sky-800" },
  cultural:    { emoji: "🎭", badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:      { emoji: "⚡", badge: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  conference:  { emoji: "🏛",  badge: "bg-amber-950 text-amber-300 border-amber-800" },
  competition: { emoji: "🏆", badge: "bg-rose-950 text-rose-300 border-rose-800" },
  technical:   { emoji: "⚙️", badge: "bg-cyan-950 text-cyan-300 border-cyan-800" },
  academic:    { emoji: "📚", badge: "bg-amber-950 text-amber-300 border-amber-800" },
  arts:        { emoji: "🎨", badge: "bg-rose-950 text-rose-300 border-rose-800" },
  meeting:     { emoji: "📋", badge: "bg-slate-800 text-slate-300 border-slate-700" },
};
const catOf = (k) => CAT_META[k] || CAT_META.meeting;

export default function Bookmarks() {
  const navigate = useNavigate();
  const toast = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all"); // all, internal, external

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/bookmarks");
        setBookmarks(res.data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load bookmarks.");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleRemove = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove bookmark.");
    }
  };

  const filtered = filter === "all"
    ? bookmarks
    : bookmarks.filter((b) => b.eventType === filter);

  return (
    <div className="text-cc">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-cc-soft">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 right-0 w-80 h-80 bg-indigo-700/6 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-cc-muted uppercase font-mono mb-3">
            Dashboard / Bookmarks
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            My{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Bookmarks</span>
          </h1>
          <p className="text-cc-muted mt-1.5 text-sm">
            {bookmarks.length} saved event{bookmarks.length !== 1 ? "s" : ""}
          </p>

          {bookmarks.length > 0 && (
            <div className="flex gap-1 mt-5 border-b border-cc-soft -mb-px">
              {[
                { key: "all", label: "All", count: bookmarks.length },
                { key: "internal", label: "Internal", count: bookmarks.filter((b) => b.eventType === "internal").length },
                { key: "external", label: "External", count: bookmarks.filter((b) => b.eventType === "external").length },
              ].map(({ key, label, count }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                    filter === key ? "border-indigo-500 text-cc" : "border-transparent text-cc-muted hover:text-cc"
                  }`}>
                  {label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums ${
                    filter === key ? "bg-indigo-600/30 text-indigo-300" : "bg-cc-surface-weak text-cc-muted"
                  }`}>{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-cc-surface-weak animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-4xl">🔖</span>
            <div>
              <h2 className="text-lg font-semibold">No bookmarks</h2>
              <p className="text-cc-muted text-sm mt-1">Bookmark events to find them quickly later.</p>
            </div>
            <button onClick={() => navigate("/clubs")}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((bk) => {
              const ev  = bk.event;
              const cat = catOf(ev?.category);
              const dateLabel = ev?.date
                ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "";

              return (
                <div key={bk._id}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-cc-soft bg-cc-surface-weak hover-bg-cc-surface hover-border-cc-strong transition-all cursor-pointer"
                  onClick={() => {
                    if (bk.eventType === "internal") navigate(`/events/${bk.eventId}`);
                  }}>
                  <div className="w-10 h-10 rounded-xl bg-cc-surface-weak flex items-center justify-center text-xl shrink-0">
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cc group-hover:text-indigo-300 transition-colors truncate">
                      {ev?.title || "Untitled Event"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium ${
                        bk.eventType === "external" ? "bg-violet-950 text-violet-300 border-violet-800" : "bg-indigo-950 text-indigo-300 border-indigo-800"
                      }`}>
                        {bk.eventType}
                      </span>
                      {dateLabel && <span className="text-[11px] text-cc-muted">{dateLabel}</span>}
                      {ev?.venue && <span className="text-[11px] text-cc-muted">📍 {ev.venue}</span>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(bk._id); }}
                    className="opacity-0 group-hover:opacity-100 text-cc-muted hover:text-red-400 transition-all px-2 py-1 rounded-lg hover:bg-red-950/30 text-sm shrink-0"
                    title="Remove bookmark">
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
