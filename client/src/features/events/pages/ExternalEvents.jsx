/**
 * ExternalEvents.jsx
 * Browse cross-university events.
 *
 * API: GET /external-events  → { success, data, meta }
 *      params: ?category= &universityName= &verified= &page= &limit=
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { listExternalEvents } from "../api";

const CATEGORIES = ["hackathon", "workshop", "webinar", "cultural", "sports", "conference", "competition"];
const CAT_META = {
  hackathon:    { emoji: "💻", badge: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  workshop:     { emoji: "🛠",  badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:      { emoji: "🎙",  badge: "bg-sky-950 text-sky-300 border-sky-800" },
  cultural:     { emoji: "🎭", badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:       { emoji: "⚡", badge: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  conference:   { emoji: "🏛",  badge: "bg-amber-950 text-amber-300 border-amber-800" },
  competition:  { emoji: "🏆", badge: "bg-rose-950 text-rose-300 border-rose-800" },
};
const catOf = (k) => CAT_META[k] || CAT_META.cultural;

// Helper: check if a date is valid
function isValidDate(val) {
  if (!val) return false;
  const d = new Date(val);
  return !Number.isNaN(d.getTime());
}

// Helper: check if event date has passed
function isEventExpired(val) {
  if (!val || !isValidDate(val)) return false;
  return new Date(val) < new Date();
}

export default function ExternalEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [category, setCategory] = useState("");
  const [uniFilter, setUniFilter] = useState("");
  const limit = 12;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit, verified: "true" };
        if (category) params.category = category;
        if (uniFilter) params.universityName = uniFilter;
        const res = await listExternalEvents(params);
        setEvents(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, category, uniFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="text-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-0 w-80 h-80 bg-violet-700/6 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-3">
            Discover / External Events
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                External{" "}
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Events</span>
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm">
                Discover events from other universities and communities.
              </p>
            </div>
            {user && (
              <button onClick={() => navigate("/external-events/create")}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shrink-0">
                + Submit Event
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <button onClick={() => { setCategory(""); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !category ? "bg-indigo-600 text-white" : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.07]"
              }`}>
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  category === cat ? "bg-indigo-600 text-white" : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.07]"
                }`}>
                {catOf(cat).emoji} {cat}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <input
              type="text" value={uniFilter}
              onChange={(e) => { setUniFilter(e.target.value); setPage(1); }}
              placeholder="Filter by university name…"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 w-full sm:w-72 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🌐</div>
            <p className="text-slate-500 text-sm">No external events found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.filter(ev => isValidDate(ev.date)).map((ev) => {
                const cat = catOf(ev.category);
                return (
                  <div key={ev._id} onClick={() => navigate(`/external-events/${ev._id}`)}
                    className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] p-5 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium ${cat.badge}`}>
                        {ev.category}
                      </span>
                      {ev.isVerified && (
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1">
                      {ev.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-1">🏫 {ev.universityName}</p>
                    {isValidDate(ev.date) && (
                      <p className="text-[11px] text-slate-500">
                        📅 {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                    {ev.venue && <p className="text-[11px] text-slate-500 mt-0.5">📍 {ev.venue}</p>}
                    {ev.registrationLink && !isEventExpired(ev.date) && (
                      <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        Register →
                      </a>
                    )}
                    {ev.registrationLink && isEventExpired(ev.date) && (
                      <p className="inline-block mt-3 text-xs text-slate-600 cursor-not-allowed" title="Event date has passed">
                        Registration Closed
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white text-xs transition-colors disabled:opacity-30">
                  ← Previous
                </button>
                <span className="text-xs text-slate-500 px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white text-xs transition-colors disabled:opacity-30">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
