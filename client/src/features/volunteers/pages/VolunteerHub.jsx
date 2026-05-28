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

const CAT_COLORS = {
  hackathon: "text-indigo-400 bg-indigo-950/60 border-indigo-800/50",
  workshop:  "text-teal-400 bg-teal-950/60 border-teal-800/50",
  webinar:   "text-sky-400 bg-sky-950/60 border-sky-800/50",
  cultural:  "text-purple-400 bg-purple-950/60 border-purple-800/50",
  sports:    "text-emerald-400 bg-emerald-950/60 border-emerald-800/50",
  meeting:   "text-slate-400 bg-slate-800/60 border-slate-700/50",
};

const STATUS_BADGE = {
  pending:  { label: "⏳ Awaiting Review",  cls: "bg-amber-950 text-amber-400 border-amber-800" },
  accepted: { label: "✓ Accepted",          cls: "bg-emerald-950 text-emerald-400 border-emerald-800" },
  rejected: { label: "✕ Not Selected",      cls: "bg-red-950 text-red-400 border-red-800" },
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
    <div className="text-white min-h-screen">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-0 w-[500px] h-[300px] bg-emerald-700/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative px-5 lg:px-8 pt-8 pb-6">
          <p className="text-[10px] tracking-[0.2em] text-slate-600 uppercase font-mono mb-2">
            Campus / Volunteer Hub
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Volunteer{" "}
            <span style={{ background: 'linear-gradient(120deg, #004F9F, #00BCEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Opportunities
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl">
            Apply to volunteer for club events. Admins review and confirm your spot.
          </p>
          <div className="flex items-center gap-6 mt-5">
            <Stat label="Open Events"       value={events.length}   color="text-emerald-400" />
            <div className="w-px h-8 bg-white/[0.06]" />
            <Stat label="Available Slots"   value={totalSlots}      color="text-teal-400" />
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-5 lg:px-8 pt-6 pb-2">
        <div className="relative max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search events or clubs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600/50 transition-colors"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-5 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-9 h-9 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-4">
              <HandHelping size={16} className="text-emerald-400" />
            </div>
            <p className="text-slate-300 text-lg font-semibold">
              {search ? `No events matching "${search}"` : "No open volunteer opportunities right now"}
            </p>
            <p className="text-slate-600 text-sm mt-1 max-w-xs">
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
                  className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden"
                >
                  {/* Card body */}
                  <div className="px-5 pt-5 pb-4 border-b border-white/[0.05] flex-1">
                    {/* Badges row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg border font-semibold ${catColor}`}>
                        {ev.category}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        spotsLeft <= 2
                          ? "bg-amber-950 text-amber-400 border-amber-800"
                          : "bg-emerald-950 text-emerald-400 border-emerald-800"
                      }`}>
                        {spotsLeft} slot{spotsLeft !== 1 ? "s" : ""} left
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      onClick={() => navigate(`/events/${ev._id}`)}
                      className="text-[15px] font-semibold text-white leading-snug mb-2 cursor-pointer hover:text-emerald-300 transition-colors"
                    >
                      {ev.title}
                    </h2>

                    {/* Meta */}
                    <div className="space-y-1.5 text-[12px] text-slate-500 mt-2">
                      <p className="flex items-center gap-1.5"><Calendar size={14} className="shrink-0" /> {dateStr}</p>
                      {ev.venue && <p className="flex items-center gap-1.5"><MapPin size={14} className="shrink-0" /> {ev.venue}</p>}
                      {ev.clubId?.name && <p className="flex items-center gap-1.5"><Landmark size={14} className="shrink-0" /> {ev.clubId.name}</p>}
                    </div>

                    {/* Skills needed */}
                    {ev.volunteerSkillsNeeded?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">Looking for</p>
                        <div className="flex flex-wrap gap-1">
                          {ev.volunteerSkillsNeeded.map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full text-slate-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>{acceptedCount(ev)} / {ev.volunteerLimit} confirmed</span>
                        <span>{Math.round((acceptedCount(ev) / ev.volunteerLimit) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
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
                        className="w-full py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
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
                            className="w-full py-2 text-xs border border-red-900/40 text-red-400 hover:bg-red-950/30 rounded-xl transition-colors disabled:opacity-40"
                          >
                            {acting === ev._id ? "Withdrawing…" : "Withdraw Application"}
                          </button>
                        )}
                      </div>
                    ) : isAuthority ? (
                      <div className="w-full text-center text-[12px] py-2 border rounded-xl font-medium bg-slate-900 text-slate-400 border-slate-700">
                        Admin/Coordinator cannot volunteer
                      </div>
                    ) : (
                      <button
                        onClick={() => setApplyTarget(ev)}
                        className="w-full py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
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
      {applyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111] border border-white/[0.1] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
              <div>
                <h2 className="text-base font-bold text-white">Apply to Volunteer</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">{applyTarget.title}</p>
              </div>
              <button
                onClick={() => { setApplyTarget(null); setApplySkills(""); }}
                className="text-slate-600 hover:text-white text-xl leading-none"
              >×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Show preferred skills */}
              {applyTarget.volunteerSkillsNeeded?.length > 0 && (
                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30">
                  <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold mb-2">Looking for</p>
                  <div className="flex flex-wrap gap-1">
                    {applyTarget.volunteerSkillsNeeded.map((s) => (
                      <span key={s} className="text-[11px] px-2 py-0.5 bg-indigo-900/30 border border-indigo-800/40 rounded-full text-indigo-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-slate-400 text-sm">
                Your application will be reviewed by the admin before confirmation.
              </p>

              <div>
                <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-1.5">
                  Your Skills (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={applySkills}
                  onChange={(e) => setApplySkills(e.target.value)}
                  placeholder="e.g. Photography, Stage Setup"
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600/50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setApplyTarget(null); setApplySkills(""); }}
                  className="flex-1 py-2.5 border border-white/[0.1] text-slate-400 rounded-xl text-sm hover:border-white/[0.2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {applying ? "Submitting…" : "Submit Application"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[11px] text-slate-600">{label}</p>
    </div>
  );
}
