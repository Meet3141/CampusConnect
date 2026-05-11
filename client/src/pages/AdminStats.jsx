/**
 * AdminStats.jsx
 * Platform analytics dashboard.
 *
 * Pulls data from existing public/auth endpoints — no dedicated stats API needed.
 *
 * APIs called (all via Promise.allSettled):
 *   GET /api/clubs?limit=200          → total clubs, category breakdown
 *   GET /api/events?limit=200         → total events, status + category breakdown
 *   GET /api/external-events?limit=1  → meta.total for count
 *   GET /api/external-events?verified=true&limit=1  → verified count
 *   GET /api/bookmarks                → total bookmarks (auth)
 *   GET /api/chats                    → total chats (auth)
 *
 * Access: orgAdmin or clubAdmin (clubAdmins see limited stats)
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORY_COLORS = {
  technical: "#06b6d4", cultural: "#a855f7", sports: "#10b981",
  academic:  "#f59e0b", arts:     "#f43f5e", other:  "#6b7280",
  hackathon: "#6366f1", workshop: "#14b8a6", webinar: "#0ea5e9",
  cultural2: "#a855f7", sports2:  "#10b981", meeting: "#64748b",
  conference: "#d97706", competition: "#e11d48",
};

const STAT_CARD_THEMES = [
  { label: "Total Clubs",     icon: "🏛️", accent: "text-indigo-400",  ring: "ring-indigo-500/20", bg: "bg-indigo-950/30" },
  { label: "Total Events",    icon: "📅", accent: "text-violet-400",  ring: "ring-violet-500/20", bg: "bg-violet-950/30" },
  { label: "External Events", icon: "🌐", accent: "text-teal-400",    ring: "ring-teal-500/20",   bg: "bg-teal-950/30"   },
  { label: "Verified",        icon: "✅", accent: "text-emerald-400", ring: "ring-emerald-500/20",bg: "bg-emerald-950/30"},
  { label: "Active Chats",    icon: "💬", accent: "text-sky-400",     ring: "ring-sky-500/20",    bg: "bg-sky-950/30"    },
  { label: "Bookmarks",       icon: "🔖", accent: "text-rose-400",    ring: "ring-rose-500/20",   bg: "bg-rose-950/30"   },
];

/* Simple inline bar chart — no external deps */
function BarChart({ data, colorMap }) {
  if (!data || data.length === 0) return (
    <p className="text-cc-muted text-sm py-4 text-center">No data</p>
  );
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.map(({ key, count }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-[11px] text-cc-muted capitalize w-24 shrink-0 truncate">{key}</span>
          <div className="flex-1 h-2 bg-cc-soft rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((count / max) * 100)}%`,
                backgroundColor: colorMap[key] || "#6366f1",
              }}
            />
          </div>
          <span className="text-[11px] text-cc-muted tabular-nums w-8 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

/* Donut-style ring stat */
function RingCard({ value, total, label, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const radius = 28;
  const circ   = 2 * Math.PI * radius;
  const dash   = (pct / 100) * circ;
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-cc-soft bg-cc-surface-weak">
      <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">{pct}%</text>
      </svg>
      <div>
        <p className="text-xl font-semibold text-cc tabular-nums">{value}</p>
        <p className="text-[11px] text-cc-muted mt-0.5 leading-snug">{label}</p>
      </div>
    </div>
  );
}

export default function AdminStats() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const isOrgAdmin  = user?.roles?.includes("orgAdmin");
  const isClubAdmin = user?.roles?.includes("clubAdmin");
  const canView     = isOrgAdmin || isClubAdmin;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canView) return;
    const fetchAll = async () => {
      const [clubsRes, eventsRes, extAllRes, extVerifiedRes, chatsRes, bkRes] =
        await Promise.allSettled([
          api.get("/clubs",           { params: { limit: 200 } }),
          api.get("/events",          { params: { limit: 200 } }),
          api.get("/external-events", { params: { limit: 1 } }),
          api.get("/external-events", { params: { limit: 1, verified: "true" } }),
          api.get("/chats"),
          api.get("/bookmarks"),
        ]);

      const clubs    = clubsRes.status    === "fulfilled" ? clubsRes.value.data.data    || [] : [];
      const events   = eventsRes.status   === "fulfilled" ? eventsRes.value.data.data   || [] : [];
      const extTotal = extAllRes.status      === "fulfilled" ? extAllRes.value.data.meta?.total      || 0 : 0;
      const extVerif = extVerifiedRes.status === "fulfilled" ? extVerifiedRes.value.data.meta?.total  || 0 : 0;
      const chats    = chatsRes.status    === "fulfilled" ? chatsRes.value.data.data    || [] : [];
      const bookmarks = bkRes.status      === "fulfilled" ? bkRes.value.data.data       || [] : [];

      setData({ clubs, events, extTotal, extVerif, chats, bookmarks });
      setLoading(false);
    };
    fetchAll();
  }, [canView]);

  /* ── Derived analytics ── */
  const analytics = useMemo(() => {
    if (!data) return null;
    const { clubs, events, extTotal, extVerif, chats, bookmarks } = data;

    /* Club category breakdown */
    const clubsByCategory = clubs.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

    /* Event category breakdown */
    const eventsByCategory = events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {});

    /* Event status breakdown */
    const eventsByStatus = events.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});

    /* Total members across all clubs */
    const totalActiveMembers = clubs.reduce((sum, c) => sum + (c.memberCount || 0), 0);

    /* Upcoming events */
    const now = new Date();
    const upcomingCount = events.filter((e) => new Date(e.date) > now && e.status === "upcoming").length;

    return {
      clubTotal:       clubs.length,
      eventTotal:      events.length,
      extTotal,
      extVerif,
      chatTotal:       chats.length,
      bookmarkTotal:   bookmarks.length,
      totalActiveMembers,
      upcomingCount,
      clubsByCategory: Object.entries(clubsByCategory).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
      eventsByCategory: Object.entries(eventsByCategory).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
      eventsByStatus:  Object.entries(eventsByStatus).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    };
  }, [data]);

  /* ── Permission gate ── */
  if (!canView) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-xl font-semibold text-cc mb-2">Access Restricted</h2>
          <p className="text-cc-muted text-sm">Analytics are available to club and org admins only.</p>
          <button onClick={() => navigate("/dashboard")}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-cc-muted text-xs tracking-widest uppercase font-mono">Crunching numbers…</p>
        </div>
      </div>
    );
  }

  const a = analytics;
  const STATUS_COLORS = {
    upcoming: "#6366f1", ongoing: "#10b981", completed: "#64748b", cancelled: "#ef4444",
  };

  return (
    <div className="text-cc">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-cc-soft">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-0 w-96 h-80 bg-violet-700/5 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-700/5 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-cc-muted uppercase font-mono mb-3">
            Admin / Analytics
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Platform{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Analytics
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Live snapshot — data pulled from the live database.
          </p>
        </div>
      </div>

      <div className="px-5 lg:px-6 py-6 space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { value: a.clubTotal,         ...STAT_CARD_THEMES[0], sub: `${a.totalActiveMembers} total members` },
            { value: a.eventTotal,         ...STAT_CARD_THEMES[1], sub: `${a.upcomingCount} upcoming` },
            { value: a.extTotal,           ...STAT_CARD_THEMES[2], sub: "cross-university" },
            { value: a.extVerif,           ...STAT_CARD_THEMES[3], sub: `${a.extTotal - a.extVerif} still pending` },
            { value: a.chatTotal,          ...STAT_CARD_THEMES[4], sub: "club + event chats" },
            { value: a.bookmarkTotal,      ...STAT_CARD_THEMES[5], sub: "saved by you" },
          ].map(({ value, label, icon, accent, ring, bg, sub }) => (
            <div key={label} className={`rounded-2xl border border-cc-soft ${bg} p-5`}>
              <div className={`w-9 h-9 rounded-xl ${bg} ring-1 ${ring} flex items-center justify-center text-xl mb-3`}>
                {icon}
              </div>
              <p className={`text-3xl font-bold tabular-nums ${accent}`}>{value}</p>
              <p className="text-xs text-cc-muted mt-1">{label}</p>
              <p className="text-[11px] text-cc-muted mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Clubs by category */}
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">
              Clubs by category
            </h3>
            <BarChart data={a.clubsByCategory} colorMap={CATEGORY_COLORS} />
          </div>

          {/* Events by category */}
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">
              Events by category
            </h3>
            <BarChart data={a.eventsByCategory} colorMap={CATEGORY_COLORS} />
          </div>

          {/* Events by status */}
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">
              Events by status
            </h3>
            <BarChart data={a.eventsByStatus} colorMap={STATUS_COLORS} />
          </div>
        </div>

        {/* ── Ring stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <RingCard
            value={a.extVerif}
            total={a.extTotal}
            label="External events verified"
            color="#10b981"
          />
          <RingCard
            value={a.upcomingCount}
            total={a.eventTotal}
            label="Events that are upcoming"
            color="#6366f1"
          />
          <RingCard
            value={a.extTotal - a.extVerif}
            total={a.extTotal}
            label="External events pending review"
            color="#f59e0b"
          />
        </div>

        {/* ── Quick actions ── */}
        {isOrgAdmin && (
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/admin")}
                className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-700/40 text-amber-300 rounded-xl text-sm transition-colors">
                🏛️ Manage Clubs
              </button>
              <button onClick={() => navigate("/admin/verify")}
                className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-700/40 text-emerald-300 rounded-xl text-sm transition-colors">
                ✓ Verify Events {a.extTotal - a.extVerif > 0 && `(${a.extTotal - a.extVerif})`}
              </button>
              <button onClick={() => navigate("/clubs/create")}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-700/40 text-indigo-300 rounded-xl text-sm transition-colors">
                + New Club
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
