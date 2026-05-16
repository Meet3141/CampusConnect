/**
 * features/dashboard/pages/Dashboard.jsx
 * Main post-login hub — content only (sidebar is in AppLayout).
 *
 * Data fetching is handled by useDashboardData() in ../hooks.
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Button from "../../../components/ui/Button";
import { useDashboardData } from "../hooks";
import {
  Section,
  StatCard,
  ClubMiniCard,
  EventRow,
  ChatRow,
  BookmarkRow,
  EmptyState,
  DashboardSkeleton,
  styles,
} from "../ui";

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
export const catOf = (key) => CAT[key] || CAT.other;

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const { myClubs, events, chats, bookmarks, loading, stats } = useDashboardData(user);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={styles.page}>

      {/* ── Stat cards ── */}
      <div className={styles.statGrid}>
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
      <div className={styles.twoColumnGrid}>

        {/* Upcoming events */}
        <div className="lg:col-span-3">
          <Section title="Upcoming events" count={events.length} linkLabel="See all →" onLink={() => navigate("/clubs")}>
            {events.length === 0 ? (
              <EmptyState icon="📅" message="No upcoming events found." />
            ) : (
              <div className={styles.eventList}>
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
              <div className={styles.eventList}>
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
              <div className={styles.eventList}>
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
