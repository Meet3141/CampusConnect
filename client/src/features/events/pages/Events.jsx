/**
 * Events.jsx
 * Shows all upcoming events from clubs the user belongs to (or admins).
 * If the user has no clubs, shows an empty-state CTA to join one.
 *
 * API:
 *   GET /api/clubs/mine  → [{ _id, name, category, myStatus, ... }]
 *   GET /api/events?clubId=:id&limit=50 (per club, filtered by active clubs)
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { EventCard } from "../ui";
import { useMyClubEvents } from "../hooks";

const STATUS_STYLE = {
  upcoming:         "bg-indigo-950 text-indigo-300 border-indigo-800",
  ongoing:          "bg-emerald-950 text-emerald-300 border-emerald-800",
  completed:        "bg-white/[0.04] text-slate-500 border-white/[0.06]",
  cancelled:        "bg-red-950 text-red-400 border-red-900",
  draft:            "bg-slate-900 text-slate-400 border-slate-700",
  pending_approval: "bg-yellow-950 text-yellow-400 border-yellow-800",
};

const CATEGORY_ACCENT = {
  technical: "border-l-cyan-500",
  cultural:  "border-l-purple-500",
  sports:    "border-l-emerald-500",
  academic:  "border-l-amber-500",
  arts:      "border-l-rose-500",
  other:     "border-l-slate-500",
};

const FILTERS = ["All", "upcoming", "ongoing", "completed"];

export default function Events() {
  const navigate        = useNavigate();
  const { user }        = useAuth();

  const { myClubs, events, loading } = useMyClubEvents();
  const [filter,  setFilter]    = useState("All");
  const [search,  setSearch]    = useState("");

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = events;
    if (filter !== "All") list = list.filter((e) => e.status === filter);
    if (search.trim())    list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [events, filter, search]);

  /* ── Empty state: not in any club ── */
  if (!loading && myClubs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="text-6xl mb-5">🎪</div>
        <h2 className="text-xl font-bold text-white mb-2">No club events yet</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
          You're not a member of any club. Join a club to see its events, announcements, and more right here.
        </p>
        <button
          onClick={() => navigate("/clubs")}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Discover Clubs →
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Events</h1>
        <p className="text-slate-500 text-sm">
          Events from your {myClubs.length} club{myClubs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Search + filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-600/50 transition-colors"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-white/[0.04] text-slate-400 border border-white/[0.07] hover:border-white/[0.15] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-500 text-sm">
            {search ? `No events matching "${search}"` : "No events in this category yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev) => (
            <EventCard key={ev._id} ev={ev} onClick={() => navigate(`/events/${ev._id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
