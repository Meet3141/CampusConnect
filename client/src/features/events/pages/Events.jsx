/**
 * Events.jsx — Phase 6: Social Discovery System
 * - Sort controls: Soonest / Most Popular / Ongoing First
 * - Trending 🔥 badge on high-capacity events
 * - Filter pills with live count badges
 * - Club-grouped section headers
 * - Light-theme compatible semantic tokens
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMyClubEvents } from "../hooks";
import EventCard from "../../../components/data-display/EventCard";
import SearchBar from "../../../components/navigation/SearchBar";
import Skeleton from "../../../components/feedback/Skeleton";
import EmptyState from "../../../components/feedback/EmptyState";
import { TrendingUp, Clock, Flame, LayoutGrid, CalendarClock, Radio, CheckCircle2 } from "lucide-react";

const STATUSES = ["All", "upcoming", "ongoing", "completed"];

const STATUS_LABEL = { All: "All Events", upcoming: "Upcoming", ongoing: "Ongoing", completed: "Past" };
const STATUS_ICON  = { All: LayoutGrid, upcoming: CalendarClock, ongoing: Radio, completed: CheckCircle2 };

const SORTS = [
  { key: "soonest",   label: "Soonest",   Icon: Clock      },
  { key: "popular",   label: "Popular",   Icon: TrendingUp },
  { key: "ongoing",   label: "Live First",Icon: Flame      },
];

function isTrending(ev) {
  const reg = ev.attendees?.filter((a) => a.status === "registered").length || 0;
  const cap = ev.maxAttendees || 0;
  return cap > 0 && reg / cap >= 0.6;
}

export default function Events() {
  const navigate = useNavigate();
  const { myClubs, events, loading } = useMyClubEvents();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort,   setSort]   = useState("soonest");

  // Per-status counts for pill badges
  const countByStatus = useMemo(() => {
    const counts = {};
    STATUSES.forEach((s) => {
      counts[s] = s === "All" ? events.length : events.filter((e) => e.status === s).length;
    });
    return counts;
  }, [events]);

  const filtered = useMemo(() => {
    let list = events;
    if (filter !== "All") list = list.filter((e) => e.status === filter);
    if (search.trim())    list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));

    // Sort
    if (sort === "soonest") {
      list = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === "popular") {
      list = [...list].sort((a, b) => {
        const ra = a.attendees?.filter((x) => x.status === "registered").length || 0;
        const rb = b.attendees?.filter((x) => x.status === "registered").length || 0;
        return rb - ra;
      });
    } else if (sort === "ongoing") {
      list = [...list].sort((a, b) => {
        if (a.status === "ongoing" && b.status !== "ongoing") return -1;
        if (b.status === "ongoing" && a.status !== "ongoing") return 1;
        return new Date(a.date) - new Date(b.date);
      });
    }
    return list;
  }, [events, filter, search, sort]);

  // Mixed adaptive layout
  const heroEvent  = filtered[0] || null;
  const restEvents = filtered.slice(1);

  // Group rest events by club for section headers
  const clubNames = useMemo(() => {
    const map = {};
    myClubs.forEach((c) => { map[c._id] = c.name; });
    return map;
  }, [myClubs]);

  if (!loading && myClubs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-6">
        <EmptyState
          icon="🎪"
          title="No club events yet"
          description="You're not a member of any club. Join a club to see its events right here."
          action={{ label: "Discover Clubs", onClick: () => navigate("/clubs") }}
        />
      </div>
    );
  }

  return (
    <div className="text-cc">
      {/* ── Page header ── */}
      <div className="relative overflow-hidden border-b border-cc-soft">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-1/3 w-96 h-64 bg-accent-soft rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative px-5 lg:px-6 pt-5 pb-4">
          <p className="text-label text-muted font-mono mb-2">Dashboard / Events</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
              <h1 className="text-display-lg" style={{ background: 'linear-gradient(120deg, #004F9F, #00BCEB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Events
              </h1>
              <p className="text-body-sm text-secondary mt-1">
                {loading ? "…" : `${events.length} event${events.length !== 1 ? "s" : ""} from your ${myClubs.length} club${myClubs.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* ── Search + status pills ── */}
          <div className="mt-4 space-y-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search events…" shortcutHint />

            {/* Status pills with count badges */}
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const isActive = filter === s;
                const count = countByStatus[s] || 0;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold border transition-all duration-200 ${
                      isActive
                        ? "border-transparent scale-105"
                        : "bg-cc-surface-weak text-muted border-cc-soft hover:border-cc-strong hover:text-cc hover:scale-105"
                    }`}
                    style={isActive ? {
                      backgroundColor: 'var(--cc-color-brand)',
                      color: '#fff',
                      borderColor: 'var(--cc-color-brand)',
                      boxShadow: '0 2px 8px rgba(0,79,159,0.20)',
                    } : undefined}
                  >
                    {(() => { const Icon = STATUS_ICON[s]; return Icon ? <Icon size={12} className="shrink-0" /> : null; })()}
                    {STATUS_LABEL[s]}
                    {count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-white/20" : "bg-cc-surface-hover"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted font-mono uppercase tracking-wider shrink-0">Sort:</span>
              {SORTS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 ${
                    sort === key
                      ? "border-cc-strong"
                      : "bg-transparent text-muted border-transparent hover:border-cc-soft hover:text-cc"
                  }`}
                  style={sort === key ? {
                    backgroundColor: 'var(--cc-color-primary-soft)',
                    color: 'var(--cc-color-brand)',
                  } : undefined}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-5 lg:px-6 py-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton.Card className="h-48" />
            <Skeleton.Grid count={5} renderItem={() => <Skeleton.Card />} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            variant={search ? "search" : "default"}
            searchQuery={search}
            icon={search ? undefined : "📭"}
            title={search ? undefined : `No ${filter === "All" ? "" : filter} events`}
            description={search ? undefined : "Check back later or switch to a different filter."}
            action={search ? { label: "Clear search", onClick: () => setSearch("") } : undefined}
          />
        ) : (
          <div className="space-y-6">
            {/* Hero event */}
            {heroEvent && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-3 flex items-center gap-2">
                  <span className="cc-live-dot cc-live-dot--amber" style={{ width: 6, height: 6 }} />
                  {filter === "ongoing" ? "Happening now" : filter === "upcoming" ? "Coming up" : "Featured event"}
                  {isTrending(heroEvent) && <span className="ml-1" style={{ color: 'var(--cc-color-warning)' }}>🔥 Trending</span>}
                </p>
                <EventCard
                  event={heroEvent}
                  variant="hero"
                  index={0}
                  onClick={() => navigate(`/events/${heroEvent._id}`)}
                />
              </div>
            )}

            {/* Rest — compact grid with trending badges */}
            {restEvents.length > 0 && (
              <div>
                {heroEvent && (
                  <p className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-cc-border-soft" />
                    More events ({restEvents.length})
                    <span className="flex-1 h-px bg-cc-border-soft" />
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restEvents.map((ev, i) => (
                    <div key={ev._id} className="relative">
                      {isTrending(ev) && (
                        <span
                          className="absolute -top-1.5 -right-1.5 z-10 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                          style={{
                            color: 'var(--cc-color-warning)',
                            backgroundColor: 'var(--cc-color-surface)',
                            borderColor: 'var(--cc-color-border-subtle)',
                          }}
                        >
                          🔥 Trending
                        </span>
                      )}
                      <EventCard
                        event={ev}
                        index={i + 1}
                        onClick={() => navigate(`/events/${ev._id}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
