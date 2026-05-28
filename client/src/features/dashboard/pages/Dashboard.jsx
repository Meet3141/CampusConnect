/**
 * features/dashboard/pages/Dashboard.jsx
 * Phase 6 — Compact Operational Command Centre
 *
 * Structure:
 *   1. Page header (animated greeting + quick-action strip)
 *   2. Activity pulse strip (live campus stats)
 *   3. My Clubs (staggered, horizontal scroll on mobile, latest event sub-line)
 *   4. "You might like" recommended events row
 *   5. Dashboard split: events (with live indicator + capacity bar) + chats/bookmarks
 */

import { useNavigate } from "react-router-dom";
import { Bookmark, Building2, CalendarDays, MessageCircle, Radio } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useDashboardData, useMonthlyCalendarEvents } from "../hooks";
import { styles } from "../ui/styles";
import {
  Section,
  ClubMiniCard,
  EventRow,
  ChatRow,
  BookmarkRow,
  EmptyState,
  DashboardSkeleton,
  ActivityStrip,
  QuickActions,
  RecommendedRow,
  MonthlyCalendar,
} from "../ui";
import EventCard from "../../../components/data-display/EventCard";
import { CLUB_CATEGORY_META, EVENT_CATEGORY_META } from "../../../theme";

const FALLBACK_META = { Icon: null, badge: "bg-slate-800 text-slate-300 border-slate-700", gradient: "from-slate-800/50 to-slate-700/50" };
export const catOf = (key) => CLUB_CATEGORY_META[key] || EVENT_CATEGORY_META[key] || FALLBACK_META;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/* ── Compact dashboard page header ── */
function DashboardPageHeader({ name, onCreateEvent, onBrowseClubs, onOpenChats }) {
  const firstName = name ? name.split(" ")[0] : "";
  return (
    <div className="relative overflow-hidden border-b border-cc-soft">
      {/* Semantic glow blobs — theme-agnostic via CSS variables */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-72 h-32 bg-primary-soft/30 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/3 w-56 h-32 bg-accent-soft/20 rounded-full blur-3xl" />
      </div>

      <div className="relative cc-content-padding pt-5 pb-4">
        <p className="text-micro uppercase tracking-widest text-cc-muted font-mono mb-2 animate-text-reveal">
          {getTodayLabel()}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-display-lg font-heading text-cc leading-tight animate-text-reveal" style={{ animationDelay: "60ms" }}>
            {getGreeting()},{" "}
            <span style={{ background: 'linear-gradient(120deg, #004F9F, #00BCEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {firstName || "there"}
            </span>
          </h1>
          <QuickActions
            onCreateEvent={onCreateEvent}
            onBrowseClubs={onBrowseClubs}
            onOpenChats={onOpenChats}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const { myClubs, events, ongoingEvents, chats, bookmarks, loading, stats } = useDashboardData(user);
  const {
    events: calendarEvents,
    loading: calendarLoading,
    monthStart,
  } = useMonthlyCalendarEvents();


  if (loading) return <DashboardSkeleton />;

  // Split events for layout
  const heroEvent     = events[0] || null;
  const compactEvents = events.slice(1);

  // Recommended events: events from clubs the user has not attended (simple heuristic: all events minus hero)
  const recommended = events.filter((_, i) => i > 0).slice(0, 3);

  // Build latest-event lookup for clubs
  const latestEventByClub = {};
  [...events, ...ongoingEvents].forEach((ev) => {
    if (ev.clubId && !latestEventByClub[ev.clubId]) {
      latestEventByClub[ev.clubId] = ev;
    }
  });

  return (
    <div className="stack-lg pb-10">

      {/* ── Page header ── */}
      <DashboardPageHeader
        name={user?.name}
        onCreateEvent={() => navigate("/clubs")}
        onBrowseClubs={() => navigate("/clubs")}
        onOpenChats={() => navigate("/chats")}
      />

      {/* ── Activity pulse strip ── */}
      <ActivityStrip stats={stats} />

      {/* ── Body: consistent horizontal padding via cc-content-wrapper ── */}
      <div className="cc-content-wrapper stack-lg">

        {/* ── My Clubs + Recommended — grouped surface ── */}
        <div className="cc-section-group stack-md">
          {/* ── My Clubs ── */}
          <Section
            title="My clubs"
            count={myClubs.length}
            linkLabel="Browse all →"
            onLink={() => navigate("/clubs")}
          >
            {myClubs.length === 0 ? (
              <EmptyState icon={Building2} message="You haven't joined any clubs yet." action="Explore Clubs" onAction={() => navigate("/clubs")} />
            ) : (
              /* Mobile: horizontal scroll / Desktop: grid */
              <div className="cc-horizontal-scroll sm:grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-3">
                {myClubs.slice(0, 6).map((club, i) => (
                  <ClubMiniCard
                    key={club._id}
                    club={club}
                    onClick={() => navigate(`/clubs/${club._id}`)}
                    latestEvent={latestEventByClub[club._id]}
                    style={{ minWidth: "240px" }}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* ── Recommended events ── */}
          {recommended.length > 0 && (
            <RecommendedRow events={recommended} onEventClick={(id) => navigate(`/events/${id}`)} />
          )}
        </div>

        {/* ── Dashboard widgets ── */}
        <div className="cc-dashboard-overview-grid">
          <div className="cc-dashboard-overview-column">
          <Section
            title="Upcoming events"
            count={events.length}
            linkLabel="See all →"
            onLink={() => navigate("/events")}
          >
            {events.length === 0 ? (
              <EmptyState icon={CalendarDays} message="No upcoming events found." />
            ) : (
              <div className="space-y-2">
                {heroEvent && (
                  <EventCard
                    event={heroEvent}
                    variant="hero"
                    index={0}
                    onClick={() => navigate(`/events/${heroEvent._id}`)}
                  />
                )}
                {compactEvents.length > 0 && (
                  <div className={styles.eventList}>
                    {compactEvents.map((ev, i) => (
                      <EventRow
                        key={ev._id}
                        event={ev}
                        last={i === compactEvents.length - 1}
                        onClick={() => navigate(`/events/${ev._id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section
            title="Ongoing events"
            count={ongoingEvents.length}
            linkLabel="See all →"
            onLink={() => navigate("/events")}
          >
            {ongoingEvents.length === 0 ? (
              <EmptyState icon={Radio} message="No ongoing events right now." />
            ) : (
              <div className={styles.eventList}>
                {ongoingEvents.map((ev, i) => (
                  <EventRow
                    key={ev._id}
                    event={ev}
                    last={i === ongoingEvents.length - 1}
                    onClick={() => navigate(`/events/${ev._id}`)}
                  />
                ))}
              </div>
            )}
          </Section>
          </div>

          <div className="cc-dashboard-overview-column">
          <Section
            title="Recent chats"
            count={chats.length}
            linkLabel="Open →"
            onLink={() => navigate("/chats")}
          >
            {chats.length === 0 ? (
              <EmptyState icon={MessageCircle} message="No chats yet." />
            ) : (
              <div className={styles.eventList}>
                {chats.slice(0, 4).map((chat, i) => (
                  <ChatRow
                    key={chat._id}
                    chat={chat}
                    last={i === Math.min(chats.length, 4) - 1}
                    onClick={() => navigate(`/chats/${chat._id}`)}
                  />
                ))}
              </div>
            )}
          </Section>
          <Section
            title="Bookmarks"
            count={bookmarks.length}
            linkLabel="View all →"
            onLink={() => navigate("/bookmarks")}
          >
            {bookmarks.length === 0 ? (
              <EmptyState icon={Bookmark} message="No bookmarks saved." />
            ) : (
              <div className={styles.eventList}>
                {bookmarks.slice(0, 4).map((bk, i) => (
                  <BookmarkRow
                    key={bk._id}
                    bookmark={bk}
                    last={i === Math.min(bookmarks.length, 4) - 1}
                  />
                ))}
              </div>
            )}
          </Section>
          </div>

          <div className="cc-dashboard-overview-column">
          <Section
            title="Monthly calendar"
            count={calendarEvents.length}
          >
            <MonthlyCalendar
              events={calendarEvents}
              loading={calendarLoading}
              monthStart={monthStart}
              onEventClick={(ev) => {
                if (!ev?.id) return;
                const base = ev.source === "external" ? "/external-events" : "/events";
                navigate(`${base}/${ev.id}`);
              }}
            />
          </Section>
          </div>

        </div>
      </div>
    </div>
  );
}



