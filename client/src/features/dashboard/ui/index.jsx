/**
 * dashboard/ui/index.jsx — Phase 6 upgrade
 * - StatCard: sparkline mini-bars, tighter layout
 * - ClubMiniCard: latest-event sub-line, active dot
 * - EventRow: capacity mini-bar, live indicator
 * - ChatRow: unread count badge, richer time label
 * - BookmarkRow: date countdown
 * - ActivityStrip: animated multi-stat cycling
 * - QuickActions: compact icon-button strip
 */

import Button from "../../../components/ui/Button";
import React, { useEffect, useRef, useState } from "react";
import { STATUS_STYLE } from "../../events/ui/eventStyles";
import { styles } from "./styles";
import { Building2, Calendar, MessageCircle, Bookmark, MapPin, Zap, ArrowRight, Plus } from "lucide-react";
import { CLUB_CATEGORY_META } from "../../../theme";
import { EVENT_CATEGORY_META } from "../../../theme";
import Skeleton from "../../../components/feedback/Skeleton";
export { default as MonthlyCalendar } from "./MonthlyCalendar";

/* ── Section: re-export from global layout primitive ── */
export { default as Section } from "../../../components/layout/Section";

/* ── Stat card accent config (semantic tokens for light theme) ── */
const STAT_ACCENT = {
  clubs:     { color: 'var(--cc-stat-accent-clubs, #004F9F)',     iconBg: 'rgba(0,79,159,0.08)',  iconColor: '#004F9F', Icon: Building2  },
  events:    { color: 'var(--cc-stat-accent-events, #00BCEB)',    iconBg: 'rgba(0,188,235,0.08)', iconColor: '#00BCEB', Icon: Calendar   },
  chats:     { color: 'var(--cc-stat-accent-chats, #00C27A)',     iconBg: 'rgba(0,194,122,0.08)', iconColor: '#00C27A', Icon: MessageCircle},
  bookmarks: { color: 'var(--cc-stat-accent-bookmarks, #FFB020)', iconBg: 'rgba(255,176,32,0.10)',iconColor: '#E5A000', Icon: Bookmark   },
};

/* ── Sparkline mini bars ── */
function Sparkline({ color, value, max = 10 }) {
  const heights = [
    Math.max(3, Math.round((value * 0.4 / Math.max(max, 1)) * 16)),
    Math.max(3, Math.round((value * 0.7 / Math.max(max, 1)) * 16)),
    Math.max(3, Math.round((value      / Math.max(max, 1)) * 16)),
  ];
  return (
    <div className={`cc-sparkline ${color}`}>
      {heights.map((h, i) => (
        <div
          key={i}
          className={`cc-sparkline-bar ${i === 2 ? "cc-sparkline-bar--active" : ""}`}
          style={{ height: `${Math.min(h, 16)}px` }}
        />
      ))}
    </div>
  );
}

