/**
 * features/admin/pages/AdminPanel.jsx
 * Org-Admin platform management panel.
 *
 * API:
 *   GET    /api/clubs?page=&limit=  → { success, data: Club[], meta }
 *   DELETE /api/clubs/:id           → { success, message }  (orgAdmin only)
 *   GET    /api/clubs/:id/members   → { success, data: member[] }  per club
 *
 * Access: orgAdmin only
 *
 * Tabs:
 *   All Clubs  — paginated table with edit / delete actions
 *   Pending    — clubs that have pending join requests (fetched club-by-club)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { CLUB_CATEGORY_META } from "../../../theme";
import { deleteClub } from "../api";
import { useAdminClubs, useAdminPendingCounts } from "../hooks";
import { Lock, Landmark, CheckCircle2 } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const toast = useToast();

  const isOrgAdmin = user?.roles?.includes("orgAdmin");

  const [tab, setTab] = useState("clubs"); // "clubs" | "pending"

  /* ── Hooks ── */
  const { clubs, setClubs, meta, setMeta, loading, fetchClubs } = useAdminClubs();
  const { pendingMap, pendingLoading } = useAdminPendingCounts(clubs, tab === "pending");

  const [deletingId, setDeletingId] = useState(null);

  /* ── Delete club ── */
  const handleDelete = async (clubId, clubName) => {
    if (!window.confirm(`Permanently delete "${clubName}"? This cannot be undone.`)) return;
    setDeletingId(clubId);
    try {
      await deleteClub(clubId);
      setClubs((prev) => prev.filter((c) => c._id !== clubId));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete club.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Permission gate ── */
  if (!isOrgAdmin) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-800">
            <Lock size={16} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-cc mb-2">Org Admin Only</h2>
          <p className="text-cc-muted text-sm">This panel is restricted to Organisation Admins.</p>
          <button onClick={() => navigate("/dashboard")}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pendingClubs = Object.entries(pendingMap)
    .filter(([, v]) => v.count > 0)
    .map(([id, v]) => ({
      ...clubs.find((c) => c._id === id),
      pendingCount:   v.count,
      pendingMembers: v.members.filter((m) => m.status === "pending"),
    }));

  return (
    <div className="text-cc">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-cc-soft">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-0 w-80 h-80 bg-amber-700/5 rounded-full blur-3xl" />
          <div className="absolute -top-16 right-0 w-60 h-60 bg-indigo-700/5 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-0">
          <p className="text-[11px] tracking-widest text-cc-muted uppercase font-mono mb-3">
            Admin / Platform
          </p>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin{" "}
                <span className="cc-text-gradient">
                  Panel
                </span>
              </h1>
              <p className="text-cc-muted text-sm mt-1.5">
                {meta.total} club{meta.total !== 1 ? "s" : ""} on the platform
              </p>
            </div>
            <button onClick={() => navigate("/clubs/create")}
              className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
              + New Club
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-cc-soft -mb-px">
            {[
              { key: "clubs",   label: "All Clubs",      count: meta.total },
              { key: "pending", label: "Pending Members", count: pendingClubs.length },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === key
                    ? "border-amber-500 text-amber-300"
                    : "border-transparent text-cc-muted hover:text-cc-muted"
                }`}>
                {label}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    tab === key ? "bg-amber-600/30 text-amber-300" : "bg-cc-surface-weak text-cc-muted"
                  }`}>{count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">

        {/* ── All Clubs tab ── */}
        {tab === "clubs" && (
          <>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-cc-surface-weak animate-pulse" />
                ))}
              </div>
            ) : clubs.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-2xl bg-cc-surface-weak">
                  <Landmark size={24} className="text-cc-muted" />
                </div>
                <p className="text-cc-muted text-sm">No clubs yet.</p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-cc-soft overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_120px_80px_160px] gap-4 px-5 py-2.5 border-b border-cc-soft bg-cc-surface-weak">
                    <span className="text-[11px] uppercase tracking-widest text-cc-muted font-medium">Club</span>
                    <span className="text-[11px] uppercase tracking-widest text-cc-muted font-medium">Category</span>
                    <span className="text-[11px] uppercase tracking-widest text-cc-muted font-medium text-right">Members</span>
                    <span className="text-[11px] uppercase tracking-widest text-cc-muted font-medium text-right">Actions</span>
                  </div>

                  {clubs.map((club, i) => {
                    const catMeta = CLUB_CATEGORY_META[club.category] || CLUB_CATEGORY_META.other;
                    const isLast = i === clubs.length - 1;
                    return (
                      <div key={club._id}
                        className={`grid grid-cols-[1fr_120px_80px_160px] gap-4 items-center px-5 py-3.5 bg-cc-surface-weak hover:bg-cc-surface transition-colors ${!isLast ? "border-b border-cc-soft" : ""}`}>

                        {/* Club info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-cc-surface flex items-center justify-center shrink-0">
                            {catMeta.Icon && <catMeta.Icon size={24} className="opacity-60" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-cc truncate">{club.name}</p>
                            <p className="text-[11px] text-cc-muted truncate">{club.description?.slice(0, 50)}…</p>
                          </div>
                        </div>

                        {/* Category */}
                        <span className={`justify-self-start text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium ${catMeta.badge}`}>
                          {club.category}
                        </span>

                        {/* Members */}
                        <span className="text-sm text-cc-muted text-right tabular-nums">
                          {club.memberCount ?? 0}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/clubs/${club._id}`)}
                            className="px-3 py-1.5 text-xs text-cc-muted hover:text-cc bg-cc-surface-weak hover:bg-cc-surface rounded-lg transition-colors">
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/clubs/${club._id}/edit`)}
                            className="px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-600/10 hover:bg-indigo-600/20 rounded-lg transition-colors">
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(club._id, club.name)}
                            disabled={deletingId === club._id}
                            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors disabled:opacity-40">
                            {deletingId === club._id ? "…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {meta.total > meta.limit && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button onClick={() => fetchClubs(meta.page - 1)} disabled={meta.page <= 1}
                      className="px-4 py-2 rounded-xl border border-cc-soft text-cc-muted text-sm hover:border-cc-strong hover:text-cc transition-all disabled:opacity-30">
                      ← Prev
                    </button>
                    <span className="text-cc-muted text-sm">
                      {meta.page} / {Math.ceil(meta.total / meta.limit)}
                    </span>
                    <button onClick={() => fetchClubs(meta.page + 1)} disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
                      className="px-4 py-2 rounded-xl border border-cc-soft text-cc-muted text-sm hover:border-cc-strong hover:text-cc transition-all disabled:opacity-30">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Pending Members tab ── */}
        {tab === "pending" && (
          <>
            {pendingLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-cc-surface-weak animate-pulse" />
                ))}
              </div>
            ) : pendingClubs.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-2xl bg-cc-surface-weak">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <p className="text-cc font-semibold mb-1">All caught up</p>
                <p className="text-cc-muted text-sm">No pending member requests across any club.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingClubs.map((club) => (
                  <div key={club._id} className="rounded-2xl border border-cc-soft bg-cc-surface-weak overflow-hidden">
                    {/* Club header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-cc-soft">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cc-surface flex items-center justify-center shrink-0">
                          {(() => { const m = CLUB_CATEGORY_META[club.category] || CLUB_CATEGORY_META.other; return m.Icon ? <m.Icon size={24} className="opacity-60" /> : null; })()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-cc">{club.name}</p>
                          <p className="text-[11px] text-cc-muted">
                            {club.pendingCount} pending request{club.pendingCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/clubs/${club._id}`)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        Manage club →
                      </button>
                    </div>

                    {/* Pending members list */}
                    <div className="divide-y divide-cc-soft">
                      {club.pendingMembers.map((m) => (
                        <div key={m._id} className="flex items-center gap-3 px-5 py-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-950 ring-1 ring-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0">
                            {(m.userId?.name || "?")[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-cc truncate">{m.userId?.name || "Unknown"}</p>
                            <p className="text-[11px] text-cc-muted truncate">{m.userId?.email}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-yellow-950 text-yellow-300 border border-yellow-800 rounded-full font-semibold">
                            Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
