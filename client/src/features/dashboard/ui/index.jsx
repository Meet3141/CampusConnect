import Button from "../../../components/ui/Button";
import React from "react";

export const styles = {
  page: "w-full px-5 lg:px-6 py-6 space-y-6",
  statGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3",
  twoColumnGrid: "grid grid-cols-1 lg:grid-cols-5 gap-5",
  sectionHeader: "flex items-center justify-between mb-3",
  sectionTitleRow: "flex items-center gap-2",
  sectionTitle: "text-base font-semibold text-cc",
  sectionCount: "text-[10px] font-mono tabular-nums px-1.5 py-px bg-cc-surface-weak text-cc-muted rounded-md",
  sectionLink: "text-xs",
  statCard:
    "group text-left bg-cc-surface-weak hover-bg-cc-surface border border-cc-soft hover-border-cc-strong rounded-2xl p-4 transition-all",
  statLabel: "text-xs text-cc-muted mb-2",
  statValue: "text-3xl font-semibold text-cc tabular-nums leading-none",
  statSub: "text-xs mt-1.5",
  clubCard:
    "group text-left flex items-center gap-3 p-3 rounded-xl border border-cc-soft bg-cc-surface-weak hover-bg-cc-surface hover-border-cc-strong transition-all",
  clubName: "text-base font-medium text-cc group-hover:text-indigo-300 transition-colors truncate",
  clubMeta: "text-xs text-cc-muted mt-0.5",
  eventList: "rounded-2xl border border-cc-soft overflow-hidden",
  rowBase:
    "group w-full flex items-center gap-4 px-4 py-3 bg-cc-surface-weak hover-bg-cc-surface transition-colors text-left",
  rowDate: "w-9 shrink-0 text-center",
  rowDivider: "w-px h-8 bg-cc-border-soft shrink-0",
  rowTitle: "text-base font-medium text-cc group-hover:text-indigo-300 transition-colors truncate",
  rowMeta: "text-xs text-cc-muted mt-0.5 truncate",
  chatRow:
    "group w-full flex items-center gap-3 px-4 py-3 bg-cc-surface-weak hover-bg-cc-surface transition-colors text-left",
  chatName: "text-sm font-medium text-cc truncate",
  chatMessage: "text-[11px] text-cc-muted truncate mt-0.5",
  bookmarkRow: "flex items-center gap-3 px-4 py-3 bg-cc-surface-weak",
  bookmarkTitle: "text-sm font-medium text-cc truncate",
  bookmarkMeta: "text-[10px] text-cc-muted mt-0.5",
  emptyState:
    "flex flex-col items-center py-8 gap-3 text-center rounded-2xl border border-cc-soft border-dashed",
  skeletonWrapper: "px-5 lg:px-6 py-6 space-y-6 animate-pulse",
  skeletonCard: "h-20 rounded-2xl bg-cc-surface-weak",
};

