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
import { listMyClubs } from "../api";
import ClubCard from "../../../components/data-display/ClubCard";
import Spinner from "../../../components/feedback/Spinner";
import EmptyState from "../../../components/feedback/EmptyState";
import FilterBar from "../../../components/navigation/FilterBar";
import Button from "../../../components/ui/Button";



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
  if (loading) return <Spinner.Page message="Loading your clubs…" />;

  /* ── Error ── */
  if (error) return <div className="py-12 px-6"><EmptyState variant="error" title={error} action={{ label: "Retry", onClick: () => window.location.reload() }} /></div>;

  return (
    <div className="text-white">

      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute -top-32 -left-16 w-80 h-80 bg-indigo-700/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 right-8 w-60 h-60 bg-violet-700/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full px-5 lg:px-6 pt-6 pb-5">
          <p className="text-label text-muted font-mono mb-3">
            Dashboard / My Clubs
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-display-lg">
                My{" "}
                <span className="cc-text-gradient">
                  Clubs
                </span>
              </h1>
              <p className="text-body-sm text-muted mt-1.5">
                {counts.all} club{counts.all !== 1 ? "s" : ""} you're connected to
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate("/clubs")}>Browse All</Button>
              {canCreateClub && (
                <Button variant="primary" size="sm" onClick={() => navigate("/clubs/create")}>+ New Club</Button>
              )}
            </div>
          </div>

          {counts.all > 0 && (
            <div className="mt-7">
              <FilterBar
                filters={[
                  { value: "all", label: `All (${counts.all})` },
                  { value: "active", label: `Active (${counts.active})` },
                  { value: "pending", label: `Pending (${counts.pending})` },
                ]}
                value={activeFilter}
                onChange={setActiveFilter}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="w-full px-5 lg:px-6 py-6">
        {counts.all === 0 && (
          <EmptyState
            icon="🏙️"
            title="No clubs yet"
            description="You haven't joined any clubs. Browse the catalogue and find your community."
            action={{ label: "Explore Clubs", onClick: () => navigate("/clubs") }}
          />
        )}

        {counts.all > 0 && filtered.length === 0 && (
          <EmptyState icon="🔍" title={`No ${activeFilter} clubs to show`} />
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((club, i) => (
              <ClubCard
                key={club._id}
                club={club}
                index={i}
                myStatus={{ status: club.myStatus }}
                onView={() => navigate(`/clubs/${club._id}`)}
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
          meta.Icon ? (
            <meta.Icon size={24} className="opacity-70 group-hover:scale-110 transition-transform duration-300 select-none" />
          ) : null
        )}
        {status && (
          <span className={`absolute top-2.5 right-2.5 text-label px-2 py-0.5 rounded-full border ${status.cls}`}>
            {status.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-body-md font-semibold text-cc leading-snug group-hover:text-indigo-300 transition-colors line-clamp-1">
            {club.name}
          </h3>
          <span className={`shrink-0 text-label px-2 py-0.5 rounded-full border ${meta.badge}`}>
            {club.category}
          </span>
        </div>

        <p className="text-caption text-muted line-clamp-2 text-relaxed">
          {club.description}
        </p>

        <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-cc-soft">
          <span className="text-micro text-muted">
            {club.memberCount ?? 0} member{club.memberCount !== 1 ? "s" : ""}
          </span>
          <span className="text-micro text-accent font-semibold group-hover:translate-x-0.5 transition-transform duration-200">
            Open →
          </span>
        </div>
      </div>
    </button>
  );
}
