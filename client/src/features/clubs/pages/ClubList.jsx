/**
 * ClubList.jsx — Phase 5 upgrade: Hybrid Discovery System
 * - Featured section for top clubs (first 2-3 cards wider)
 * - Animated category pill transitions
 * - Stagger entrance for grid cards
 * - Animated SearchBar focus state
 * - Light-theme compatible (semantic tokens throughout)
 *
 * API: GET /api/clubs → { success, data: Club[], meta }
 *      POST /api/clubs/:id/join
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { CLUB_CATEGORIES, CLUB_CATEGORY_META } from "../../../theme";
import { joinClub, listMyClubs } from "../api";
import { useClubList } from "../hooks";
import ClubCard from "../../../components/data-display/ClubCard";
import SearchBar from "../../../components/navigation/SearchBar";
import Skeleton from "../../../components/feedback/Skeleton";
import EmptyState from "../../../components/feedback/EmptyState";
import Button from "../../../components/ui/Button";

export default function ClubList() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ]               = useState("");
  const [category, setCategory] = useState("");
  const { clubs, setClubs, meta, loading, error, fetchClubs } = useClubList({ q, category });
  const [joiningId, setJoiningId] = useState(null);
  const [myClubStatus, setMyClubStatus] = useState({});

  const [searchParams] = useSearchParams();
  const [sort, setSort] = useState("members");
  useEffect(() => {
    const init = searchParams.get("q") || "";
    setSearchInput(init);
    setQ(init);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!user?._id) { setMyClubStatus({}); return; }
    listMyClubs()
      .then((res) => {
        const map = {};
        (res.data.data || []).forEach((club) => {
          map[club._id] = {
            status: club.myStatus || "active",
            blockedUntil: club.myBlockedUntil || null,
            rejectCount: club.myRejectCount || 0,
          };
        });
        setMyClubStatus(map);
      })
      .catch(() => setMyClubStatus({}));
  }, [user]);

  const handleJoin = async (e, clubId) => {
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    setJoiningId(clubId);
    try {
      await joinClub(clubId);
      setClubs((prev) =>
        prev.map((c) =>
          c._id === clubId
            ? { ...c, members: [...(c.members || []), { userId: user._id, status: "pending", joinedAt: new Date() }] }
            : c
        )
      );
      setMyClubStatus((prev) => ({
        ...prev,
        [clubId]: { status: "pending", blockedUntil: null, rejectCount: prev?.[clubId]?.rejectCount || 0 },
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send join request.");
    } finally {
      setJoiningId(null);
    }
  };

  const myStatusFor = (club) => myClubStatus[club._id] || null;
  const canCreateClub = user?.roles?.includes("clubAdmin") || user?.roles?.includes("orgAdmin");

  // Sort clubs client-side
  const sortedClubs = [...clubs].sort((a, b) => {
    if (sort === "members") return (b.memberCount || 0) - (a.memberCount || 0);
    if (sort === "active")  return (b.ongoingEvents || 0) - (a.ongoingEvents || 0);
    // newest: sort by createdAt descending
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // Split clubs: featured (first 2-3) + rest (if no filter active)
  const showFeatured = !q && !category && sortedClubs.length >= 3;
  const featuredClubs = showFeatured ? sortedClubs.slice(0, 2) : [];
  const regularClubs  = showFeatured ? sortedClubs.slice(2) : sortedClubs;

  return (
    <div className="text-cc">
      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b border-cc-soft">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-96 h-64 bg-primary-soft rounded-full blur-3xl opacity-40" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent-soft rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative w-full px-5 lg:px-6 pt-6 pb-5">
          <p className="text-label text-muted font-mono mb-3">Dashboard / Clubs</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-display-lg text-cc">
                Discover{" "}
                <span style={{ background: 'linear-gradient(120deg, #004F9F, #00BCEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Clubs</span>
              </h1>
              <p className="text-body-sm text-secondary mt-1.5">
                {loading ? "…" : `${meta.total} club${meta.total !== 1 ? "s" : ""} on campus`}
              </p>
            </div>
            <div className="flex gap-2">
              {user && (
                <Button variant="secondary" size="sm" onClick={() => navigate("/my-clubs")}>My Clubs</Button>
              )}
              {canCreateClub && (
                <Button variant="primary" size="sm" onClick={() => navigate("/clubs/create")}>+ New Club</Button>
              )}
            </div>
          </div>

          {/* Search + category select */}
          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search clubs by name…"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-cc-surface-weak border border-cc-soft rounded-xl px-4 py-2.5 text-sm text-cc focus:outline-none focus:border-indigo-500/60 transition-all cursor-pointer min-w-[160px]"
            >
              <option value="" className="bg-cc-surface">All Categories</option>
              {CLUB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-cc-surface capitalize">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

            {/* Sort controls + category pills */}
          <div className="flex flex-col gap-3 mt-5">
            {/* Sort row */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted font-mono uppercase tracking-wider shrink-0">Sort:</span>
              {[
                { key: "members", label: "Most members" },
                { key: "active",  label: "Most active"  },
                { key: "newest",  label: "Newest"        },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 ${
                    sort === key
                      ? "border-cc-strong"
                      : "bg-transparent text-muted border-transparent hover:border-cc-soft hover:text-cc"
                  }`}
                  style={sort === key ? {
                    backgroundColor: 'var(--cc-color-primary-soft)',
                    color: 'var(--cc-color-brand)',
                  } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Category pill shortcuts */}
            <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("")}
              className={`relative px-3 py-1 rounded-full text-caption font-semibold border transition-all duration-200 ${
                !category
                  ? "border-transparent"
                  : "bg-cc-surface-weak text-muted border-cc-soft hover:border-cc-strong hover:text-cc"
              }`}
              style={!category ? {
                backgroundColor: 'var(--cc-color-brand)',
                color: '#fff',
                borderColor: 'var(--cc-color-brand)',
                boxShadow: '0 2px 8px rgba(0,79,159,0.20)',
              } : undefined}
            >
              All
            </button>
            {CLUB_CATEGORIES.map((cat) => {
              const { Icon } = CLUB_CATEGORY_META[cat] || {};
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? "" : cat)}
                  className={`relative px-3 py-1 rounded-full text-caption font-semibold border capitalize transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? "border-transparent scale-105"
                      : "bg-cc-surface-weak text-muted border-cc-soft hover:border-cc-strong hover:text-cc hover:scale-105"
                  }`}
                  style={isActive ? {
                    backgroundColor: 'var(--cc-color-brand)',
                    color: '#fff',
                    borderColor: 'var(--cc-color-brand)',
                    boxShadow: '0 2px 8px rgba(0,79,159,0.20)',
                  } : undefined}
                >
                  {Icon && <Icon size={12} className="shrink-0" />}{cat}
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="w-full px-5 lg:px-6 py-6">
        {loading && <Skeleton.Grid count={6} renderItem={() => <Skeleton.Card />} />}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <Button variant="danger" size="sm" onClick={() => fetchClubs(1)}>Try again</Button>
          </div>
        )}

        {!loading && !error && clubs.length === 0 && (
          <EmptyState
            icon="🔭"
            title="No clubs found"
            description={q ? `No clubs match "${q}". Try different keywords or clear your filters.` : "No clubs in this category yet."}
            action={q || category ? { label: "Clear filters", onClick: () => { setSearchInput(""); setCategory(""); } } : undefined}
          />
        )}

        {!loading && !error && clubs.length > 0 && (
          <>
            {/* Featured section — first 2 clubs in wider cards (no filter active) */}
            {showFeatured && featuredClubs.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-3 flex items-center gap-2">
                  <span className="cc-active-dot" style={{ width: 6, height: 6 }} />
                  Trending this week
                  <span className="flex-1 h-px bg-cc-border-soft" />
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredClubs.map((club, i) => (
                    <ClubCard
                      key={club._id}
                      club={club}
                      index={i}
                      myStatus={myStatusFor(club)}
                      joinState={joiningId === club._id ? "joining" : "idle"}
                      onView={() => navigate(`/clubs/${club._id}`)}
                      onJoin={(e) => handleJoin(e, club._id)}
                      isOrgAdmin={user?.roles?.includes("orgAdmin")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular grid */}
            {regularClubs.length > 0 && (
              <>
                {showFeatured && (
                  <p className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-cc-border-soft" />
                    All clubs
                    <span className="w-4 h-px bg-cc-border-soft" />
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularClubs.map((club, i) => (
                    <ClubCard
                      key={club._id}
                      club={club}
                      index={showFeatured ? i + featuredClubs.length : i}
                      myStatus={myStatusFor(club)}
                      joinState={joiningId === club._id ? "joining" : "idle"}
                      onView={() => navigate(`/clubs/${club._id}`)}
                      onJoin={(e) => handleJoin(e, club._id)}
                      isOrgAdmin={user?.roles?.includes("orgAdmin")}
                    />
                  ))}
                </div>
              </>
            )}

            {meta.total > meta.limit && (
              <div className="flex justify-center gap-2 mt-10">
                <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => fetchClubs(meta.page - 1)}>
                  ← Prev
                </Button>
                <span className="px-4 py-2 text-muted text-sm">
                  {meta.page} / {Math.ceil(meta.total / meta.limit)}
                </span>
                <Button variant="secondary" size="sm" disabled={meta.page >= Math.ceil(meta.total / meta.limit)} onClick={() => fetchClubs(meta.page + 1)}>
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