export function Section({ title, count, linkLabel, onLink, children }) {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {count > 0 && (
            <span className={styles.sectionCount}>
              {count}
            </span>
          )}
        </div>
        {linkLabel && onLink && (
          <Button variant="ghost" size="sm" onClick={onLink} className={styles.sectionLink}>
            {linkLabel}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, subHighlight, onClick }) {
  return (
    <button
      onClick={onClick}
      className={styles.statCard}
    >
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      <p className={`${styles.statSub} ${subHighlight ? "text-yellow-400" : "text-cc-muted"}`}>
        {sub}
      </p>
    </button>
  );
}

export function ClubMiniCard({ club, onClick }) {
  const cat = club?.category || {};
  const STATUS = {
    active:   { label: "Member",  cls: "bg-emerald-950 text-emerald-300 border-emerald-800" },
    pending:  { label: "Pending", cls: "bg-yellow-950 text-yellow-300 border-yellow-800"   },
    rejected: { label: "Rejected",cls: "bg-red-950 text-red-400 border-red-900"            },
  };
  const st = STATUS[club.myStatus];

  return (
    <button
      onClick={onClick}
      className={styles.clubCard}
    >
      <div className={`w-9 h-9 rounded-xl ${cat.bg || "bg-slate-700"} flex items-center justify-center text-lg shrink-0`}>
        {cat.emoji || "🏛"}
      </div>
      <div className="flex-1 min-w-0">
        <p className={styles.clubName}>
          {club.name}
        </p>
        <p className={styles.clubMeta}>
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

export function EventRow({ event, last, onClick }) {
  const d   = new Date(event.date);
  const day = d.getDate();
  const mon = d.toLocaleDateString("en-US", { month: "short" });
  const cat = event?.category || {};

  return (
    <button
      onClick={onClick}
      className={`${styles.rowBase} ${
        !last ? "border-b border-cc-soft" : ""
      }`}
    >
      <div className={styles.rowDate}>
        <p className="text-base font-semibold text-cc leading-none tabular-nums">{day}</p>
        <p className="text-[10px] text-cc-muted uppercase tracking-wide mt-0.5">{mon}</p>
      </div>
      <div className={styles.rowDivider} />
      <div className="flex-1 min-w-0">
        <p className={styles.rowTitle}>
          {event.title}
        </p>
        <p className={styles.rowMeta}>📍 {event.venue}</p>
      </div>
      <span className={`shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium ${cat.badge || "bg-slate-700"}`}>
        {event.category}
      </span>
    </button>
  );
}

export function ChatRow({ chat, last, onClick }) {
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
      className={`${styles.chatRow} ${
        !last ? "border-b border-cc-soft" : ""
      }`}
    >
      <div className={`w-7 h-7 rounded-full ${avatarCls} flex items-center justify-center text-[11px] font-bold shrink-0`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className={styles.chatName}>{chat.name}</p>
        {chat.lastMessage && (
          <p className={styles.chatMessage}>{chat.lastMessage}</p>
        )}
      </div>
      {timeLabel && <span className="text-[10px] text-cc-muted shrink-0">{timeLabel}</span>}
    </button>
  );
}

export function BookmarkRow({ bookmark, last }) {
  const ev    = bookmark.event;
  const title = ev?.title || "Untitled";
  const cat   = ev?.category || {};
  const isExt = bookmark.eventType === "external";
  const dateLabel = ev?.date
    ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <div className={`${styles.bookmarkRow} ${!last ? "border-b border-cc-soft" : ""}`}>
      <div className={`w-7 h-7 rounded-lg ${cat.bg || "bg-slate-700"} flex items-center justify-center text-sm shrink-0`}>
        {cat.emoji || "📅"}
      </div>
      <div className="flex-1 min-w-0">
        <p className={styles.bookmarkTitle}>{title}</p>
        <p className={styles.bookmarkMeta}>
          {isExt ? "External" : "Internal"} · {dateLabel}
        </p>
      </div>
    </div>
  );
}

export function EmptyState({ icon, message, action, onAction }) {
  return (
    <div className={styles.emptyState}>
      <span className="text-3xl">{icon}</span>
      <p className="text-cc-muted text-xs max-w-[160px] leading-relaxed">{message}</p>
      {action && (
        <Button variant="ghost" size="sm" onClick={onAction} className="text-xs">
          {action} →
        </Button>
      )}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className={styles.skeletonWrapper}>
      <div className={styles.statGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
      <div>
        <div className="h-4 w-24 bg-cc-surface-weak rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-cc-surface-weak" />
          ))}
        </div>
      </div>
      <div className={styles.twoColumnGrid}>
        <div className="lg:col-span-3 space-y-2">
          <div className="h-4 w-32 bg-cc-surface-weak rounded mb-3" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-cc-surface-weak" />
          ))}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-4 w-24 bg-cc-surface-weak rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-cc-surface-weak" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Helpers */
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
