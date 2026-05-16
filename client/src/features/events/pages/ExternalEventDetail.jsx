/**
 * ExternalEventDetail.jsx
 * Single external event view.
 *
 * API: GET /external-events/:id  → { success, data: ExternalEvent }
 *      POST /bookmarks           → { success, data: bookmark }
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchExternalEventById,
  listBookmarks,
  createBookmark as createBookmarkApi,
  deleteBookmark as deleteBookmarkApi,
} from "../api";
import { InfoRow } from "../ui";

const CAT_META = {
  hackathon:   { emoji: "💻", bg: "from-indigo-900/50 to-blue-900/30",   badge: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  workshop:    { emoji: "🛠",  bg: "from-teal-900/50 to-cyan-900/30",    badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:     { emoji: "🎙",  bg: "from-sky-900/50 to-blue-900/30",     badge: "bg-sky-950 text-sky-300 border-sky-800" },
  cultural:    { emoji: "🎭", bg: "from-purple-900/50 to-pink-900/30",   badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:      { emoji: "⚡", bg: "from-emerald-900/50 to-green-900/30", badge: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  conference:  { emoji: "🏛",  bg: "from-amber-900/50 to-orange-900/30", badge: "bg-amber-950 text-amber-300 border-amber-800" },
  competition: { emoji: "🏆", bg: "from-rose-900/50 to-red-900/30",     badge: "bg-rose-950 text-rose-300 border-rose-800" },
};
const catOf = (k) => CAT_META[k] || CAT_META.conference;

export default function ExternalEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [event, setEvent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [bookmarkId, setBookmarkId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchExternalEventById(id);
        setEvent(res.data.data);

        if (user) {
          const bkRes = await listBookmarks();
          const mine = (bkRes.data.data || []).find(
            (b) => String(b.eventId) === id && b.eventType === "external"
          );
          if (mine) setBookmarkId(mine._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load event.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const toggleBookmark = async () => {
    try {
      if (bookmarkId) {
        await deleteBookmarkApi(bookmarkId);
        setBookmarkId(null);
      } else {
        const res = await createBookmarkApi(id, "external");
        setBookmarkId(res.data.data._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Bookmark failed.");
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
          <button onClick={() => navigate("/external-events")} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Back to External Events
          </button>
        </div>
      </div>
    );
  }

  const cat = catOf(event.category);
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "";
  const timeStr = event.date
    ? new Date(event.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";
  
  // Check if event date has passed
  const isEventExpired = event.date && new Date(event.date) < new Date();

  return (
    <div className="text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg} to-transparent`} />
        {event.posterUrl && (
          <img src={event.posterUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-[0.06]" />
        )}

        <div className="relative px-5 lg:px-6 pt-5 pb-6">
          <button onClick={() => navigate("/external-events")} className="group flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> External Events
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.07] ring-1 ring-white/[0.1] flex items-center justify-center text-3xl sm:text-4xl shrink-0">
              {cat.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium ${cat.badge}`}>
                  {event.category}
                </span>
                {event.isVerified && (
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                    ✓ Verified
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800 font-medium">
                  External
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{event.title}</h1>
              <p className="text-indigo-400/80 text-sm mt-2">🏫 {event.universityName}</p>

              <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-400">
                {dateStr && <span>📅 {dateStr}</span>}
                {timeStr && <span>🕐 {timeStr}</span>}
                {event.venue && <span>📍 {event.venue}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              {event.registrationLink && !isEventExpired && (
                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all text-center whitespace-nowrap shadow-lg hover:shadow-indigo-600/50 inline-block !text-white">
                  Register →
                </a>
              )}
              {event.registrationLink && isEventExpired && (
                <button disabled
                  className="px-6 py-3 bg-slate-700 text-slate-400 font-bold rounded-xl text-sm cursor-not-allowed text-center whitespace-nowrap opacity-50"
                  title="Event date has passed">
                  Registration Closed
                </button>
              )}
              {user && (
                <button onClick={toggleBookmark}
                  className="px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-sm transition-all whitespace-nowrap">
                  {bookmarkId ? "🔖 Bookmarked" : "🔖 Bookmark"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">About this event</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {event.posterUrl && (
              <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">Event Poster</h3>
                <img src={event.posterUrl} alt="Event poster" className="rounded-xl max-h-96 object-contain mx-auto" />
              </div>
            )}
          </div>

          <div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">Details</h3>
              <dl className="space-y-3 text-sm">
                <InfoRow label="University" value={event.universityName} />
                {dateStr && <InfoRow label="Date" value={dateStr} />}
                {timeStr && <InfoRow label="Time" value={timeStr} />}
                {event.venue && <InfoRow label="Venue" value={event.venue} />}
                <InfoRow label="Category" value={event.category?.charAt(0).toUpperCase() + event.category?.slice(1)} />
                <InfoRow label="Verified" value={event.isVerified ? "Yes" : "Pending"} />
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


