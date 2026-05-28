/**
 * Avatar.jsx — Unified avatar with initials fallback + AvatarGroup
 * Semantic Token Migration: Layer D
 * - Photo avatar ring uses border-subtle semantic token
 * - Group separator ring uses surface semantic token
 * - PALETTES kept distinct for visual identity (deterministic colour per user)
 *
 * Usage:
 *   <Avatar name="Ankit Kumar" size="md" />
 *   <Avatar src="/photo.jpg" name="AK" size="lg" />
 *   <Avatar.Group avatars={[{name:"A"},{name:"B"}]} max={3} size="sm" />
 */
import { cn } from "../../utils/cn";

const SIZES = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-[13px]",
  lg: "w-11 h-11 text-[15px]",
  xl: "w-14 h-14 text-[18px]",
};

/**
 * Deterministic colour palette per user — keeps category-accent hues for
 * visual identity. These intentionally use specific values (not semantic tokens)
 * because they represent *identity* colours, not *status* colours.
 */
const PALETTES = [
  "bg-primary-soft   text-primary   ring-primary-border",
  "bg-[#7C6FCD]/12   text-[#7C6FCD] ring-[#7C6FCD]/25",
  "bg-success/10     text-success    ring-success/20",
  "bg-accent-soft    text-accent     ring-accent-border",
  "bg-warning/10     text-warning    ring-warning/20",
  "bg-error/10       text-error      ring-error/20",
  "bg-[#3DA9A0]/10   text-[#3DA9A0] ring-[#3DA9A0]/20",
  "bg-[#C05E7A]/10   text-[#C05E7A] ring-[#C05E7A]/20",
];

function hashName(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * @param {{
 *   name?: string,
 *   src?: string,
 *   size?: 'xs'|'sm'|'md'|'lg'|'xl',
 *   className?: string,
 * }} props
 */
function Avatar({ name = "", src, size = "md", className }) {
  const palette  = hashName(name);
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "rounded-full ring-1 flex items-center justify-center shrink-0 overflow-hidden font-bold",
        SIZES[size] ?? SIZES.md,
        /* Photo: neutral surface + border-subtle ring */
        src ? "bg-surface ring-border-subtle" : palette,
        className
      )}
      title={name || undefined}
    >
      {src ? (
        <img src={src} alt={name || "avatar"} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

/* Stacked avatar group */
Avatar.Group = function AvatarGroup({ avatars = [], max = 4, size = "sm", className }) {
  const visible  = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className={cn("flex -space-x-1.5", className)}>
      {visible.map((av, i) => (
        <Avatar
          key={i}
          name={av.name}
          src={av.src}
          size={size}
          /* ring-2 ring-surface creates the white/dark separation between stacked avatars */
          className="ring-2 ring-surface"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "rounded-full ring-2 ring-surface flex items-center justify-center",
            "surface-secondary text-text-muted font-bold",
            SIZES[size] ?? SIZES.sm
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default Avatar;
