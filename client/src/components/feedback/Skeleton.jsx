/**
 * Skeleton.jsx — Phase 5 upgrade
 * Replaces flat pulse animation with directional shimmer sweep.
 * Provides composable primitives: Skeleton.Card, Skeleton.Text,
 * Skeleton.Heading, Skeleton.Avatar, Skeleton.Grid.
 *
 * Usage:
 *   <Skeleton.Grid count={6} renderItem={() => <Skeleton.Card />} />
 *   <Skeleton.Avatar size="md" />
 *   <Skeleton.Text lines={3} />
 */
import { cn } from "../../utils/cn";

/* ── Base shimmer block ── */
function SkeletonBase({ className, style }) {
  return (
    <div
      className={cn("cc-skeleton rounded-md", className)}
      style={style}
      aria-hidden="true"
    />
  );
}

/* ── Card skeleton ── */
function Card({ className }) {
  return (
    <div className={cn("rounded-2xl overflow-hidden border border-cc-soft", className)}>
      {/* Cover image area */}
      <SkeletonBase className="h-24 rounded-none" />
      {/* Body */}
      <div className="p-4 space-y-3">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-5/6" />
        <div className="flex items-center justify-between pt-1">
          <SkeletonBase className="h-3 w-16" />
          <SkeletonBase className="h-6 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ── Row skeleton (for list items) ── */
function Row({ className }) {
  return (
    <div className={cn("flex items-center gap-3 p-4", className)}>
      <SkeletonBase className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-3 w-1/2" />
        <SkeletonBase className="h-3 w-3/4" />
      </div>
    </div>
  );
}

/* ── Avatar skeleton ── */
const AVATAR_SIZES = {
  sm: "w-7 h-7",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

function Avatar({ size = "md", className }) {
  return (
    <SkeletonBase
      className={cn("rounded-full shrink-0", AVATAR_SIZES[size] ?? AVATAR_SIZES.md, className)}
    />
  );
}

/* ── Heading skeleton ── */
function Heading({ className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <SkeletonBase className="h-6 w-2/3" />
      <SkeletonBase className="h-4 w-1/2" />
    </div>
  );
}

/* ── Text lines skeleton ── */
function Text({ lines = 2, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? "70%" : "100%" }}
        />
      ))}
    </div>
  );
}

/* ── Stat card skeleton ── */
function StatCard({ className }) {
  return (
    <div className={cn("rounded-2xl p-4 border border-cc-soft space-y-3", className)}>
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-3 w-24" />
        <SkeletonBase className="w-6 h-6 rounded-lg" />
      </div>
      <SkeletonBase className="h-8 w-16" />
      <SkeletonBase className="h-3 w-28" />
    </div>
  );
}

/* ── Grid of skeletons ── */
function Grid({ count = 6, renderItem, className, gridClass }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", gridClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 60}ms` }}>
          {renderItem ? renderItem(i) : <Card />}
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard skeleton ── */
function Dashboard() {
  return (
    <div className="px-5 lg:px-6 py-6 space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCard key={i} />)}
      </div>
      {/* Section */}
      <div className="space-y-3">
        <SkeletonBase className="h-4 w-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl cc-skeleton" />
          ))}
        </div>
      </div>
      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        <div className="space-y-4 rounded-2xl border border-cc-soft overflow-hidden p-0">
          {Array.from({ length: 4 }).map((_, i) => <Row key={i} />)}
        </div>
        <div className="space-y-4 rounded-2xl border border-cc-soft overflow-hidden p-0">
          {Array.from({ length: 3 }).map((_, i) => <Row key={i} />)}
        </div>
      </div>
    </div>
  );
}

const Skeleton = {
  Base: SkeletonBase,
  Card,
  Row,
  Avatar,
  Heading,
  Text,
  StatCard,
  Grid,
  Dashboard,
};

export default Skeleton;
