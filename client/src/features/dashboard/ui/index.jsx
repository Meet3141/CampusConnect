import Button from "../../../components/ui/Button";
import React from "react";
import { STATUS_STYLE } from "../../events/ui/eventStyles";
import { styles } from "./styles";

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
  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const d = parseDate(event.date) || parseDate(event.createdAt);
  const day = d ? d.getDate() : "—";
  const mon = d ? d.toLocaleDateString("en-US", { month: "short" }) : "";
  const cat = event?.category || {};
  const statusCls = STATUS_STYLE[event.status] || STATUS_STYLE.completed;

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
      <div className="flex shrink-0 items-center gap-2 flex-wrap justify-end">
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium ${statusCls}`}>
          {event.status}
        </span>
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium ${cat.badge || "bg-slate-700"}`}>
          {event.category}
        </span>
      </div>
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
  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const dateObj = parseDate(ev?.date) || parseDate(ev?.createdAt);
  const dateLabel = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

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
      <p className="text-cc-muted text-xs max-w-40 leading-relaxed">{message}</p>
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
