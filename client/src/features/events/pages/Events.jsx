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
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";
import { TrendingUp, Clock, Flame, LayoutGrid, CalendarClock, Radio, CheckCircle2 } from "lucide-react";

const STATUSES = ["All", "upcoming", "ongoing", "completed"];

const STATUS_LABEL = { All: "All Events", upcoming: "Upcoming", ongoing: "Ongoing", completed: "Past" };
const STATUS_ICON = { All: LayoutGrid, upcoming: CalendarClock, ongoing: Radio, completed: CheckCircle2 };

const SORTS = [
  { key: "soonest", label: "Soonest", Icon: Clock },
  { key: "ongoing", label: "Live First", Icon: Flame },
];
export default function Events() {
  const navigate = useNavigate();
  const { myClubs, events, loading } = useMyClubEvents();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("soonest");

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
    if (search.trim()) list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));

    // Sort
    if (sort === "soonest") {
      list = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));

    } else if (sort === "ongoing") {
      list = [...list].sort((a, b) => {
        if (a.status === "ongoing" && b.status !== "ongoing") return -1;
        if (b.status === "ongoing" && a.status !== "ongoing") return 1;
        return new Date(a.date) - new Date(b.date);
      });
    }
    return list;
  }, [events, filter, search, sort]);

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
    <div className="w-full">
      {/* ── Page header ── */}
      <PageHeader
        breadcrumb="Dashboard / Events"
        title="Events"
        subtitle={loading ? "…" : `${events.length} event${events.length !== 1 ? "s" : ""} from your ${myClubs.length} club${myClubs.length !== 1 ? "s" : ""}`}
        decorative
        glowColor="sky"
        filterRow={
          <div className="flex flex-col gap-5 mt-4">
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
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold border transition-all duration-200 ${isActive
                        ? "border-transparent scale-105"
                        : "bg-cc-surface-weak text-muted border-cc-soft hover:border-cc-strong hover:text-cc hover:scale-105"
                      }`}
                    style={isActive ? {
                      backgroundColor: 'var(--cc-color-brand)',
                      color: '#fff',
                      borderColor: 'var(--cc-color-brand)',
                      boxShadow: '0 2px 8px rgba(0, 79, 159, 0.2)',
                    } : undefined}
                  >
                    {(() => { const Icon = STATUS_ICON[s]; return Icon ? <Icon size={12} className="shrink-0" /> : null; })()}
                    {STATUS_LABEL[s]}
                    {count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-cc-surface-hover"
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 ${sort === key
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
        }
      />

      {/* ── Content ── */}
      <PageContainer className="py-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ev, i) => (
                <EventCard
                  key={ev._id}
                  event={ev}
                  index={i}
                  onClick={() => navigate(`/events/${ev._id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
