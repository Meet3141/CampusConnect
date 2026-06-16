/**
 * VolunteerHub.jsx — Event-based Volunteer Section
 * Route: /volunteers
 *
 * Shows upcoming events that have showOnVolunteerHub=true and open accepted slots.
 * Users submit an application (pending) — admin reviews it from EventDetail.
 * Event disappears from this page when accepted count >= volunteerLimit.
 *
 * API:
 *   GET  /events/volunteer-feed               → open volunteer events (public)
 *   POST /events/:id/volunteer                → { skills } — apply (pending)
 *   DELETE /events/:id/volunteer/:userId      → withdraw own application
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useVolunteerFeed } from "../hooks";
import { applyToVolunteer, withdrawVolunteerApplication } from "../api";
import { HandHelping, Calendar, MapPin, Landmark } from "lucide-react";
import Modal from "../../../components/overlays/Modal";

const CAT_COLORS = {
  hackathon: "text-[var(--cc-color-brand)] bg-[var(--cc-color-surface-brand)] border-[var(--cc-color-brand)]/50",
  workshop:  "text-teal-400 bg-teal-950/60 border-teal-800/50",
  webinar:   "text-sky-400 bg-sky-950/60 border-sky-800/50",
  cultural:  "text-purple-400 bg-purple-950/60 border-purple-800/50",
  sports:    "text-[var(--cc-color-success)] bg-[var(--cc-color-success-soft)] border-[var(--cc-color-success)]/50",
  meeting:   "text-[var(--cc-color-text-muted)] bg-[var(--cc-color-surface-elevated)] border-[var(--cc-color-border)]",
};

const STATUS_BADGE = {
  pending:  { label: "⏳ Awaiting Review",  cls: "bg-[var(--cc-color-warning-soft)] text-[var(--cc-color-warning)] border-[var(--cc-color-warning)]" },
  accepted: { label: "✓ Accepted",          cls: "bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border-[var(--cc-color-success)]" },
  rejected: { label: "✕ Not Selected",      cls: "bg-[var(--cc-color-danger-soft)] text-[var(--cc-color-danger)] border-[var(--cc-color-danger)]" },
};

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export default function VolunteerHub() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const toast = useToast();

  const { events, setEvents, loading, refetch } = useVolunteerFeed();
  const [search,      setSearch]      = useState("");
  const [acting,      setActing]      = useState(null);

  /* ── Apply modal ── */
  const [applyTarget, setApplyTarget] = useState(null);
  const [applySkills, setApplySkills] = useState("");
  const [applying,    setApplying]    = useState(false);

  /* ── Derived ── */
  const currentUserId = String(user?._id || user?.id || "");

  // Find the current user's application for an event (if any)
  const myApplication = (ev) =>
    ev.volunteers?.find((v) => String(v.userId?._id || v.userId) === currentUserId);

  const isAuthorityForEvent = (ev) => {
    if (!user) return false;
    if (user?.roles?.includes("orgAdmin")) return true;
    if (user?.roles?.includes("editor")) return true;
    if (String(ev.createdBy?._id || ev.createdBy || "") === currentUserId) return true;
    if (String(ev.clubId?.adminId?._id || ev.clubId?.adminId || "") === currentUserId) return true;
    return false;
  };

  const acceptedCount = (ev) =>
    ev.volunteers?.filter((v) => v.status === "accepted").length ?? 0;

  const filtered = events.filter((ev) =>
    !search.trim() ||
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    (ev.clubId?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ── Apply (submit pending application) ── */
  const handleApply = async () => {
    if (!applyTarget) return;
    setApplying(true);
    try {
      const skills = applySkills.split(",").map((s) => s.trim()).filter(Boolean);
      await applyToVolunteer(applyTarget._id, skills);
      // Optimistic: add pending entry
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === applyTarget._id
            ? {
                ...ev,
                volunteers: [
                  ...(ev.volunteers || []),
                  { userId: { _id: currentUserId, name: user?.name }, skills, status: "pending" },
                ],
              }
            : ev
        )
      );
      setApplyTarget(null);
      setApplySkills("");
      await refetch(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply.");
    } finally {
      setApplying(false);
    }
  };

  /* ── Withdraw own application ── */
  const handleWithdraw = async (ev) => {
    setActing(ev._id);
    try {
      await withdrawVolunteerApplication(ev._id, currentUserId);
      setEvents((prev) =>
        prev.map((e) =>
          e._id === ev._id
            ? { ...e, volunteers: e.volunteers.filter((v) => String(v.userId?._id || v.userId) !== currentUserId) }
            : e
        )
      );
      await refetch(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw.");
    } finally {
      setActing(null);
    }
  };

  /* ── Summary stats ── */
  const totalSlots = events.reduce((s, ev) => s + Math.max(0, ev.volunteerLimit - acceptedCount(ev)), 0);

  return (
    <div className="text-[var(--cc-color-text-primary)] min-h-screen">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-[var(--cc-color-border)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-0 w-[500px] h-[300px] bg-[var(--cc-color-success)]/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-600/[0.05] rounded-full blur-3xl" />
        </div>

        <div className="relative px-5 lg:px-8 pt-8 pb-6">
          <p className="text-[10px] tracking-[0.2em] text-[var(--cc-color-text-secondary)] uppercase font-mono mb-2">
            Campus / Volunteer Hub
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Volunteer{" "}
            <span className="cc-text-gradient">
              Opportunities
            </span>
          </h1>
          <p className="text-[var(--cc-color-text-muted)] text-sm mt-2 max-w-xl">
            Apply to volunteer for club events. Admins review and confirm your spot.
          </p>
          <div className="flex items-center gap-6 mt-5">
            <Stat label="Open Events"       value={events.length}   color="text-[var(--cc-color-success)]" />
            <div className="w-px h-8 bg-[var(--cc-color-border)]" />
            <Stat label="Available Slots"   value={totalSlots}      color="text-teal-400" />
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-5 lg:px-8 pt-6 pb-2">
        <div className="relative max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cc-color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search events or clubs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--cc-color-surface-elevated)] border border-[var(--cc-color-border)] rounded-xl text-sm text-[var(--cc-color-text-primary)] placeholder-[var(--cc-color-text-secondary)] focus:outline-none focus:border-[var(--cc-color-success)]/50 transition-colors"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-5 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-9 h-9 rounded-full border-2 border-[var(--cc-color-success)] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--cc-color-surface-elevated)] border border-[var(--cc-color-border)] mb-4">
              <HandHelping size={16} className="text-[var(--cc-color-success)]" />
            </div>
            <p className="text-[var(--cc-color-text-primary)] text-lg font-semibold">
              {search ? `No events matching "${search}"` : "No open volunteer opportunities right now"}
            </p>
            <p className="text-[var(--cc-color-text-secondary)] text-sm mt-1 max-w-xs">
              Check back soon — club admins post new opportunities regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((ev) => {
              const spotsLeft   = ev.volunteerLimit - acceptedCount(ev);
              const myApp       = myApplication(ev);
              const isAuthority = isAuthorityForEvent(ev);
              const catColor    = CAT_COLORS[ev.category] || CAT_COLORS.meeting;
              const dateStr     = ev.date ? fmt(ev.date) : "—";
              const statusBadge = myApp ? STATUS_BADGE[myApp.status] : null;

              return (
                <div
                  key={ev._id}
                  className="flex flex-col rounded-2xl border border-[var(--cc-color-border)] bg-[var(--cc-color-surface-elevated)] hover:bg-[var(--cc-color-surface-hover)] transition-all overflow-hidden"
                >
                  {/* Card body */}
                  <div className="px-5 pt-5 pb-4 border-b border-[var(--cc-color-border)] flex-1">
                    {/* Badges row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg border font-semibold ${catColor}`}>
                        {ev.category}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        spotsLeft <= 2
                          ? "bg-[var(--cc-color-warning-soft)] text-[var(--cc-color-warning)] border-[var(--cc-color-warning)]"
                          : "bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border-[var(--cc-color-success)]"
                      }`}>
                        {spotsLeft} slot{spotsLeft !== 1 ? "s" : ""} left
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      onClick={() => navigate(`/events/${ev._id}`)}
                      className="text-[15px] font-semibold text-[var(--cc-color-text-primary)] leading-snug mb-2 cursor-pointer hover:text-[var(--cc-color-success)] transition-colors"
                    >
                      {ev.title}
                    </h2>

                    {/* Meta */}
                    <div className="space-y-1.5 text-[12px] text-[var(--cc-color-text-muted)] mt-2">
                      <p className="flex items-center gap-1.5"><Calendar size={14} className="shrink-0" /> {dateStr}</p>
                      {ev.venue && <p className="flex items-center gap-1.5"><MapPin size={14} className="shrink-0" /> {ev.venue}</p>}
                      {ev.clubId?.name && <p className="flex items-center gap-1.5"><Landmark size={14} className="shrink-0" /> {ev.clubId.name}</p>}
                    </div>

                    {/* Skills needed */}
                    {ev.volunteerSkillsNeeded?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] uppercase tracking-widest text-[var(--cc-color-text-secondary)] mb-1.5">Looking for</p>
                        <div className="flex flex-wrap gap-1">
                          {ev.volunteerSkillsNeeded.map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 bg-[var(--cc-color-surface-hover)] border border-[var(--cc-color-border)] rounded-full text-[var(--cc-color-text-muted)]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-[var(--cc-color-text-secondary)] mb-1">
                        <span>{acceptedCount(ev)} / {ev.volunteerLimit} confirmed</span>
                        <span>{Math.round((acceptedCount(ev) / ev.volunteerLimit) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--cc-color-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--cc-color-success)] rounded-full transition-all"
                          style={{ width: `${Math.min(100, (acceptedCount(ev) / ev.volunteerLimit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card footer — CTA */}
                  <div className="px-5 py-4">
                    {!user ? (
                      <button
                        onClick={() => navigate("/login")}
                        className="w-full py-2.5 bg-[var(--cc-color-success)]/90 hover:bg-[var(--cc-color-success)] text-[var(--cc-color-on-brand)] rounded-xl text-sm font-semibold transition-colors"
                      >
                        Log in to Apply
                      </button>
                    ) : myApp ? (
                      /* Already applied — show status */
                      <div className="space-y-2">
                        <div className={`w-full text-center text-[12px] py-2 border rounded-xl font-medium ${statusBadge.cls}`}>
                          {statusBadge.label}
                        </div>
                        {myApp.status === "pending" && (
                          <button
                            onClick={() => handleWithdraw(ev)}
                            disabled={acting === ev._id}
                            className="w-full py-2 text-xs border border-[var(--cc-color-danger)]/40 text-[var(--cc-color-danger)] hover:bg-[var(--cc-color-danger-soft)] rounded-xl transition-colors disabled:opacity-40"
                          >
                            {acting === ev._id ? "Withdrawing…" : "Withdraw Application"}
                          </button>
                        )}
                      </div>
                    ) : isAuthority ? (
                      <div className="w-full text-center text-[12px] py-2 border rounded-xl font-medium bg-[var(--cc-color-background)] text-[var(--cc-color-text-muted)] border-[var(--cc-color-border)]">
                        Admin/Coordinator cannot volunteer
                      </div>
                    ) : (
                      <button
                        onClick={() => setApplyTarget(ev)}
                        className="w-full py-2.5 bg-[var(--cc-color-success)]/90 hover:bg-[var(--cc-color-success)] text-[var(--cc-color-on-brand)] rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <HandHelping size={16} /> Apply to Volunteer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── APPLY MODAL ── */}
      <Modal
        open={!!applyTarget}
        onClose={() => { setApplyTarget(null); setApplySkills(""); }}
        title="Apply to Volunteer"
        size="md"
      >
        <Modal.Body>
          <div className="space-y-4">
            {applyTarget && (
              <p className="text-body-sm text-text-muted">{applyTarget.title}</p>
            )}
            {/* Show preferred skills */}
            {applyTarget?.volunteerSkillsNeeded?.length > 0 && (
              <div className="p-3 rounded-xl bg-[var(--cc-color-surface-brand)] border border-[var(--cc-color-brand)]/30">
                <p className="text-[10px] uppercase tracking-widest text-[var(--cc-color-brand)] font-semibold mb-2">Looking for</p>
                <div className="flex flex-wrap gap-1">
                  {applyTarget.volunteerSkillsNeeded.map((s) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 bg-[var(--cc-color-brand)]/10 border border-[var(--cc-color-brand)]/30 rounded-full text-[var(--cc-color-brand)]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-text-muted text-body-sm">
              Your application will be reviewed by the admin before confirmation.
            </p>
            <div>
              <label className="block text-[11px] text-[var(--cc-color-text-muted)] uppercase tracking-widest mb-1.5">
                Your Skills (comma-separated, optional)
              </label>
              <input
                type="text"
                value={applySkills}
                onChange={(e) => setApplySkills(e.target.value)}
                placeholder="e.g. Photography, Stage Setup"
                className="w-full px-4 py-2.5 bg-surface-weak border border-border-subtle rounded-xl text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={() => { setApplyTarget(null); setApplySkills(""); }}
            className="px-4 py-2.5 border border-border-subtle text-text-muted rounded-xl text-body-sm hover:border-border-strong transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={applying}
            className="px-4 py-2.5 bg-[var(--cc-color-success)]/90 hover:bg-[var(--cc-color-success)] text-[var(--cc-color-on-brand)] rounded-xl text-body-sm font-semibold transition-colors disabled:opacity-50"
          >
            {applying ? "Submitting…" : "Submit Application"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[11px] text-[var(--cc-color-text-secondary)]">{label}</p>
    </div>
  );
}
