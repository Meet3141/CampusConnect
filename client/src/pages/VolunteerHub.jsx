/**
 * VolunteerHub.jsx  (Track F)
 * Dedicated page for users who want to find volunteering opportunities.
 * Lists all upcoming events that have volunteering enabled.
 *
 * Route: /volunteers  (accessible to all logged-in users)
 * API:   GET /events?status=upcoming  → { success, data: Event[] }
 *        POST /events/:id/volunteer   → { success, message }
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CAT_META = {
  hackathon: { emoji: "💻", badge: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  workshop:  { emoji: "🛠",  badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:   { emoji: "🎙",  badge: "bg-sky-950 text-sky-300 border-sky-800" },
  cultural:  { emoji: "🎭", badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:    { emoji: "⚡", badge: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  meeting:   { emoji: "📋", badge: "bg-slate-800 text-slate-300 border-slate-700" },
};
const catOf = (k) => CAT_META[k] || CAT_META.meeting;

export default function VolunteerHub() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null); // eventId being processed

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/events", { params: { status: "upcoming", limit: 50 } });
        setEvents(res.data.data || []);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isVolunteered = (event) =>
    event.volunteers?.some(
      (v) => String(v.userId?._id || v.userId) === String(user?._id)
    );

  const isCreator = (event) =>
    String(event.createdBy?._id || event.createdBy) === String(user?._id);

  const isOrgAdmin = user?.roles?.includes("orgAdmin");

  const handleVolunteer = async (eventId) => {
    setActing(eventId);
    try {
      await api.post(`/events/${eventId}/volunteer`);
      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId
            ? {
                ...e,
                volunteers: [
                  ...(e.volunteers || []),
                  { userId: { _id: user._id, name: user.name }, skills: [] },
                ],
              }
            : e
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to volunteer.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-0 w-96 h-96 bg-emerald-700/8 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-1">
            Discover / Volunteer
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Volunteer{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Hub
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Find upcoming events where your skills can make a difference.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-9 h-9 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🙋</span>
            <p className="text-slate-400 text-lg font-medium">No upcoming events</p>
            <p className="text-slate-600 text-sm mt-1">Check back soon for volunteering opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {events.map((event) => {
              const cat         = catOf(event.category);
              const volunteered = isVolunteered(event);
              const creator     = isCreator(event) || isOrgAdmin;
              const d           = new Date(event.date);
              const dateStr     = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const timeStr     = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const volCount    = event.volunteers?.length ?? 0;

              return (
                <div
                  key={event._id}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-xl shrink-0">
                        {cat.emoji}
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-semibold shrink-0 ${cat.badge}`}>
                        {event.category}
                      </span>
                    </div>
                    <h2
                      className="text-base font-semibold text-white leading-snug cursor-pointer hover:text-indigo-300 transition-colors"
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      {event.title}
                    </h2>
                    {event.clubId?.name && (
                      <p className="text-[11px] text-slate-600 mt-1">🏛️ {event.clubId.name}</p>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4 space-y-1.5 text-[13px] text-slate-400">
                    <p>📅 {dateStr} · {timeStr}</p>
                    <p>📍 {event.venue}</p>
                    <p className="text-emerald-500/80">
                      🙋 {volCount} volunteer{volCount !== 1 ? "s" : ""} signed up
                    </p>
                  </div>

                  {/* Card footer */}
                  <div className="px-5 pb-5">
                    {creator ? (
                      <span className="block text-center text-[12px] text-slate-600 py-2 border border-white/[0.06] rounded-xl">
                        You're organizing this event
                      </span>
                    ) : volunteered ? (
                      <span className="block text-center text-[12px] text-emerald-400 py-2 border border-emerald-900/50 bg-emerald-950/30 rounded-xl">
                        ✓ You're a volunteer
                      </span>
                    ) : (
                      <button
                        onClick={() => handleVolunteer(event._id)}
                        disabled={acting === event._id}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {acting === event._id ? "Signing up…" : "🙋 Volunteer"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
