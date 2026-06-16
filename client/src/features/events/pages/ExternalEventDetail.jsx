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
import PageContainer from "../../../components/layout/PageContainer";
import { Code2, Wrench, Mic, Drama, Zap, Landmark, Trophy, Calendar, Clock, MapPin, University, Bookmark } from "lucide-react";

const CAT_META = {
  hackathon:   { Icon: Code2,    bg: "from-indigo-900/50 to-blue-900/30",   badge: "bg-[var(--cc-color-surface-brand)] text-[var(--cc-color-brand)] border-[var(--cc-color-brand)]" },
  workshop:    { Icon: Wrench,   bg: "from-teal-900/50 to-cyan-900/30",    badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:     { Icon: Mic,      bg: "from-sky-900/50 to-blue-900/30",     badge: "bg-sky-950 text-sky-300 border-sky-800" },
  cultural:    { Icon: Drama,    bg: "from-purple-900/50 to-pink-900/30",   badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:      { Icon: Zap,      bg: "from-emerald-900/50 to-green-900/30", badge: "bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border-[var(--cc-color-success)]" },
  conference:  { Icon: Landmark, bg: "from-amber-900/50 to-orange-900/30", badge: "bg-[var(--cc-color-warning-soft)] text-[var(--cc-color-warning)] border-[var(--cc-color-warning)]" },
  competition: { Icon: Trophy,   bg: "from-rose-900/50 to-red-900/30",     badge: "bg-rose-950 text-rose-300 border-rose-800" },
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
        <div className="w-10 h-10 rounded-full border-2 border-[var(--cc-color-brand)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-center">
        <div>
          <p className="text-[var(--cc-color-danger)] mb-4">{error || "Event not found."}</p>
          <button onClick={() => navigate("/external-events")} className="px-5 py-2 btn-primary rounded-xl text-sm transition-colors">
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
    <PageContainer inset className="text-[var(--cc-color-text-primary)]">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-6">
        <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg} to-transparent`} />
        {event.posterUrl && (
          <img src={event.posterUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-[0.06]" />
        )}

        <div className="relative px-5 lg:px-6 pt-5 pb-6">
          <button onClick={() => navigate("/external-events")} className="group flex items-center gap-2 text-[var(--cc-color-text-muted)] hover:text-[var(--cc-color-text-primary)] text-sm mb-6 transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> External Events
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--cc-color-surface-elevated)] ring-1 ring-[var(--cc-color-border-strong)] flex items-center justify-center shrink-0">
              {cat.Icon && <cat.Icon size={24} className="text-[var(--cc-color-text-primary)]/80" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium ${cat.badge}`}>
                  {event.category}
                </span>
                {event.isVerified && (
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border border-[var(--cc-color-success)] font-semibold">
                    ✓ Verified
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800 font-medium">
                  External
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{event.title}</h1>
              <p className="text-[var(--cc-color-brand)]/80 text-sm mt-2 flex items-center gap-1.5"><University size={14} className="shrink-0" /> {event.universityName}</p>

              <div className="flex flex-wrap gap-6 mt-4 text-sm text-[var(--cc-color-text-muted)]">
                {dateStr && <span className="flex items-center gap-1.5"><Calendar size={14} className="shrink-0" /> {dateStr}</span>}
                {timeStr && <span className="flex items-center gap-1.5"><Clock    size={24} className="shrink-0" /> {timeStr}</span>}
                {event.venue && <span className="flex items-center gap-1.5"><MapPin size={14} className="shrink-0" /> {event.venue}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              {event.registrationLink && !isEventExpired && (
                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer"
                  className="px-6 py-3 btn-primary font-bold rounded-xl text-sm transition-all text-center whitespace-nowrap shadow-lg inline-block">
                  Register →
                </a>
              )}
              {event.registrationLink && isEventExpired && (
                <button disabled
                  className="px-6 py-3 bg-[var(--cc-color-surface-elevated)] text-[var(--cc-color-text-muted)] font-bold rounded-xl text-sm cursor-not-allowed text-center whitespace-nowrap opacity-50"
                  title="Event date has passed">
                  Registration Closed
                </button>
              )}
              {user && (
                <button onClick={toggleBookmark}
                  className="px-5 py-2.5 bg-[var(--cc-color-surface-elevated)] border border-[var(--cc-color-border)] hover:border-[var(--cc-color-border-strong)] rounded-xl text-sm transition-all whitespace-nowrap flex items-center gap-2">
                  <Bookmark size={16} className={bookmarkId ? "fill-current" : ""} />
                  {bookmarkId ? "Bookmarked" : "Bookmark"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-1 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-2xl surface-primary p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-[var(--cc-color-text-secondary)] font-semibold mb-4">About this event</h3>
              <p className="text-[var(--cc-color-text-primary)] text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {event.posterUrl && (
              <div className="mt-4 rounded-2xl surface-primary p-5">
                <h3 className="text-[11px] uppercase tracking-widest text-[var(--cc-color-text-secondary)] font-semibold mb-4">Event Poster</h3>
                <img src={event.posterUrl} alt="Event poster" className="rounded-xl max-h-96 object-contain mx-auto" />
              </div>
            )}
          </div>

          <div>
            <div className="rounded-2xl surface-primary p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-[var(--cc-color-text-secondary)] font-semibold mb-4">Details</h3>
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
    </PageContainer>
  );
}


