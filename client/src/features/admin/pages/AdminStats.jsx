/**
 * features/admin/pages/AdminStats.jsx
 * Platform analytics dashboard.
 *
 * Data fetching is handled by useAdminStats() in ../hooks.
 *
 * Access: orgAdmin or clubAdmin (clubAdmins see limited stats)
 */

import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useAdminStats } from "../hooks";
import StatsCard from "../../../components/data-display/StatsCard";
import Spinner from "../../../components/feedback/Spinner";
import Button from "../../../components/ui/Button";
import { Building2, Calendar, Globe, CheckCircle2, MessageCircle, Bookmark } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";

/* Neutral operational chart palette — calm, non-neon, works on light and dark */
const CATEGORY_COLORS = {
  technical:   "var(--cc-color-brand)",        // brand blue
  cultural:    "#7c6fcd",                       // muted violet
  sports:      "var(--cc-color-success)",       // semantic green
  academic:    "var(--cc-color-warning)",       // semantic amber
  arts:        "#c05e7a",                       // muted rose
  other:       "var(--cc-color-text-muted)",    // muted grey
  hackathon:   "#5a7fd0",                       // steel blue
  workshop:    "#3da9a0",                       // teal
  webinar:     "var(--cc-color-accent)",        // sky surge
  cultural2:   "#7c6fcd",
  sports2:     "var(--cc-color-success)",
  meeting:     "var(--cc-color-text-disabled)",
  conference:  "var(--cc-color-warning)",
  competition: "var(--cc-color-error)",
};

/* Semantic stat card themes — light/dark compatible via CSS vars */
const STAT_CARD_THEMES = [
  { label: "Total Clubs",     Icon: Building2,    accent: "text-primary",  ring: "ring-primary-border",   bg: "bg-primary-soft"  },
  { label: "Total Events",    Icon: Calendar,     accent: "text-primary",  ring: "ring-primary-border",   bg: "bg-primary-soft"  },
  { label: "External Events", Icon: Globe,        accent: "text-accent",   ring: "ring-accent-border",    bg: "bg-accent-soft"   },
  { label: "Verified",        Icon: CheckCircle2, accent: "text-success",  ring: "ring-success/20",       bg: "bg-success/8"     },
  { label: "Active Chats",    Icon: MessageCircle,accent: "text-info",     ring: "ring-info/20",          bg: "bg-info/8"        },
  { label: "Bookmarks",       Icon: Bookmark,     accent: "text-warning",  ring: "ring-warning/20",       bg: "bg-warning/8"     },
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
        <div key={key} className="flex items-center gap-3 group px-2 py-1 -mx-2 rounded-lg hover:bg-cc-surface-hover transition-colors">
          <span className="text-[11px] text-cc-muted capitalize w-24 shrink-0 truncate">{key}</span>
          <div className="flex-1 h-2 bg-cc-soft rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.round((count / max) * 100)}%`,
                backgroundColor: colorMap[key] || "#6366f1",
              }}
            />
          </div>
          <span className="text-[11px] text-cc-muted tabular-nums w-8 text-right font-medium">{count}</span>
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
        <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--cc-color-border-subtle)" strokeWidth="6" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fill="var(--cc-color-text-primary)" fontSize="14" fontWeight="600">{pct}%</text>
      </svg>
      <div>
        <CountUp target={value} className="text-xl font-semibold text-cc tabular-nums" />
        <p className="text-[11px] text-cc-muted mt-0.5 leading-snug">{label}</p>
      </div>
    </div>
  );
}

function CountUp({ target, className }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const stepTime = 30;
    const increment = Math.ceil(target / (duration / stepTime));
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target]);
  return <span className={className}>{count}</span>;
}

