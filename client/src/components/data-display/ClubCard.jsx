/**
 * ClubCard.jsx — Phase 6 upgrade
 * - Contextual micro-content bottom row: active members · ongoing events · trending
 * - Active indicator dot (pulsing green) when club has ongoing events
 * - Trending badge (🔥) when memberCount is high
 * - Tighter internal padding for information density
 * - Subtle gradient shimmer on cover area
 * - Light-theme compatible semantic tokens
 *
 * variant="full"  — grid card for ClubList
 * variant="mini"  — compact inline for Dashboard
 */
import Badge from "../ui/Badge";
import { cn } from "../../utils/cn";
import { CLUB_CATEGORY_META } from "../../theme";
import { Users, Zap } from "lucide-react";

const FALLBACK_CAT = {
  gradient: "from-slate-900/40 to-slate-800/40",
  badge: "bg-slate-900 text-slate-400 border-slate-700",
  accent: "text-slate-400",
  Icon: null,
};

const MEMBER_BADGE = {
  active:   { label: "Member",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  pending:  { label: "Pending",  cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"   },
  rejected: { label: "Rejected", cls: "bg-red-500/10 text-red-400 border-red-500/30"            },
};

// Trending threshold — clubs with >20 members considered active
const TRENDING_THRESHOLD = 20;

export default function ClubCard({
  club,
  variant = "full",
  myStatus,
  joinState = "idle",
  isOrgAdmin,
  onView,
  onJoin,
  index = 0,
  className,
}) {
  const meta = CLUB_CATEGORY_META[club.category] ?? FALLBACK_CAT;
  const { Icon } = meta;
  const statusStr   = myStatus?.status || null;
  const statusBadge = isOrgAdmin
    ? { label: "Org Admin", cls: "bg-red-500/10 text-red-400 border-red-500/30" }
    : MEMBER_BADGE[statusStr] ?? null;
  const isBlocked      = myStatus?.blockedUntil && new Date(myStatus.blockedUntil) > new Date();
  const canJoin        = (!statusStr || statusStr === "rejected") && !isBlocked;
  const isActiveMember = statusStr === "active";

  const isTrending     = (club.memberCount || 0) >= TRENDING_THRESHOLD;
  const hasOngoing     = (club.ongoingEvents || 0) > 0;
  const ongoingCount   = club.ongoingEvents || 0;

  /* ── Mini variant ── */
  if (variant === "mini") {
    return (
      <button
        onClick={onView}
        className={cn(
          "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 text-left group",
          "hover:bg-cc-surface-hover hover:-translate-y-px hover:shadow-sm",
          className
        )}
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="relative shrink-0">
          <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center transition-transform duration-200 group-hover:scale-105", meta.gradient)}>
            {club.coverImage ? (
              <img src={club.coverImage} alt={club.name} className="w-full h-full object-cover rounded-xl opacity-80" />
            ) : Icon ? (
              <Icon size={18} className="opacity-70" />
            ) : null}
          </div>
          {hasOngoing && <span className="cc-active-dot absolute -top-0.5 -right-0.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-cc truncate group-hover:text-accent transition-colors">{club.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isActiveMember && <span className="cc-live-dot cc-live-dot--amber" style={{ width: 6, height: 6 }} />}
            <p className="text-[11px] text-muted truncate">
              {club.memberCount ?? 0} members
              {ongoingCount > 0 && <span className="ml-1 text-emerald-400">· {ongoingCount} live</span>}
            </p>
          </div>
        </div>
        {isTrending && (
          <span className="shrink-0 text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
            🔥
          </span>
        )}
      </button>
    );
  }

  /* ── Full card variant ── */
  return (
    <article
      style={{ animationDelay: `${index * 45}ms` }}
      className={cn(
        "group rounded-2xl border border-cc-soft overflow-hidden flex flex-col",
        "bg-cc-surface",
        "animate-pop-in",
        "cc-club-card",
        className
      )}
    >
      {/* Cover */}
      <div
        className={cn("relative h-20 bg-gradient-to-br flex items-center justify-center cursor-pointer select-none overflow-hidden", meta.gradient)}
        onClick={onView}
      >
        {club.coverImage ? (
          <img
            src={club.coverImage}
            alt={club.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
          />
        ) : Icon ? (
          <Icon size={24} className="opacity-70 group-hover:scale-110 group-hover:opacity-90 transition-all duration-300" aria-hidden="true" />
        ) : null}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Trending badge */}
        {isTrending && (
          <span className="absolute top-2 right-2 text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            🔥 Trending
          </span>
        )}

        {/* Status badge */}
        {statusBadge && (
          <span className={cn("absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border font-medium backdrop-blur-sm", statusBadge.cls)}>
            {statusBadge.label}
          </span>
        )}

        {/* Active member live dot */}
        {isActiveMember && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <span className="cc-live-dot" style={{ width: 6, height: 6 }} />
            <span className="text-[9px] text-white font-medium">Member</span>
          </span>
        )}

        {/* Ongoing events indicator */}
        {hasOngoing && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-emerald-950/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-emerald-500/30">
            <Zap size={8} className="text-emerald-400" />
            <span className="text-[9px] text-emerald-300 font-semibold">{ongoingCount} live</span>
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            onClick={onView}
            className="text-[13px] font-bold text-cc leading-snug cursor-pointer hover:text-accent transition-colors line-clamp-1"
          >
            {club.name}
          </h3>
          <span className={cn("shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize", meta.badge)}>
            {club.category}
          </span>
        </div>

        <p className="text-[11px] text-muted line-clamp-2 leading-relaxed flex-1">{club.description}</p>

        {/* Micro-content bottom row */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-cc-soft flex-wrap">
          {/* Members */}
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <Users size={10} className="opacity-60" />
            {club.memberCount ?? 0}
          </span>

          {/* Ongoing events */}
          {ongoingCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="cc-active-dot" style={{ width: 5, height: 5 }} />
              {ongoingCount} event{ongoingCount !== 1 ? "s" : ""} live
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {canJoin && onJoin && (
              <button
                onClick={onJoin}
                disabled={joinState === "joining"}
                className="text-[10px] px-2.5 py-1 rounded-lg border transition-all duration-200 disabled:opacity-40 font-semibold active:scale-95"
                style={{
                  backgroundColor: 'var(--cc-color-primary-soft)',
                  color: 'var(--cc-color-brand)',
                  borderColor: 'var(--cc-color-primary-border)',
                }}
              >
                {joinState === "joining" ? "…" : "Join"}
              </button>
            )}
            {isBlocked && (
              <span className="text-[10px] text-red-400 font-medium">
                Blocked until {new Date(myStatus.blockedUntil).toLocaleDateString()}
              </span>
            )}
            <button
              onClick={onView}
              className={cn(
                "text-[10px] font-semibold transition-all duration-200",
                "group-hover:translate-x-0.5 group-hover:opacity-100",
                "opacity-70",
                meta.accent
              )}
            >
              View →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
