/**
 * ExternalEvents.jsx
 * Browse cross-university events.
 *
 * API: GET /external-events  → { success, data, meta }
 *      params: ?category= &universityName= &verified= &page= &limit=
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { listExternalEvents } from "../api";
import FilterBar from "../../../components/navigation/FilterBar";
import SearchBar from "../../../components/navigation/SearchBar";
import Badge from "../../../components/ui/Badge";
import Skeleton from "../../../components/feedback/Skeleton";
import EmptyState from "../../../components/feedback/EmptyState";
import Button from "../../../components/ui/Button";

import { Code2, Wrench, Mic, Drama, Zap, Landmark, Trophy, Globe, Calendar, MapPin, University } from "lucide-react";

const CATEGORIES = ["hackathon", "workshop", "webinar", "cultural", "sports", "conference", "competition"];
const CAT_META = {
  hackathon:    { Icon: Code2,    badge: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  workshop:     { Icon: Wrench,   badge: "bg-teal-950 text-teal-300 border-teal-800" },
  webinar:      { Icon: Mic,      badge: "bg-sky-950 text-sky-300 border-sky-800" },
  cultural:     { Icon: Drama,    badge: "bg-purple-950 text-purple-300 border-purple-800" },
  sports:       { Icon: Zap,      badge: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  conference:   { Icon: Landmark, badge: "bg-amber-950 text-amber-300 border-amber-800" },
  competition:  { Icon: Trophy,   badge: "bg-rose-950 text-rose-300 border-rose-800" },
};
const catOf = (k) => CAT_META[k] || CAT_META.cultural;

// Helper: check if a date is valid
function isValidDate(val) {
  if (!val) return false;
  const d = new Date(val);
  return !Number.isNaN(d.getTime());
}

// Helper: check if event date has passed
function isEventExpired(val) {
  if (!val || !isValidDate(val)) return false;
  return new Date(val) < new Date();
}

export default function ExternalEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [category, setCategory] = useState("");
  const [uniFilter, setUniFilter] = useState("");
  const limit = 12;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit, verified: "true" };
        if (category) params.category = category;
        if (uniFilter) params.universityName = uniFilter;
        const res = await listExternalEvents(params);
        setEvents(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, category, uniFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="text-cc">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-cc-soft">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-0 w-80 h-80 bg-violet-700/6 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-cc-muted uppercase font-mono mb-3">
            Discover / External Events
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                External{" "}
                <span className="cc-text-gradient">Events</span>
              </h1>
              <p className="text-cc-muted mt-1.5 text-sm">
                Discover events from other universities and communities.
              </p>
            </div>
            {user && (
              <button onClick={() => navigate("/external-events/create")}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shrink-0">
                + Submit Event
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <FilterBar
              filters={[
                { value: "", label: "All" },
                ...CATEGORIES.map(c => {
                  const { Icon } = catOf(c);
                  return {
                    value: c,
                    label: <span className="flex items-center gap-1.5">{Icon && <Icon size={24} />}{c}</span>,
                  };
                })
              ]}
              value={category}
              onChange={(v) => { setCategory(v); setPage(1); }}
            />
          </div>

          <div className="mt-3">
            <SearchBar
              value={uniFilter}
              onChange={(v) => { setUniFilter(v); setPage(1); }}
              placeholder="Filter by university name…"
              className="w-full sm:w-72"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">
        {loading ? (
          <Skeleton.Grid count={6} renderItem={() => <Skeleton.Card />} />
        ) : events.length === 0 ? (
          <EmptyState icon={Globe} title="No external events found" description="Try a different category or university filter." />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.filter(ev => isValidDate(ev.date)).map((ev) => {
                const cat = catOf(ev.category);
                return (
                  <article key={ev._id} onClick={() => navigate(`/external-events/${ev._id}`)}
                    className="group rounded-2xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface hover:border-cc-strong p-5 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--cc-shadow-hover-sm)] animate-pop-in">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant={ev.category} size="xs">{ev.category}</Badge>
                      {ev.isVerified && <Badge variant="success" size="xs" dot>✓ Verified</Badge>}
                    </div>
                    <h3 className="font-semibold text-cc text-sm group-hover:text-indigo-400 transition-colors line-clamp-2 mb-1">
                      {ev.title}
                    </h3>
                    <p className="text-[11px] text-cc-muted mb-1 flex items-center gap-1"><University size={14} className="shrink-0" /> {ev.universityName}</p>
                    {isValidDate(ev.date) && (
                      <p className="text-[11px] text-cc-muted flex items-center gap-1">
                        <Calendar size={14} className="shrink-0" /> {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                    {ev.venue && <p className="text-[11px] text-cc-muted mt-0.5 flex items-center gap-1"><MapPin size={14} className="shrink-0" /> {ev.venue}</p>}
                    {ev.registrationLink && !isEventExpired(ev.date) && (
                      <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        Register →
                      </a>
                    )}
                    {ev.registrationLink && isEventExpired(ev.date) && (
                      <p className="inline-block mt-3 text-xs text-cc-muted cursor-not-allowed">Registration Closed</p>
                    )}
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  ← Previous
                </Button>
                <span className="text-xs text-muted px-2">{page} / {totalPages}</span>
                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
