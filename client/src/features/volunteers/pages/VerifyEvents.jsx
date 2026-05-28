/**
 * VerifyEvents.jsx
 * Editor / Org-Admin queue for verifying external events.
 *
 * API:
 *   GET   /api/external-events?verified=false&page=&limit=
 *          { success, data: ExternalEvent[], meta }
 *
 *   PATCH /api/external-events/:id/verify
 *          { success, data: ExternalEvent }
 *         Requires: editor or orgAdmin role
 *
 * Access: roles includes "editor" OR "orgAdmin"
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { Code2, Wrench, Mic, Drama, Zap, Landmark, Trophy, Globe, Calendar, MapPin, Lock, University, CheckCircle2 } from "lucide-react";

const CAT_META = {
  hackathon:   { Icon: Code2,    badge: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  workshop:    { Icon: Wrench,   badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:     { Icon: Mic,      badge: "bg-sky-950 text-sky-300 border-sky-800" },
  cultural:    { Icon: Drama,    badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:      { Icon: Zap,      badge: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  conference:  { Icon: Landmark, badge: "bg-amber-950 text-amber-300 border-amber-800" },
  competition: { Icon: Trophy,   badge: "bg-rose-950 text-rose-300 border-rose-800" },
};
const catOf = (k) => CAT_META[k] || CAT_META.cultural;

// Return true only when value can be parsed into a valid Date
function isValidDate(val) {
  if (!val) return false;
  const d = new Date(val);
  return !Number.isNaN(d.getTime());
}

export default function VerifyEvents() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const toast = useToast();

  const canVerify =
    user?.roles?.includes("editor") || user?.roles?.includes("orgAdmin");

  const [events, setEvents]   = useState([]);
  const [meta, setMeta]       = useState({ total: 0, page: 1, limit: 15 });
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [tab, setTab]         = useState("unverified"); // "unverified" | "verified"

  /* ── Fetch ── */
  const fetchEvents = useCallback(async (page = 1, verified = false) => {
    setLoading(true);
    try {
      const res = await api.get("/external-events", {
        params: { verified: String(verified), page, limit: 15 },
      });
      setEvents(res.data.data || []);
      setMeta(res.data.meta || { total: 0, page: 1, limit: 15 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load events.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents(1, tab === "verified");
  }, [fetchEvents, tab]);

  /* ── Verify → PATCH /api/external-events/:id/verify ── */
  const handleVerify = async (eventId) => {
    setVerifyingId(eventId);
    try {
      await api.patch(`/external-events/${eventId}/verify`);
      // Remove from unverified list immediately
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed.");
    } finally {
      setVerifyingId(null);
    }
  };

  /* ── Permission gate ── */
  if (!canVerify) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-800">
            <Lock size={16} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm">
            Only <span className="text-indigo-400">Editors</span> and{" "}
            <span className="text-indigo-400">Org Admins</span> can verify events.
          </p>
          <button onClick={() => navigate("/external-events")}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/3 w-80 h-80 bg-[#004F9F]/5 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-0">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-3">
            Admin / External Events / Verify
          </p>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Verify{" "}
                <span style={{ background: 'linear-gradient(120deg, #004F9F, #00BCEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Events
                </span>
              </h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Review and approve external events before they appear as verified.
              </p>
            </div>
            {tab === "unverified" && meta.total > 0 && (
              <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-950/40 border border-yellow-800/50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-300 text-sm font-medium tabular-nums">
                  {meta.total} awaiting review
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-white/[0.06] -mb-px">
            {[
              { key: "unverified", label: "Needs Review" },
              { key: "verified",   label: "Verified"     },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  tab === key
                    ? "border-[#1F6BAD] text-[#5BB8E8]"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-800">
              {tab === "unverified"
                ? <CheckCircle2 size={16} className="text-[#5BB8E8]" />
                : <Globe size={16} className="text-slate-400" />}
            </div>
            <p className="text-white font-semibold mb-1">
              {tab === "unverified" ? "All clear!" : "No verified events yet"}
            </p>
            <p className="text-slate-500 text-sm">
              {tab === "unverified"
                ? "No external events are awaiting verification."
                : "Verified events will appear here."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((ev) => {
                const cat = catOf(ev.category);
                return (
                  <div key={ev._id}
                    className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] p-5 transition-all flex flex-col gap-3">

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium ${cat.badge}`}>
                        {ev.category}
                      </span>
                      {ev.isVerified ? (
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#1A4F7F] text-[#5BB8E8] border border-[#2D6A9F] font-semibold">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-300 border border-yellow-800 font-semibold">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2">
                        {ev.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-0.5 flex items-center gap-1"><University size={14} className="shrink-0" /> {ev.universityName}</p>
                      {isValidDate(ev.date) && (
                        <p className="text-[11px] text-slate-500 mb-0.5 flex items-center gap-1">
                          <Calendar size={14} className="shrink-0" />
                          {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                      {ev.venue && <p className="text-[11px] text-slate-500 mb-0.5 flex items-center gap-1"><MapPin size={14} className="shrink-0" /> {ev.venue}</p>}
                      {ev.description && (
                        <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Registration link */}
                    {ev.registrationLink && (
                      <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors truncate">
                        {ev.registrationLink}
                      </a>
                    )}

                    {/* Action */}
                    {tab === "unverified" && (
                      <button
                        onClick={() => handleVerify(ev._id)}
                        disabled={verifyingId === ev._id}
                        className="w-full py-2.5 bg-[#1A4F7F]/60 hover:bg-[#1A4F7F]/80 border border-[#2D6A9F]/70 hover:border-[#1F6BAD] text-[#5BB8E8] rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1">
                        {verifyingId === ev._id ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-[#5BB8E8]/30 border-t-[#5BB8E8] rounded-full animate-spin" />
                            Verifying…
                          </span>
                        ) : (
                          "✓ Verify & Publish"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.total > meta.limit && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button onClick={() => fetchEvents(meta.page - 1, tab === "verified")} disabled={meta.page <= 1}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-400 text-sm hover:border-white/[0.15] hover:text-white transition-all disabled:opacity-30">
                  ← Prev
                </button>
                <span className="text-slate-600 text-sm">
                  {meta.page} / {Math.ceil(meta.total / meta.limit)}
                </span>
                <button onClick={() => fetchEvents(meta.page + 1, tab === "verified")} disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-slate-400 text-sm hover:border-white/[0.15] hover:text-white transition-all disabled:opacity-30">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