/* ── Count-up hook ── */
function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !target) return;
    started.current = true;
    const numTarget = parseInt(target, 10);
    if (isNaN(numTarget) || numTarget === 0) { setCount(target); return; }
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;
    const increment = numTarget / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numTarget) { setCount(numTarget); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export function StatCard({ label, value, sub, subHighlight, onClick, accent = "clubs" }) {
  const { color, iconBg, iconColor, Icon } = STAT_ACCENT[accent] ?? STAT_ACCENT.clubs;
  const displayValue = useCountUp(value);

  return (
    <button
      onClick={onClick}
      className={styles.statCard}
      style={{ '--cc-stat-accent-color': color }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={styles.statLabel}>{label}</p>
        {Icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <Icon size={16} style={{ color: iconColor }} />
          </span>
        )}
      </div>
      <p
        className={`${styles.statValue} animate-count-reveal`}
        style={{ fontWeight: 'var(--cc-font-weight-extrabold, 800)' }}
      >
        {typeof value === "number" ? displayValue : value}
      </p>
      <p className={`${styles.statSub} ${subHighlight ? "text-warning" : "text-muted"}`}>{sub}</p>
    </button>
  );
}

/* ── Quick actions strip ── */
export function QuickActions({ onCreateEvent, onBrowseClubs, onOpenChats }) {
  const actions = [
    { label: "New Event",   icon: Plus,         onClick: onCreateEvent, color: 'var(--cc-stat-accent-clubs, #004F9F)',  bg: 'rgba(0,79,159,0.06)' },
    { label: "Browse Clubs",icon: Building2,     onClick: onBrowseClubs, color: 'var(--cc-stat-accent-events, #00BCEB)', bg: 'rgba(0,188,235,0.06)' },
    { label: "Open Chats",  icon: MessageCircle, onClick: onOpenChats,   color: 'var(--cc-stat-accent-chats, #00C27A)',  bg: 'rgba(0,194,122,0.06)' },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map(({ label, icon: Icon, onClick, color, bg }) => (
        <button
          key={label}
          onClick={onClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cc-soft text-[11px] font-semibold transition-all duration-150"
          style={{ color }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = bg;
            e.currentTarget.style.borderColor = 'var(--cc-color-border-strong)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '';
          }}
        >
          <Icon size={12} />
          {label}
        </button>
      ))}
    </div>
  );
}

export function ClubMiniCard({ club, onClick, latestEvent }) {
  const cat = CLUB_CATEGORY_META[club?.category] || CLUB_CATEGORY_META.other;
  const STATUS = {
    active:   { label: "Member",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    pending:  { label: "Pending",  cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"   },
    rejected: { label: "Rejected", cls: "bg-red-500/10 text-red-400 border-red-500/30"            },
  };
  const st = STATUS[club.myStatus];
  const hasActivity = (club.ongoingEvents || 0) > 0;

  return (
    <button onClick={onClick} className={`${styles.clubCard} cc-interactive-surface`}>
      <div className="relative shrink-0">
        <div className={`w-9 h-9 rounded-xl ${cat.gradient || "bg-slate-700"} bg-gradient-to-br flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
          {cat.Icon ? <cat.Icon size={18} className="opacity-80" /> : null}
        </div>
        {hasActivity && <span className="cc-active-dot absolute -top-0.5 -right-0.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={styles.clubName}>{club.name}</p>
        <p className={styles.clubMeta}>
          {club.memberCount ?? 0} members
          {latestEvent && <span className="ml-1 opacity-70">· {latestEvent.title?.slice(0, 18)}{latestEvent.title?.length > 18 ? "…" : ""}</span>}
        </p>
      </div>
      {st && (
        <span className={`shrink-0 text-label px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
      )}
    </button>
  );
}

export function EventRow({ event, last, onClick }) {
  const parseDate = (val) => { if (!val) return null; const d = new Date(val); return Number.isNaN(d.getTime()) ? null : d; };
  const d   = parseDate(event.date) || parseDate(event.createdAt);
  const day = d ? d.getDate() : "—";
  const mon = d ? d.toLocaleDateString("en-US", { month: "short" }) : "";
  const cat = EVENT_CATEGORY_META[event?.category] || {};
  const statusCls = STATUS_STYLE[event.status] || STATUS_STYLE.completed;
  const isLive    = event.status === "ongoing";
  const fillPct   = event.maxParticipants > 0
    ? Math.min(100, Math.round(((event.participants?.length || 0) / event.maxParticipants) * 100))
    : 0;
  const isUrgent  = fillPct >= 70 && fillPct < 100;

  return (
    <button onClick={onClick} className={`${styles.rowBase} ${!last ? "border-b border-cc-soft" : ""} group cc-interactive-surface`}>
      {/* Left accent bar */}
      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-200" />

      <div className={styles.rowDate}>
        <p className="text-heading-sm text-cc tabular-nums">{day}</p>
        <p className="text-label text-muted mt-0.5">{mon}</p>
      </div>
      <div className={styles.rowDivider} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isLive && <span className="cc-live-dot shrink-0" style={{ width: 6, height: 6 }} />}
          <p className={styles.rowTitle}>{event.title}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`${styles.rowMeta} shrink-0`}><MapPin size={11} className="inline mr-1 opacity-60" />{event.venue}</p>
          {isUrgent && <span className="cc-urgency shrink-0">🔥 {100 - fillPct}% left</span>}
        </div>
        {/* Capacity mini bar */}
        {fillPct > 0 && (
          <div className="mt-1.5 h-1 rounded-full bg-cc-soft overflow-hidden w-full max-w-[120px]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${fillPct}%`,
                backgroundColor: fillPct >= 70 ? "var(--cc-color-warning)" : "var(--cc-color-success)",
              }}
            />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 flex-wrap justify-end">
        {isLive && (
          <span className="text-label px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pop-in">Live</span>
        )}
        <span className={`text-label px-2 py-0.5 rounded-full border ${statusCls}`}>{event.status}</span>
      </div>
    </button>
  );
}

