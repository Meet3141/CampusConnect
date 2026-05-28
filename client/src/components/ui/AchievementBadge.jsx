/**
 * AchievementBadge.jsx — Phase 6 update
 * Replaced all emoji icons with Lucide icon components for visual consistency.
 *
 * Badge icon mapping:
 *   club_member     → Building2    (club/institution)
 *   event_attendee  → CalendarCheck (attended event)
 *   multi_club      → Target        (3+ clubs goal)
 *   volunteer       → HandHeart     (helping hand)
 *   bookmarker      → Bookmark      (saved items)
 *   social_butterfly→ MessageCircle (chats)
 *   early_adopter   → Zap           (early/lightning)
 */
import { useState } from "react";
import { cn } from "../../utils/cn";
import {
  Building2,
  CalendarCheck,
  Target,
  HandHeart,
  Bookmark,
  MessageCircle,
  Zap,
  Lock,
} from "lucide-react";

/* ── Badge definitions ── */
export const BADGE_DEFINITIONS = {
  club_member: {
    id:          "club_member",
    label:       "Club Member",
    Icon:        Building2,
    description: "Joined your first club",
    color:       "from-indigo-500/20 to-indigo-600/10",
    ring:        "ring-indigo-500/30",
    glow:        "shadow-indigo-500/20",
    iconColor:   "text-indigo-400",
  },
  event_attendee: {
    id:          "event_attendee",
    label:       "Event Attendee",
    Icon:        CalendarCheck,
    description: "Attended a campus event",
    color:       "from-sky-500/20 to-sky-600/10",
    ring:        "ring-sky-500/30",
    glow:        "shadow-sky-500/20",
    iconColor:   "text-sky-400",
  },
  multi_club: {
    id:          "multi_club",
    label:       "Multi-Club",
    Icon:        Target,
    description: "Active in 3+ clubs",
    color:       "from-violet-500/20 to-violet-600/10",
    ring:        "ring-violet-500/30",
    glow:        "shadow-violet-500/20",
    iconColor:   "text-violet-400",
  },
  volunteer: {
    id:          "volunteer",
    label:       "Volunteer",
    Icon:        HandHeart,
    description: "Volunteered for an event",
    color:       "from-emerald-500/20 to-emerald-600/10",
    ring:        "ring-emerald-500/30",
    glow:        "shadow-emerald-500/20",
    iconColor:   "text-emerald-400",
  },
  bookmarker: {
    id:          "bookmarker",
    label:       "Bookmarker",
    Icon:        Bookmark,
    description: "Saved 5+ events",
    color:       "from-amber-500/20 to-amber-600/10",
    ring:        "ring-amber-500/30",
    glow:        "shadow-amber-500/20",
    iconColor:   "text-amber-400",
  },
  social_butterfly: {
    id:          "social_butterfly",
    label:       "Social Butterfly",
    Icon:        MessageCircle,
    description: "Active in 3+ chat rooms",
    color:       "from-rose-500/20 to-rose-600/10",
    ring:        "ring-rose-500/30",
    glow:        "shadow-rose-500/20",
    iconColor:   "text-rose-400",
  },
  early_adopter: {
    id:          "early_adopter",
    label:       "Early Adopter",
    Icon:        Zap,
    description: "One of the first CampusConnect users",
    color:       "from-yellow-500/20 to-yellow-600/10",
    ring:        "ring-yellow-500/30",
    glow:        "shadow-yellow-500/20",
    iconColor:   "text-yellow-400",
  },
};

/**
 * Derive earned badges from user activity data.
 * @param {object} userData - user profile data with clubs, events, bookmarks, chats
 * @returns {string[]} list of earned badge IDs
 */
export function deriveEarnedBadges(userData) {
  const earned = [];
  if (!userData) return earned;

  const clubCount     = userData.clubs?.length || 0;
  const eventCount    = userData.attendedEvents?.length || 0;
  const bookmarkCount = userData.bookmarks?.length || 0;
  const chatCount     = userData.chats?.length || 0;
  const isVolunteer   = userData.volunteerEvents?.length > 0;

  if (clubCount >= 1)     earned.push("club_member");
  if (clubCount >= 3)     earned.push("multi_club");
  if (eventCount >= 1)    earned.push("event_attendee");
  if (isVolunteer)        earned.push("volunteer");
  if (bookmarkCount >= 5) earned.push("bookmarker");
  if (chatCount >= 3)     earned.push("social_butterfly");
  // Early adopter: always earned for existing users
  earned.push("early_adopter");

  return earned;
}

/* Icon size map */
const ICON_SIZES = { sm: 16, md: 20, lg: 26 };
const CONTAINER_SIZES = {
  sm: { icon: "w-9 h-9",   label: "text-[10px]" },
  md: { icon: "w-12 h-12", label: "text-[11px]" },
  lg: { icon: "w-16 h-16", label: "text-[12px]" },
};

/**
 * @param {{
 *   badge: object,
 *   earned?: boolean,
 *   size?: 'sm'|'md'|'lg',
 *   showLabel?: boolean,
 * }} props
 */
export default function AchievementBadge({ badge, earned = false, size = "md", showLabel = true }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const { icon: iconContainerSize, label: labelSize } = CONTAINER_SIZES[size] ?? CONTAINER_SIZES.md;
  const iconPx = ICON_SIZES[size] ?? ICON_SIZES.md;
  const { Icon } = badge;

  return (
    <div
      className="relative flex flex-col items-center gap-1.5 group"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      {/* Badge icon container */}
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl ring-1 transition-all duration-250",
          iconContainerSize,
          earned
            ? [
                "bg-gradient-to-br",
                badge.color,
                badge.ring,
                "group-hover:scale-110 group-hover:shadow-lg animate-badge-pop",
                badge.glow,
              ].join(" ")
            : "bg-cc-surface-weak ring-cc-soft opacity-40"
        )}
      >
        {earned ? (
          Icon && <Icon size={iconPx} className={cn("shrink-0", badge.iconColor)} strokeWidth={1.8} />
        ) : (
          <Lock size={iconPx - 4} className="text-muted" strokeWidth={1.8} />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className={cn(
            "font-medium text-center leading-tight max-w-[60px]",
            labelSize,
            earned ? "text-cc" : "text-muted opacity-60"
          )}
        >
          {badge.label}
        </span>
      )}

      {/* Tooltip */}
      {tooltipVisible && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-cc-surface border border-cc-soft rounded-xl px-3 py-2 text-center z-50 shadow-xl w-36 pointer-events-none animate-fade-scale">
          <div className="flex items-center justify-center mb-1">
            {Icon && <Icon size={14} className={badge.iconColor} strokeWidth={2} />}
          </div>
          <p className="text-[12px] font-semibold text-cc">{badge.label}</p>
          <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{badge.description}</p>
          {!earned && (
            <p className="text-[10px] text-muted/60 mt-1 font-medium flex items-center justify-center gap-1">
              <Lock size={9} /> Not yet earned
            </p>
          )}
        </div>
      )}
    </div>
  );
}
