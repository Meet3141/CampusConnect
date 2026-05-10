/**
 * ClubList.jsx
 * Browse & discover all clubs with search + category filter.
 *
 * API: GET /api/clubs             → { success, data: Club[], meta: { total, page, limit } }
 *      Query params: ?q= ?category= ?page= ?limit=   (search is ?q= NOT ?search=)
 *      Public — no auth required for listing
 *
 *      POST /api/clubs/:id/join   → { success, message }   (requires auth)
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const CATEGORIES = ["technical", "cultural", "sports", "academic", "arts", "other"];

const CATEGORY_META = {
  technical: { emoji: "⚙️", gradient: "from-cyan-600/25 to-blue-700/25",     badge: "bg-cyan-950 text-cyan-300 border-cyan-800/60",     accent: "text-cyan-400"    },
  cultural:  { emoji: "🎭", gradient: "from-purple-600/25 to-pink-700/25",    badge: "bg-purple-950 text-purple-300 border-purple-800/60",accent: "text-purple-400"  },
  sports:    { emoji: "⚡", gradient: "from-emerald-600/25 to-green-700/25",  badge: "bg-emerald-950 text-emerald-300 border-emerald-800/60", accent: "text-emerald-400" },
  academic:  { emoji: "📚", gradient: "from-amber-600/25 to-orange-700/25",   badge: "bg-amber-950 text-amber-300 border-amber-800/60",   accent: "text-amber-400"   },
  arts:      { emoji: "🎨", gradient: "from-rose-600/25 to-red-700/25",       badge: "bg-rose-950 text-rose-300 border-rose-800/60",      accent: "text-rose-400"    },
  other:     { emoji: "🌐", gradient: "from-slate-600/25 to-slate-700/25",    badge: "bg-slate-800 text-slate-300 border-slate-700/60",   accent: "text-slate-400"   },
};

export default function ClubList() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const toast = useToast();

  const [clubs, setClubs]       = useState([]);
  const [meta, setMeta]         = useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ]               = useState(""); // debounced search value
  const [category, setCategory] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  /* ── Debounce search input ── */
  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Fetch clubs ── */
  const fetchClubs = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      if (q)        params.q        = q;         // backend uses ?q= for search
      if (category) params.category = category;

      const res = await api.get("/clubs", { params });
      setClubs(res.data.data || []);             // response key is "data"
      setMeta(res.data.meta || { total: 0, page: 1, limit: 20 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load clubs.");
    } finally {
      setLoading(false);
    }
  }, [q, category]);

  useEffect(() => { fetchClubs(1); }, [fetchClubs]);

  /* ── Join request ── */
  const handleJoin = async (e, clubId) => {
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    setJoiningId(clubId);
    try {
      // POST /api/clubs/:id/join  → { success, message }
      await api.post(`/clubs/${clubId}/join`);
      // Optimistically update local state — mark as pending
      setClubs((prev) =>
        prev.map((c) =>
          c._id === clubId
            ? {
                ...c,
                members: [
                  ...(c.members || []),
                  { userId: user._id, status: "pending", joinedAt: new Date() },
                ],
              }
            : c
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send join request.");
    } finally {
      setJoiningId(null);
    }
  };

  /* ── Derive membership status for current user from club.members[] ──
     In the list endpoint, members[].userId is a raw ObjectId string     */
  const myStatusFor = (club) => {
    if (!user?._id) return null;
    const m = club.members?.find((m) => String(m.userId) === String(user._id));
    return m?.status ?? null;
  };

  const canCreateClub =
    user?.roles?.includes("clubAdmin") || user?.roles?.includes("orgAdmin");

  return (
    <div className="text-white">

      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-96 h-64 bg-indigo-700/6 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-violet-700/6 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-3">
            Dashboard / Clubs
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Discover{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Clubs
                </span>
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm">
                {loading ? "…" : `${meta.total} club${meta.total !== 1 ? "s" : ""} on campus`}
              </p>
            </div>

            <div className="flex gap-2">
              {user && (
                <button
                  onClick={() => navigate("/my-clubs")}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 text-slate-400 hover:text-white text-sm transition-all"
                >
                  My Clubs
                </button>
              )}
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

          {/* Search + category select */}
          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search clubs by name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/60 transition-all cursor-pointer min-w-[160px]"
            >
              <option value="" className="bg-[#0a0a12]">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#0a0a12] capitalize">
                  {CATEGORY_META[cat].emoji} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Category pill shortcuts */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setCategory("")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                category === ""
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/[0.15]"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? "" : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  category === cat
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/[0.15]"
                }`}
              >
                {CATEGORY_META[cat].emoji}{" "}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="w-full px-5 lg:px-6 py-6">

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] overflow-hidden animate-pulse">
                <div className="h-24 bg-white/[0.04]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3.5 bg-white/[0.04] rounded w-2/3" />
                  <div className="h-3 bg-white/[0.03] rounded w-full" />
                  <div className="h-3 bg-white/[0.03] rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchClubs(1)}
              className="px-5 py-2 bg-red-950/40 border border-red-900/60 rounded-xl text-red-400 text-sm hover:bg-red-950/60 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && clubs.length === 0 && (
          <div className="flex flex-col items-center py-24 gap-4 text-center">
            <div className="text-5xl">🔭</div>
            <h2 className="text-lg font-semibold">No clubs found</h2>
            <p className="text-slate-500 text-sm max-w-xs">
              {q ? `No clubs match "${q}".` : "No clubs in this category yet."}
            </p>
            <button
              onClick={() => { setSearchInput(""); setCategory(""); }}
              className="px-5 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:border-white/20 hover:text-white transition-all"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Club grid */}
        {!loading && !error && clubs.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubs.map((club, i) => (
                <ClubCard
                  key={club._id}
                  club={club}
                  index={i}
                  myStatus={myStatusFor(club)}
                  joining={joiningId === club._id}
                  onOpen={() => navigate(`/clubs/${club._id}`)}
                  onJoin={(e) => handleJoin(e, club._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {meta.total > meta.limit && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => fetchClubs(meta.page - 1)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-400 text-sm hover:border-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="px-4 py-2 text-slate-600 text-sm">
                  {meta.page} / {Math.ceil(meta.total / meta.limit)}
                </span>
                <button
                  disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
                  onClick={() => fetchClubs(meta.page + 1)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-400 text-sm hover:border-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
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

/* ─────────────────────────────────────────────
   Club Card
───────────────────────────────────────────── */
function ClubCard({ club, index, myStatus, joining, onOpen, onJoin }) {
  const meta = CATEGORY_META[club.category] || CATEGORY_META.other;

  const statusBadge = {
    active:   { label: "Member",  cls: "bg-emerald-950 text-emerald-300 border-emerald-700" },
    pending:  { label: "Pending", cls: "bg-yellow-950 text-yellow-300 border-yellow-700"   },
    rejected: { label: "Rejected",cls: "bg-red-950 text-red-400 border-red-800"            },
  }[myStatus];

  return (
    <div
      style={{ animationDelay: `${index * 45}ms` }}
      className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Cover */}
      <div
        className={`relative h-24 bg-gradient-to-br ${meta.gradient} flex items-center justify-center cursor-pointer`}
        onClick={onOpen}
      >
        {club.coverImage ? (
          <img src={club.coverImage} alt={club.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        ) : (
          <span className="text-4xl opacity-70 group-hover:scale-110 transition-transform duration-300 select-none">
            {meta.emoji}
          </span>
        )}
        {statusBadge && (
          <span className={`absolute top-2.5 right-2.5 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-semibold ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3
            onClick={onOpen}
            className="font-semibold text-white text-sm leading-snug cursor-pointer hover:text-indigo-300 transition-colors line-clamp-1"
          >
            {club.name}
          </h3>
          <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium ${meta.badge}`}>
            {club.category}
          </span>
        </div>

        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed flex-1">
          {club.description}
        </p>

        <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-white/[0.05]">
          <span className="text-[11px] text-slate-600">
            {club.memberCount ?? 0} member{club.memberCount !== 1 ? "s" : ""}
          </span>

          <div className="flex items-center gap-2">
            {/* Show Join only if user has no membership status */}
            {!myStatus && (
              <button
                onClick={onJoin}
                disabled={joining}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                {joining ? "…" : "Join"}
              </button>
            )}
            <button
              onClick={onOpen}
              className={`text-[11px] font-medium group-hover:translate-x-0.5 transition-transform duration-200 ${meta.accent}`}
            >
              View →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
