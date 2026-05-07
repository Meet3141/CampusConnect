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

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

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

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent]       = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);

  /* ── Fetch event + attendees ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const evRes = await api.get(`/events/${id}`);
        setEvent(evRes.data.data);

        if (user) {
          const [attRes, bkRes] = await Promise.allSettled([
            api.get(`/events/${id}/attendees`),
            api.get("/bookmarks"),
          ]);
          if (attRes.status === "fulfilled") setAttendees(attRes.value.data.data || []);
          if (bkRes.status === "fulfilled") {
            const mine = (bkRes.value.data.data || []).find(
              (b) => String(b.eventId) === id && b.eventType === "internal"
            );
            if (mine) setBookmarkId(mine._id);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load event.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  /* ── Derived state ── */
  const myRsvp = attendees.find((a) => String(a.userId?._id || a.userId) === String(user?._id));
  const isRegistered = myRsvp?.status === "registered";
  // H: volunteers is now an array of { userId, skills, volunteeredAt } subdocuments
  const isVolunteer = event?.volunteers?.some(
    (v) => String(v.userId?._id || v.userId) === String(user?._id)
  );
  const registeredCount = attendees.filter((a) => a.status === "registered").length;
  const isFull = event?.maxAttendees && registeredCount >= event.maxAttendees;
  const isOrgAdmin = user?.roles?.includes("orgAdmin");
  const isEventCreator = String(event?.createdBy?._id || event?.createdBy) === String(user?._id);
  const isClubAdminOfEvent =
    String(event?.clubId?.adminId?._id || event?.clubId?.adminId) === String(user?._id);
  const canDeleteEvent = isOrgAdmin || isEventCreator;
  const canReviewVolunteers = isOrgAdmin || isEventCreator || isClubAdminOfEvent;

  const handleRsvp = async () => {
    setActionLoading(true);
    try {
      await api.post(`/events/${id}/rsvp`);
      setAttendees((prev) => [
        ...prev,
        { userId: { _id: user._id, name: user.name, email: user.email }, status: "registered", registeredAt: new Date() },
      ]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to RSVP.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRsvp = async () => {
    setActionLoading(true);
    try {
      await api.post(`/events/${id}/cancel-rsvp`);
      setAttendees((prev) =>
        prev.map((a) =>
          String(a.userId?._id || a.userId) === String(user._id)
            ? { ...a, status: "cancelled" }
            : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVolunteer = async () => {
    setActionLoading(true);
    try {
      await api.post(`/events/${id}/volunteer`);
      // H: optimistic update — add subdocument shape to local state
      setEvent((prev) => ({
        ...prev,
        volunteers: [...(prev.volunteers || []), { userId: { _id: user._id }, skills: [] }],
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to volunteer.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (bookmarkId) {
        await api.delete(`/bookmarks/${bookmarkId}`);
        setBookmarkId(null);
      } else {
        const res = await api.post("/bookmarks", { eventId: id, eventType: "internal" });
        setBookmarkId(res.data.data._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Bookmark failed.");
    }
  };

  const handleReviewVolunteer = async (userId, action) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/events/${id}/volunteer/${userId}/review`, { action });
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
      alert(err.response?.data?.message || "Failed to review application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveVolunteer = async (userId) => {
    if (!window.confirm("Remove this volunteer?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/events/${id}/volunteer/${userId}`);
      setEvent((prev) => ({
        ...prev,
        volunteers: prev.volunteers.filter(
          (v) => String(v.userId?._id || v.userId) !== userId
        ),
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Delete event ── */
  const handleDeleteEvent = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api.delete(`/events/${id}`);
      navigate(-1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event.");
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
  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg} to-transparent`} />
        {event.image && (
          <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-[0.08]" />
        )}

        <div className="relative px-5 lg:px-6 pt-5 pb-6">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.07] ring-1 ring-white/[0.1] flex items-center justify-center text-3xl sm:text-4xl shrink-0">
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
                <span>📍 {event.venue}</span>
                {event.maxAttendees && <span>👥 {registeredCount}/{event.maxAttendees} spots</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              {user && event.status === "upcoming" && (
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
              {user && (
                <button onClick={toggleBookmark}
                  className="px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-sm transition-all whitespace-nowrap">
                  {bookmarkId ? "🔖 Bookmarked" : "🔖 Bookmark"}
                </button>
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
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">About this event</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">Details</h3>
              <dl className="space-y-3 text-sm">
                <InfoRow label="Date" value={dateStr} />
                <InfoRow label="Time" value={timeStr} />
                <InfoRow label="Venue" value={event.venue} />
                <InfoRow label="Category" value={event.category?.charAt(0).toUpperCase() + event.category?.slice(1)} />
                <InfoRow label="Status" value={event.status?.charAt(0).toUpperCase() + event.status?.slice(1)} />
                {event.maxAttendees && <InfoRow label="Capacity" value={`${registeredCount} / ${event.maxAttendees}`} />}
              </dl>
            </div>

            {/* Attendees preview */}
            {attendees.filter((a) => a.status === "registered").length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
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
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] text-slate-500">
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
          <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/10 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  🙋 Volunteer Applications
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {event.volunteers?.filter(v => v.status === "accepted").length ?? 0} / {event.volunteerLimit} accepted
                  {event.volunteerSkillsNeeded?.length > 0 && (
                    <span className="ml-2 text-slate-600">· Looking for: {event.volunteerSkillsNeeded.join(", ")}</span>
                  )}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${
                (event.volunteers?.filter(v => v.status === "accepted").length ?? 0) >= event.volunteerLimit
                  ? "bg-amber-950 text-amber-400 border-amber-800"
                  : "bg-emerald-950 text-emerald-400 border-emerald-800"
              }`}>
                {(event.volunteers?.filter(v => v.status === "accepted").length ?? 0) >= event.volunteerLimit
                  ? "Slots Full" : "Open"}
              </span>
            </div>

            {(!event.volunteers || event.volunteers.length === 0) ? (
              <p className="text-slate-600 text-sm text-center py-6">No applications yet.</p>
            ) : (
              <div className="space-y-2">
                {/* Pending */}
                {event.volunteers.filter(v => v.status === "pending").map((v) => {
                  const uid = String(v.userId?._id || v.userId);
                  return (
                    <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-950/20 border border-amber-900/30">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium">{v.userId?.name || "Unknown"}</p>
                        {v.skills?.length > 0 && (
                          <p className="text-[11px] text-slate-500 mt-0.5">Skills: {v.skills.join(", ")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-amber-400 border border-amber-800 bg-amber-950 px-2 py-0.5 rounded-full">Pending</span>
                        <button
                          onClick={() => handleReviewVolunteer(uid, "accept")}
                          disabled={actionLoading}
                          className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-40"
                        >✓ Accept</button>
                        <button
                          onClick={() => handleReviewVolunteer(uid, "reject")}
                          disabled={actionLoading}
                          className="px-3 py-1 text-xs border border-red-900/50 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-40"
                        >✕ Reject</button>
                      </div>
                    </div>
                  );
                })}

                {/* Accepted */}
                {event.volunteers.filter(v => v.status === "accepted").map((v) => {
                  const uid = String(v.userId?._id || v.userId);
                  return (
                    <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium">{v.userId?.name || "Unknown"}</p>
                        {v.skills?.length > 0 && (
                          <p className="text-[11px] text-slate-500 mt-0.5">Skills: {v.skills.join(", ")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-emerald-400 border border-emerald-800 bg-emerald-950 px-2 py-0.5 rounded-full">✓ Accepted</span>
                        <button
                          onClick={() => handleRemoveVolunteer(uid)}
                          disabled={actionLoading}
                          className="px-3 py-1 text-xs border border-red-900/50 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-40 text-[11px]"
                        >Remove</button>
                      </div>
                    </div>
                  );
                })}

                {/* Rejected */}
                {event.volunteers.filter(v => v.status === "rejected").map((v) => {
                  const uid = String(v.userId?._id || v.userId);
                  return (
                    <div key={uid} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] opacity-60">
                      <p className="text-sm text-slate-500">{v.userId?.name || "Unknown"}</p>
                      <span className="text-[10px] text-red-400 border border-red-900/40 px-2 py-0.5 rounded-full">✕ Rejected</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-white font-medium text-right max-w-[60%] truncate">{value}</dd>
    </div>
  );
}