export function ChatRow({ chat, last, onClick }) {
  const timeLabel = chat.lastMessageTime ? formatRelativeTime(new Date(chat.lastMessageTime)) : "";
  const initials  = chat.name ? chat.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  const avatarColors = [
    "bg-indigo-950 text-indigo-300",
    "bg-purple-950 text-purple-300",
    "bg-emerald-950 text-emerald-300",
    "bg-amber-950 text-amber-300",
  ];
  const avatarCls = avatarColors[(chat.name?.length || 0) % avatarColors.length];
  const hasUnread = !!chat.lastMessage;

  return (
    <button onClick={onClick} className={`${styles.chatRow} ${!last ? "border-b border-cc-soft" : ""} group cc-interactive-surface`}>
      <div className="relative shrink-0">
        <div className={`w-8 h-8 rounded-full ${avatarCls} flex items-center justify-center text-micro font-bold ring-1 ring-transparent group-hover:ring-indigo-500/30 transition-all duration-200`}>
          {initials}
        </div>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-cc-bg animate-pop-in" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={styles.chatName}>{chat.name}</p>
        {chat.lastMessage && <p className={styles.chatMessage}>{chat.lastMessage}</p>}
      </div>
      {timeLabel && <span className="text-micro text-muted shrink-0">{timeLabel}</span>}
    </button>
  );
}

