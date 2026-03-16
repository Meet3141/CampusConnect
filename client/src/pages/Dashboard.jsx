/**
 * Dashboard.jsx
 * Main post-login hub — content only (sidebar is in AppLayout).
 *
 * APIs called (all in parallel via Promise.allSettled):
 *   GET /api/clubs?limit=200   → filter client-side for user's clubs
 *   GET /api/events?limit=5    → upcoming events
 *   GET /api/chats             → user's chats
 *   GET /api/bookmarks         → user's bookmarks
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ─── Category cosmetics ─── */
const CAT = {
  technical: { emoji: "⚙️", bg: "bg-cyan-950",    badge: "bg-cyan-950 text-cyan-300 border-cyan-800" },
  cultural:  { emoji: "🎭", bg: "bg-purple-950",  badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:    { emoji: "⚡", bg: "bg-emerald-950", badge: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  academic:  { emoji: "📚", bg: "bg-amber-950",   badge: "bg-amber-950 text-amber-300 border-amber-800" },
  arts:      { emoji: "🎨", bg: "bg-rose-950",    badge: "bg-rose-950 text-rose-300 border-rose-800" },
  other:     { emoji: "🌐", bg: "bg-slate-800",   badge: "bg-slate-800 text-slate-300 border-slate-700" },
  hackathon: { emoji: "💻", bg: "bg-indigo-950",  badge: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  workshop:  { emoji: "🛠", bg: "bg-teal-950",    badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:   { emoji: "🎙", bg: "bg-sky-950",     badge: "bg-sky-950 text-sky-300 border-sky-800" },
  meeting:   { emoji: "📋", bg: "bg-slate-800",   badge: "bg-slate-800 text-slate-300 border-slate-700" },
};
const catOf = (key) => CAT[key] || CAT.other;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [myClubs,    setMyClubs]    = useState([]);
  const [events,     setEvents]     = useState([]);
  const [chats,      setChats]      = useState([]);
  const [bookmarks,  setBookmarks]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  /* ── Parallel fetch ── */
  useEffect(() => {
    if (!user?._id) return;

    const fetchAll = async () => {
      setLoading(true);

      const [clubsRes, eventsRes, chatsRes, bookmarksRes] = await Promise.allSettled([
        api.get("/clubs",     { params: { limit: 200 } }),
        api.get("/events",    { params: { limit: 5   } }),
        api.get("/chats"),
        api.get("/bookmarks"),
      ]);

      if (clubsRes.status === "fulfilled") {
        const all = clubsRes.value.data.data || [];
        const mine = all
          .filter((c) =>
            c.members?.some((m) => String(m.userId) === String(user._id))
          )
          .map((c) => ({
            ...c,
            myStatus: c.members.find(
              (m) => String(m.userId) === String(user._id)
            )?.status,
          }));
        setMyClubs(mine);
      }

      if (eventsRes.status === "fulfilled") {
        const now = new Date();
        const upcoming = (eventsRes.value.data.data || []).filter(
          (e) => new Date(e.date) > now
        );
        setEvents(upcoming.slice(0, 5));
      }

      if (chatsRes.status === "fulfilled") {
        setChats(chatsRes.value.data.data || []);
      }

      if (bookmarksRes.status === "fulfilled") {
        setBookmarks(bookmarksRes.value.data.data || []);
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  /* ── Derived stats ── */
  const stats = useMemo(() => {
    const activeClubs  = myClubs.filter((c) => c.myStatus === "active").length;
    const pendingClubs = myClubs.filter((c) => c.myStatus === "pending").length;
    const unreadChats  = chats.filter((c) => c.lastMessage).length;
    const totalBk      = bookmarks.length;
    const internalBk   = bookmarks.filter((b) => b.eventType === "internal").length;
    const externalBk   = totalBk - internalBk;
    return { activeClubs, pendingClubs, events: events.length, unreadChats, totalBk, internalBk, externalBk };
  }, [myClubs, events, chats, bookmarks]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="w-full px-5 lg:px-6 py-6 space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Clubs joined" value={stats.activeClubs}
          sub={stats.pendingClubs > 0 ? `${stats.pendingClubs} pending` : "all active"}
          subHighlight={stats.pendingClubs > 0}
          onClick={() => navigate("/my-clubs")}
        />
        <StatCard
          label="Upcoming events" value={stats.events}
          sub="next 5 soonest"
          onClick={() => navigate("/clubs")}
        />
        <StatCard
          label="Active chats" value={chats.length}
          sub={stats.unreadChats > 0 ? `${stats.unreadChats} with messages` : "no new messages"}
          onClick={() => navigate("/chats")}
        />
        <StatCard
          label="Bookmarks" value={stats.totalBk}
          sub={`${stats.internalBk} internal · ${stats.externalBk} external`}
          onClick={() => navigate("/bookmarks")}
        />
      </div>

      {/* ── My clubs ── */}
      <Section title="My clubs" count={myClubs.length} linkLabel="Browse all →" onLink={() => navigate("/clubs")}>
        {myClubs.length === 0 ? (
          <EmptyState icon="🏛️" message="You haven't joined any clubs yet." action="Explore Clubs" onAction={() => navigate("/clubs")} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {myClubs.slice(0, 6).map((club) => (
              <ClubMiniCard key={club._id} club={club} onClick={() => navigate(`/clubs/${club._id}`)} />
            ))}
          </div>
        )}
      </Section>

      {/* ── Two-column: events + (chats | bookmarks) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Upcoming events */}
        <div className="lg:col-span-3">
          <Section title="Upcoming events" count={events.length} linkLabel="See all →" onLink={() => navigate("/clubs")}>
            {events.length === 0 ? (
              <EmptyState icon="📅" message="No upcoming events found." />
            ) : (
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                {events.map((ev, i) => (
                  <EventRow key={ev._id} event={ev} last={i === events.length - 1} onClick={() => navigate(`/events/${ev._id}`)} />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Recent chats */}
          <Section title="Recent chats" count={chats.length} linkLabel="Open →" onLink={() => navigate("/chats")}>
            {chats.length === 0 ? (
              <EmptyState icon="💬" message="No chats yet." />
            ) : (
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                {chats.slice(0, 4).map((chat, i) => (
                  <ChatRow key={chat._id} chat={chat} last={i === Math.min(chats.length, 4) - 1} onClick={() => navigate(`/chats/${chat._id}`)} />
                ))}
              </div>
            )}
          </Section>

          {/* Bookmarks */}
          <Section title="Bookmarks" count={bookmarks.length} linkLabel="View all →" onLink={() => navigate("/bookmarks")}>
            {bookmarks.length === 0 ? (
              <EmptyState icon="🔖" message="No bookmarks saved." />
            ) : (
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                {bookmarks.slice(0, 4).map((bk, i) => (
                  <BookmarkRow key={bk._id} bookmark={bk} last={i === Math.min(bookmarks.length, 4) - 1} />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({ title, count, linkLabel, onLink, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {count > 0 && (
            <span className="text-[10px] font-mono tabular-nums px-1.5 py-px bg-white/[0.06] text-slate-500 rounded-md">
              {count}
            </span>
          )}
        </div>
        {linkLabel && onLink && (
          <button onClick={onLink} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            {linkLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, subHighlight, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-4 transition-all"
    >
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className="text-3xl font-semibold text-white tabular-nums leading-none">{value}</p>
      <p className={`text-xs mt-1.5 ${subHighlight ? "text-yellow-400" : "text-slate-600"}`}>
        {sub}
      </p>
    </button>
  );
}

function ClubMiniCard({ club, onClick }) {
  const cat = catOf(club.category);
  const STATUS = {
    active:   { label: "Member",  cls: "bg-emerald-950 text-emerald-300 border-emerald-800" },
    pending:  { label: "Pending", cls: "bg-yellow-950 text-yellow-300 border-yellow-800"   },
    rejected: { label: "Rejected",cls: "bg-red-950 text-red-400 border-red-900"            },
  };
  const st = STATUS[club.myStatus];

  return (
    <button
      onClick={onClick}
      className="group text-left flex items-center gap-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] transition-all"
    >
      <div className={`w-9 h-9 rounded-xl ${cat.bg} flex items-center justify-center text-lg shrink-0`}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
          {club.name}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">
          {club.memberCount ?? 0} member{club.memberCount !== 1 ? "s" : ""}
        </p>
      </div>
      {st && (
        <span className={`shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-semibold ${st.cls}`}>
          {st.label}
        </span>
      )}
    </button>
  );
}

function EventRow({ event, last, onClick }) {
  const d   = new Date(event.date);
  const day = d.getDate();
  const mon = d.toLocaleDateString("en-US", { month: "short" });
  const cat = catOf(event.category);

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-4 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left ${
        !last ? "border-b border-white/[0.06]" : ""
      }`}
    >
      <div className="w-9 shrink-0 text-center">
        <p className="text-base font-semibold text-white leading-none tabular-nums">{day}</p>
        <p className="text-[10px] text-slate-600 uppercase tracking-wide mt-0.5">{mon}</p>
      </div>
      <div className="w-px h-8 bg-white/[0.06] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
          {event.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {event.venue}</p>
      </div>
      <span className={`shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium ${cat.badge}`}>
        {event.category}
      </span>
    </button>
  );
}

function ChatRow({ chat, last, onClick }) {
  const timeLabel = chat.lastMessageTime ? formatRelativeTime(new Date(chat.lastMessageTime)) : "";
  const initials = chat.name
    ? chat.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const avatarColors = [
    "bg-indigo-950 text-indigo-300",
    "bg-purple-950 text-purple-300",
    "bg-emerald-950 text-emerald-300",
    "bg-amber-950 text-amber-300",
  ];
  const avatarCls = avatarColors[(chat.name?.length || 0) % avatarColors.length];

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left ${
        !last ? "border-b border-white/[0.06]" : ""
      }`}
    >
      <div className={`w-7 h-7 rounded-full ${avatarCls} flex items-center justify-center text-[11px] font-bold shrink-0`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{chat.name}</p>
        {chat.lastMessage && (
          <p className="text-[11px] text-slate-600 truncate mt-0.5">{chat.lastMessage}</p>
        )}
      </div>
      {timeLabel && <span className="text-[10px] text-slate-600 shrink-0">{timeLabel}</span>}
    </button>
  );
}

function BookmarkRow({ bookmark, last }) {
  const ev    = bookmark.event;
  const title = ev?.title || "Untitled";
  const cat   = catOf(ev?.category);
  const isExt = bookmark.eventType === "external";
  const dateLabel = ev?.date
    ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-white/[0.02] ${!last ? "border-b border-white/[0.06]" : ""}`}>
      <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center text-sm shrink-0`}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {isExt ? "External" : "Internal"} · {dateLabel}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message, action, onAction }) {
  return (
    <div className="flex flex-col items-center py-8 gap-3 text-center rounded-2xl border border-white/[0.06] border-dashed">
      <span className="text-3xl">{icon}</span>
      <p className="text-slate-500 text-xs max-w-[160px] leading-relaxed">{message}</p>
      {action && (
        <button onClick={onAction} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          {action} →
        </button>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="px-5 lg:px-6 py-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <div>
        <div className="h-4 w-24 bg-white/[0.04] rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-2">
          <div className="h-4 w-32 bg-white/[0.04] rounded mb-3" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-4 w-24 bg-white/[0.04] rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatRelativeTime(date) {
  const now   = new Date();
  const diffMs = now - date;
  const diffM  = Math.floor(diffMs / 60000);
  const diffH  = Math.floor(diffM / 60);
  const diffD  = Math.floor(diffH / 24);

  if (diffM < 1)  return "now";
  if (diffM < 60) return `${diffM}m`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7)  return `${diffD}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
