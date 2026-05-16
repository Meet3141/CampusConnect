/**
 * MyClubs.jsx
 * Shows clubs the authenticated user belongs to (any membership status).
 *
 * API: GET /api/clubs/mine  → { success, data: Club[] }
 *      Club.members[].userId     = raw ObjectId string in list (NOT populated)
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { CLUB_CATEGORY_META } from "../../../theme";
import { listMyClubs } from "../api";

const STATUS_META = {
  active:   { label: "Member",  cls: "bg-emerald-950 text-emerald-300 border-emerald-700" },
  pending:  { label: "Pending", cls: "bg-yellow-950 text-yellow-300 border-yellow-700"   },
  rejected: { label: "Rejected",cls: "bg-red-950 text-red-400 border-red-800"            },
};

export default function MyClubs() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [allClubs, setAllClubs] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!user?._id) return;

    const fetchClubs = async () => {
      try {
        // GET /api/clubs/mine — returns only the user's clubs with myStatus attached
        const res = await listMyClubs();
        setAllClubs(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your clubs.");
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [user]);

  const counts = useMemo(() => ({
    all:     allClubs.length,
    active:  allClubs.filter((c) => c.myStatus === "active").length,
    pending: allClubs.filter((c) => c.myStatus === "pending").length,
  }), [allClubs]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return allClubs;
    return allClubs.filter((c) => c.myStatus === activeFilter);
  }, [allClubs, activeFilter]);

  const canCreateClub =
    user?.roles?.includes("clubAdmin") || user?.roles?.includes("orgAdmin");

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-600 text-[11px] tracking-widest uppercase font-mono">
            Loading your clubs…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-8 text-center max-w-sm">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2 bg-red-900/40 hover:bg-red-900/70 border border-red-800 text-red-300 rounded-xl text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">

      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute -top-32 -left-16 w-80 h-80 bg-indigo-700/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 right-8 w-60 h-60 bg-violet-700/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-3">
            Dashboard / My Clubs
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                My{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Clubs
                </span>
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm">
                {counts.all} club{counts.all !== 1 ? "s" : ""} you're connected to
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/clubs")}
                className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 text-slate-400 hover:text-white text-sm transition-all"
              >
                Browse All
              </button>
              {canCreateClub && (
                <button
                  onClick={() => navigate("/clubs/create")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                  + New Club
                </button>
              )}
            </div>
          </div>

          {/* Status filter tabs */}
          {counts.all > 0 && (
            <div className="flex gap-1 mt-7 border-b border-white/[0.06] -mb-px">
              {[
                { key: "all",     label: "All",     count: counts.all },
                { key: "active",  label: "Active",  count: counts.active },
                { key: "pending", label: "Pending", count: counts.pending },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                    activeFilter === key
                      ? "border-indigo-500 text-white"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums ${
                    activeFilter === key
                      ? "bg-indigo-600/30 text-indigo-300"
                      : "bg-white/5 text-slate-600"
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="w-full px-5 lg:px-6 py-6">

        {/* Empty: no memberships at all */}
        {counts.all === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-4xl">
              🏛️
            </div>
            <div>
              <h2 className="text-xl font-semibold">No clubs yet</h2>
              <p className="text-slate-500 text-sm mt-1.5 max-w-xs leading-relaxed">
                You haven't joined any clubs. Browse the catalogue and find your community.
              </p>
            </div>
            <button
              onClick={() => navigate("/clubs")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Explore Clubs
            </button>
          </div>
        )}

        {/* Empty: filter has no results */}
        {counts.all > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600 text-sm">
            No {activeFilter} clubs to show.
          </div>
        )}

        {/* Club grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((club, i) => (
              <MyClubCard
                key={club._id}
                club={club}
                index={i}
                onClick={() => navigate(`/clubs/${club._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Club Card
───────────────────────────────────────────── */
function MyClubCard({ club, index, onClick }) {
  const meta   = CLUB_CATEGORY_META[club.category] || CLUB_CATEGORY_META.other;
  const status = STATUS_META[club.myStatus];

  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 55}ms` }}
      className="group text-left rounded-2xl border border-cc-soft bg-cc-surface-weak hover-bg-cc-surface hover-border-cc-strong transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
    >
      {/* Gradient header */}
      <div className={`relative h-24 bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
        {club.coverImage ? (
          <img
            src={club.coverImage}
            alt={club.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        ) : (
          <span className="text-4xl opacity-70 group-hover:scale-110 transition-transform duration-300 select-none">
            {meta.emoji}
          </span>
        )}
        {status && (
          <span className={`absolute top-2.5 right-2.5 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-semibold ${status.cls}`}>
            {status.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-cc text-sm leading-snug group-hover:text-indigo-300 transition-colors line-clamp-1">
            {club.name}
          </h3>
          <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium ${meta.badge}`}>
            {club.category}
          </span>
        </div>

        <p className="text-cc-muted text-xs line-clamp-2 leading-relaxed">
          {club.description}
        </p>

        <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-cc-soft">
          <span className="text-[11px] text-cc-muted">
            {club.memberCount ?? 0} member{club.memberCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[11px] text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform duration-200">
            Open →
          </span>
        </div>
      </div>
    </button>
  );
}
