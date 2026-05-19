/**
 * EventDetail.jsx
 * Single event page with RSVP/volunteer.
 *
 * API: GET /events/:id          → { success, data: Event } (clubId populated as {_id,name})
 *      GET /events/:id/attendees → { success, data: attendees[] } (userId populated)
 *      POST /events/:id/rsvp     → { success, message }
 *      POST /events/:id/cancel-rsvp → { success, message }
 *      POST /events/:id/volunteer   → { success, message }
 *      POST /bookmarks           → { success, data: bookmark }
 *      DELETE /bookmarks/:id     → { success, message }
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useEventDetail } from "../hooks";
import {
  rsvpEvent,
  cancelRsvp,
  volunteerForEvent,
  reviewVolunteer,
  removeVolunteer,
  deleteEvent,
  startEvent,
  restartEvent,
  endEvent,
  createBookmark,
  deleteBookmark,
} from "../api";
import { InfoRow, VolunteerPanel } from "../ui";

const EVENT_CAT = {
  hackathon: { emoji: "💻", bg: "from-indigo-900/50 to-blue-900/30",   badge: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  workshop:  { emoji: "🛠",  bg: "from-teal-900/50 to-cyan-900/30",    badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:   { emoji: "🎙",  bg: "from-sky-900/50 to-blue-900/30",     badge: "bg-sky-950 text-sky-300 border-sky-800" },
  cultural:  { emoji: "🎭", bg: "from-purple-900/50 to-pink-900/30",   badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:    { emoji: "⚡", bg: "from-emerald-900/50 to-green-900/30", badge: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  meeting:   { emoji: "📋", bg: "from-slate-800/50 to-slate-900/30",   badge: "bg-slate-800 text-slate-300 border-slate-700" },
};
const catOf = (k) => EVENT_CAT[k] || EVENT_CAT.meeting;

const STATUS_BADGE = {
  upcoming:  "bg-indigo-950 text-indigo-300 border-indigo-800",
  ongoing:   "bg-emerald-950 text-emerald-300 border-emerald-800",
  completed: "bg-slate-800 text-slate-400 border-slate-700",
  cancelled: "bg-red-950 text-red-400 border-red-900",
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0m";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const { event, setEvent, attendees, setAttendees, loading, error, bookmarkId, setBookmarkId } = useEventDetail(id, user);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Derived state ── */
  const myRsvp = attendees.find((a) => String(a.userId?._id || a.userId) === String(user?._id));
  const isRegistered = myRsvp?.status === "registered";
  const myVolunteerApplication = event?.volunteers?.find(
    (v) => String(v.userId?._id || v.userId) === String(user?._id)
  );
  const isVolunteer = Boolean(myVolunteerApplication);
  const registeredCount = attendees.filter((a) => a.status === "registered").length;
  const isFull = event?.maxAttendees && registeredCount >= event.maxAttendees;
  const isOrgAdmin = user?.roles?.includes("orgAdmin");
  const isEditor = user?.roles?.includes("editor");
  const isEventCreator = String(event?.createdBy?._id || event?.createdBy) === String(user?._id);
  const isClubAdminOfEvent =
    String(event?.clubId?.adminId?._id || event?.clubId?.adminId) === String(user?._id);
  const canDeleteEvent = isOrgAdmin || isEventCreator;
  const canReviewVolunteers = isOrgAdmin || isEventCreator || isClubAdminOfEvent;
  const canManageLifecycle = isOrgAdmin || isEventCreator || isClubAdminOfEvent;
  const isUpcoming = event?.status === "upcoming";
  const isOngoing = event?.status === "ongoing";
  const isCompleted = event?.status === "completed";
  const canApplyForVolunteer =
    !!user &&
    event?.status === "upcoming" &&
    event?.showOnVolunteerHub &&
    !isOrgAdmin &&
    !isEditor &&
    !isEventCreator &&
    !isClubAdminOfEvent &&
    !isVolunteer &&
    // do not show direct apply button to regular members; they should use Volunteer Hub
    !user?.roles?.includes("member");


  const handleRsvp = async () => {
    setActionLoading(true);
    try {
      await rsvpEvent(id);
      setAttendees((prev) => {
        const nextAttendee = {
          userId: { _id: user._id, name: user.name, email: user.email },
          status: "registered",
          registeredAt: new Date(),
        };

        const index = prev.findIndex((a) => String(a.userId?._id || a.userId) === String(user._id));
        if (index === -1) {
          return [...prev, nextAttendee];
        }

        const updated = [...prev];
        updated[index] = { ...updated[index], ...nextAttendee };
        return updated;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to RSVP.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRsvp = async () => {
    setActionLoading(true);
    try {
      await cancelRsvp(id);
      setAttendees((prev) =>
        prev.map((a) =>
          String(a.userId?._id || a.userId) === String(user._id)
            ? { ...a, status: "cancelled" }
            : a
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVolunteer = async () => {
    setActionLoading(true);
    try {
      await volunteerForEvent(id);
      setEvent((prev) => ({
        ...prev,
        volunteers: [
          ...(prev.volunteers || []),
          {
            userId: { _id: user._id, name: user.name, email: user.email },
            skills: [],
            status: "pending",
            appliedAt: new Date(),
          },
        ],
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to volunteer.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (bookmarkId) {
        await deleteBookmark(bookmarkId);
        setBookmarkId(null);
      } else {
        const res = await createBookmark(id, "internal");
        setBookmarkId(res.data.data._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Bookmark failed.");
    }
  };

  const handleReviewVolunteer = async (userId, action) => {
    setActionLoading(true);
    try {
      await reviewVolunteer(id, userId, action);
      // Update local state optimistically
      setEvent((prev) => ({
        ...prev,
        volunteers: prev.volunteers.map((v) =>
          String(v.userId?._id || v.userId) === userId
            ? { ...v, status: action === "accept" ? "accepted" : "rejected", reviewedAt: new Date() }
            : v
        ),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveVolunteer = async (userId) => {
    if (!window.confirm("Remove this volunteer?")) return;
    setActionLoading(true);
    try {
      await removeVolunteer(id, userId);
      setEvent((prev) => ({
        ...prev,
        volunteers: prev.volunteers.filter(
          (v) => String(v.userId?._id || v.userId) !== userId
        ),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Delete event ── */
  const handleDeleteEvent = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await deleteEvent(id);
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEvent = async () => {
    setActionLoading(true);
    try {
      const res = await startEvent(id);
      setEvent((prev) => ({ ...prev, ...res.data.data }));
      toast.success("Event started.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndEvent = async () => {
    if (!window.confirm("End this event now? No-shows will be processed immediately.")) return;
    setActionLoading(true);
    try {
      const res = await endEvent(id);
      setEvent((prev) => ({ ...prev, ...res.data.data }));
      toast.success("Event ended and no-shows processed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to end event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestartEvent = async () => {
    if (!window.confirm("Reopen this event? This will change the status back to ongoing.")) return;
    setActionLoading(true);
    try {
      const res = await restartEvent(id);
      setEvent((prev) => ({ ...prev, ...res.data.data }));
      toast.success("Event restarted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restart event.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-center">
        <div>
          <p className="text-red-400 mb-4">{error || "Event not found."}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const cat = catOf(event.category);
  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const d = parseDate(event.date) || parseDate(event.createdAt);
  const end = parseDate(event.endDate);
  const dateStr = d ? d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Date not set";
  const timeStr = d ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
  const endDateStr = end ? end.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "";
  const endTimeStr = end ? end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
  const durationMs = (d && end) ? Math.max(0, end.getTime() - d.getTime()) : 0;

  return (
    <div className="text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-linear-to-b ${cat.bg} to-transparent`} />
        {event.image && (
          <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-[0.08]" />
        )}

        <div className="relative px-5 lg:px-6 pt-5 pb-6">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/7 ring-1 ring-white/10 flex items-center justify-center text-3xl sm:text-4xl shrink-0">
              {cat.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-semibold ${STATUS_BADGE[event.status] || STATUS_BADGE.upcoming}`}>
                  {event.status}
                </span>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium ${cat.badge}`}>
                  {event.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{event.title}</h1>

              {event.clubId && (
                <button
                  onClick={() => navigate(`/clubs/${event.clubId._id || event.clubId}`)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 transition-colors"
                >
                  🏛️ {event.clubId.name || "Club"}
                </button>
              )}

              <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-400">
                <span>📅 {dateStr}</span>
                <span>🕐 {timeStr}</span>
                {end && durationMs > 0 && <span>⏳ {formatDuration(durationMs)}</span>}
                <span>📍 {event.venue}</span>
                {event.maxAttendees && <span>👥 {registeredCount}/{event.maxAttendees} spots</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              {/* Hide RSVP for orgAdmin and clubAdmin (they are handlers, not attendees) */}
              {user && isUpcoming && !isOrgAdmin && !isClubAdminOfEvent && (
                <>
                  {!isRegistered && !isFull && (
                    <button onClick={handleRsvp} disabled={actionLoading}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
                      {actionLoading ? "…" : "RSVP"}
                    </button>
                  )}
                  {isRegistered && (
                    <button onClick={handleCancelRsvp} disabled={actionLoading}
                      className="px-5 py-2.5 border border-red-900/60 hover:bg-red-950/40 text-red-400 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap">
                      Cancel RSVP
                    </button>
                  )}
                  {isFull && !isRegistered && (
                    <span className="px-5 py-2.5 bg-slate-800/60 text-slate-500 rounded-xl text-sm text-center">Event Full</span>
                  )}
                </>
              )}
              {user && canManageLifecycle && isUpcoming && (
                <button onClick={handleStartEvent} disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
                  {actionLoading ? "…" : "▶ Start Event"}
                </button>
              )}
              {user && canManageLifecycle && isOngoing && (
                <button onClick={handleEndEvent} disabled={actionLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
                  {actionLoading ? "…" : "■ End Event"}
                </button>
              )}
              {user && canManageLifecycle && isCompleted && (
                <>
                  <button onClick={handleRestartEvent} disabled={actionLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
                    {actionLoading ? "…" : "↺ Restart Event"}
                  </button>
                  <button onClick={() => navigate(`/events/${id}/attendance`)}
                    className="px-5 py-2.5 bg-indigo-950/40 border border-indigo-800 hover:bg-indigo-950/60 text-indigo-300 rounded-xl text-sm transition-colors whitespace-nowrap">
                    📊 View Analytics
                  </button>
                </>
              )}
              {canApplyForVolunteer && (
                <button onClick={handleVolunteer} disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
                  {actionLoading ? "…" : "Volunteer"}
                </button>
              )}
              {isVolunteer && event?.showOnVolunteerHub && (
                <span className="px-5 py-2.5 border border-emerald-900/60 bg-emerald-950/20 text-emerald-300 rounded-xl text-sm text-center whitespace-nowrap">
                  Volunteer Applied
                </span>
              )}
              {user && (
                <>
                  {(isEventCreator || isClubAdminOfEvent || isOrgAdmin) && (
                    <button onClick={() => navigate(`/events/${id}/edit`)}
                      className="px-5 py-2.5 bg-indigo-950/40 border border-indigo-800 hover:bg-indigo-950/60 text-indigo-300 rounded-xl text-sm transition-colors whitespace-nowrap">
                      ⚙️ Manage
                    </button>
                  )}
                  <button onClick={toggleBookmark}
                    className="px-5 py-2.5 bg-white/4 border border-white/8 hover:border-white/15 rounded-xl text-sm transition-all whitespace-nowrap">
                    {bookmarkId ? "🔖 Bookmarked" : "🔖 Bookmark"}
                  </button>
                </>
              )}
              {canDeleteEvent && (
                <button onClick={handleDeleteEvent} disabled={actionLoading}
                  className="px-5 py-2.5 border border-red-900/60 hover:bg-red-950/40 text-red-400 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap">
                  🗑 Delete Event
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/7 bg-white/2 p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">About this event</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/7 bg-white/2 p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">Details</h3>
              <dl className="space-y-3 text-sm">
                <InfoRow label="Date" value={dateStr} />
                <InfoRow label="Time" value={timeStr} />
                {end && (
                  <>
                    <InfoRow label="End Date" value={endDateStr} />
                    <InfoRow label="End Time" value={endTimeStr} />
                    {durationMs > 0 && <InfoRow label="Duration" value={formatDuration(durationMs)} />}
                  </>
                )}
                <InfoRow label="Venue" value={event.venue} />
                <InfoRow label="Category" value={event.category?.charAt(0).toUpperCase() + event.category?.slice(1)} />
                <InfoRow label="Status" value={event.status?.charAt(0).toUpperCase() + event.status?.slice(1)} />
                {event.maxAttendees && <InfoRow label="Capacity" value={`${registeredCount} / ${event.maxAttendees}`} />}
              </dl>
            </div>

            {(isOngoing || isCompleted) && (
              <div className="rounded-2xl border border-white/7 bg-white/2 p-5">
                <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">Attendance</h3>
                <div className="grid grid-cols-3 gap-3 text-center text-xs mb-4">
                  <div className="rounded-xl bg-white/4 p-3">
                    <div className="text-slate-500">Registered</div>
                    <div className="mt-1 text-white font-semibold">{registeredCount}</div>
                  </div>
                  <div className="rounded-xl bg-white/4 p-3">
                    <div className="text-slate-500">Attended</div>
                    <div className="mt-1 text-emerald-300 font-semibold">{event.attendedCount || 0}</div>
                  </div>
                  <div className="rounded-xl bg-white/4 p-3">
                    <div className="text-slate-500">No-shows</div>
                    <div className="mt-1 text-amber-300 font-semibold">{event.noShowCount || 0}</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/events/${id}/attendance`)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  {isCompleted ? "View Analytics" : "Open Attendance Panel"}
                </button>
              </div>
            )}

            {/* Attendees preview */}
            {attendees.filter((a) => a.status === "registered").length > 0 && (
              <div className="rounded-2xl border border-white/7 bg-white/2 p-5">
                <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">
                  Attendees ({registeredCount})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {attendees.filter((a) => a.status === "registered").slice(0, 12).map((a, i) => (
                    <div key={i} title={a.userId?.name}
                      className="w-8 h-8 rounded-full bg-indigo-950 ring-1 ring-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-300 uppercase select-none">
                      {(a.userId?.name || "?")[0]}
                    </div>
                  ))}
                  {registeredCount > 12 && (
                    <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-[10px] text-slate-500">
                      +{registeredCount - 12}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── Volunteer Applications Panel (admin only) ── */}
      {canReviewVolunteers && event.showOnVolunteerHub && (
        <div className="px-5 lg:px-6 pb-8">
          <VolunteerPanel
            volunteers={event.volunteers || []}
            volunteerLimit={event.volunteerLimit}
            volunteerSkillsNeeded={event.volunteerSkillsNeeded}
            onReview={handleReviewVolunteer}
            onRemove={handleRemoveVolunteer}
            actionLoading={actionLoading}
          />
        </div>
      )}
    </div>
  );
}