export function BookmarkRow({ bookmark, last }) {
  const ev        = bookmark.event;
  const title     = ev?.title || "Untitled";
  const cat       = EVENT_CATEGORY_META[ev?.category] || {};
  const isExt     = bookmark.eventType === "external";
  const parseDate = (val) => { if (!val) return null; const d = new Date(val); return Number.isNaN(d.getTime()) ? null : d; };
  const dateObj   = parseDate(ev?.date) || parseDate(ev?.createdAt);
  const dateLabel = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  // Countdown
  const daysUntil = dateObj ? Math.ceil((dateObj - new Date()) / 86400000) : null;
  const countdown = daysUntil !== null && daysUntil > 0 ? `in ${daysUntil}d` : daysUntil === 0 ? "Today!" : null;

  return (
    <div className={`${styles.bookmarkRow} ${!last ? "border-b border-cc-soft" : ""} group hover:bg-cc-surface-hover transition-colors duration-150`}>
      <div className={`w-8 h-8 rounded-lg ${cat.gradient || "bg-slate-700"} bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
        {cat.Icon ? <cat.Icon size={16} className="opacity-70" /> : <Calendar size={16} className="opacity-60" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={styles.bookmarkTitle}>{title}</p>
        <p className={styles.bookmarkMeta}>{isExt ? "External" : "Internal"} · {dateLabel}</p>
      </div>
      {countdown && (
        <span className={`text-micro shrink-0 font-semibold ${countdown === "Today!" ? "text-warning" : "text-muted"}`}>
          {countdown}
        </span>
      )}
    </div>
  );
}

/* ── Activity strip ── */
export function ActivityStrip({ stats = {} }) {
  const items = [
    stats.events > 0     && { icon: <Zap size={10} style={{ color: 'var(--cc-stat-accent-events)' }} />,      text: `${stats.events} events this week` },
    stats.activeClubs > 0&& { icon: <Building2 size={10} style={{ color: 'var(--cc-stat-accent-clubs)' }} />, text: `${stats.activeClubs} clubs active` },
    stats.unreadChats > 0&& { icon: <MessageCircle size={10} style={{ color: 'var(--cc-stat-accent-chats)' }} />, text: `${stats.unreadChats} new messages` },
    stats.ongoingEvents > 0 && { icon: <span className="cc-live-dot" style={{width:6,height:6}}/>, text: `${stats.ongoingEvents} ongoing` },
  ].filter(Boolean);

  return (
    <div className="cc-activity-strip">
      <span className="flex items-center gap-1.5 font-semibold text-cc shrink-0">
        <span className="cc-live-dot" />
        Campus
      </span>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 text-muted hover:text-cc transition-opacity duration-150">
          {item.icon}
          <span>{item.text}</span>
        </span>
      ))}
    </div>
  );
}

/* ── Empty state (inline / local) ── */
export function EmptyState({ icon, message, action, onAction }) {
  const Icon =
    typeof icon === "function" ||
    (icon && typeof icon === "object" && "render" in icon)
      ? icon
      : null;

  return (
    <div className={styles.emptyState}>
      <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 ring-1 ring-inset ring-indigo-500/15 text-accent mb-1" aria-hidden="true">
        {Icon ? <Icon size={24} strokeWidth={1.8} /> : icon}
      </span>
      <p className="text-body-sm font-semibold text-cc">{message}</p>
      {action && (
        <Button variant="ghost" size="sm" onClick={onAction} className="text-caption mt-1">
          {action} →
        </Button>
      )}
    </div>
  );
}

/* ── "You might like" row ── */
export function RecommendedRow({ events, onEventClick }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted font-semibold font-mono">Recommended</span>
        <span className="flex-1 h-px bg-cc-soft" />
      </div>
      <div className="cc-horizontal-scroll sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-2">
        {events.slice(0, 3).map((ev) => {
          const cat = EVENT_CATEGORY_META[ev.category] || {};
          return (
            <button
              key={ev._id}
              onClick={() => onEventClick(ev._id)}
              className="min-w-[220px] sm:min-w-0 flex items-center gap-3 p-3 rounded-xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface hover:border-cc-strong hover:-translate-y-px hover:shadow-sm transition-all duration-200 text-left group"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.gradient || "from-slate-800 to-slate-700"} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                {cat.Icon && <cat.Icon size={14} className="opacity-70" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-cc truncate group-hover:text-accent transition-colors">{ev.title}</p>
                <p className="text-[10px] text-muted truncate">{ev.venue}</p>
              </div>
              <ArrowRight size={12} className="text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Dashboard skeleton (shimmer) ── */
export function DashboardSkeleton() {
  return (
    <div className="px-5 lg:px-6 py-6 space-y-8">
      <div className="cc-stat-grid">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton.StatCard key={i} />)}
      </div>
      <div className="space-y-3">
        <div className="cc-skeleton h-4 w-24 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="cc-skeleton h-14 rounded-xl" />)}
        </div>
      </div>
      <div className="cc-dashboard-grid">
        <div className="space-y-2 rounded-2xl border border-cc-soft overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton.Row key={i} />)}
        </div>
        <div className="space-y-2 rounded-2xl border border-cc-soft overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton.Row key={i} />)}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatRelativeTime(date) {
  const now    = new Date();
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