export default function AdminStats() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const isOrgAdmin  = user?.roles?.includes("orgAdmin");
  const isClubAdmin = user?.roles?.includes("clubAdmin");
  const canView     = isOrgAdmin || isClubAdmin;

  const { data, loading } = useAdminStats(canView);

  /* ── Derived analytics ── */
  const analytics = useMemo(() => {
    if (!data) return null;
    const { clubs, events, extTotal, extVerif, chats, bookmarks } = data;

    const clubsByCategory = clubs.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

    const eventsByCategory = events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {});

    const eventsByStatus = events.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});

    const totalActiveMembers = clubs.reduce((sum, c) => sum + (c.memberCount || 0), 0);
    const now = new Date();
    const upcomingCount = events.filter((e) => new Date(e.date) > now && e.status === "upcoming").length;

    return {
      clubTotal:        clubs.length,
      eventTotal:       events.length,
      extTotal,
      extVerif,
      chatTotal:        chats.length,
      bookmarkTotal:    bookmarks.length,
      totalActiveMembers,
      upcomingCount,
      clubsByCategory:  Object.entries(clubsByCategory).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
      eventsByCategory: Object.entries(eventsByCategory).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
      eventsByStatus:   Object.entries(eventsByStatus).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
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
            className="mt-6 px-5 py-2.5 bg-primary hover:bg-primary-hover text-[var(--cc-color-on-brand)] rounded-xl text-sm transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner.Page message="Crunching numbers…" />;

  const a = analytics;
  const STATUS_COLORS = {
    upcoming:  "var(--cc-color-brand)",
    ongoing:   "var(--cc-color-success)",
    completed: "var(--cc-color-text-muted)",
    cancelled: "var(--cc-color-error)",
  };

  return (
    <div className="w-full">
      {/* Header */}
      <PageHeader
        breadcrumb={
          <div className="flex items-center justify-between">
             <span>Admin / Analytics</span>
             <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--cc-color-success)]/10 text-[var(--cc-color-success)] text-[10px] uppercase font-bold tracking-wider">
               <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-color-success)] animate-pulse" />
               Live
             </span>
          </div>
        }
        title={<>Platform <span className="cc-text-gradient">Analytics</span></>}
        subtitle="Live snapshot — data pulled from the live database."
      />

      <PageContainer className="py-6 space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatsCard icon={Building2}     value={<CountUp target={a.clubTotal} />} label="Total Clubs"      sub={`${a.totalActiveMembers} total members`}  accent="indigo"  />
          <StatsCard icon={Calendar}      value={<CountUp target={a.eventTotal} />}    label="Total Events"     sub={`${a.upcomingCount} upcoming`}             accent="violet"  />
          <StatsCard icon={Globe}         value={<CountUp target={a.extTotal} />}      label="External Events" sub="cross-university"                           accent="teal"    />
          <StatsCard icon={CheckCircle2}  value={<CountUp target={a.extVerif} />}      label="Verified"        sub={`${a.extTotal - a.extVerif} still pending`}  accent="emerald" />
          <StatsCard icon={MessageCircle} value={<CountUp target={a.chatTotal} />}     label="Active Chats"    sub="club + event chats"                        accent="sky"     />
          <StatsCard icon={Bookmark}      value={<CountUp target={a.bookmarkTotal} />} label="Bookmarks"       sub="saved by users"                            accent="rose"    />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">
              Clubs by category
            </h3>
            <BarChart data={a.clubsByCategory} colorMap={CATEGORY_COLORS} />
          </div>
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">
              Events by category
            </h3>
            <BarChart data={a.eventsByCategory} colorMap={CATEGORY_COLORS} />
          </div>
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">
              Events by status
            </h3>
            <BarChart data={a.eventsByStatus} colorMap={STATUS_COLORS} />
          </div>
        </div>

        {/* ── Ring stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <RingCard value={a.extVerif}     total={a.extTotal}   label="External events verified"         color="var(--cc-color-success)" />
          <RingCard value={a.upcomingCount} total={a.eventTotal} label="Events that are upcoming"           color="var(--cc-color-brand)"   />
          <RingCard value={a.extTotal - a.extVerif} total={a.extTotal} label="External events pending review" color="var(--cc-color-warning)" />
        </div>

        {/* ── Quick actions ── */}
        {isOrgAdmin && (
          <div className="rounded-2xl border border-cc-soft bg-cc-surface-weak p-5">
            <h3 className="text-[11px] uppercase tracking-widest text-cc-muted font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="warning" size="sm" onClick={() => navigate("/admin")}>
                🏙️ Manage Clubs
              </Button>
              <Button variant="success" size="sm" onClick={() => navigate("/admin/verify")}>
                ✓ Verify Events {a.extTotal - a.extVerif > 0 && `(${a.extTotal - a.extVerif})`}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/clubs/create")}>
                + New Club
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
