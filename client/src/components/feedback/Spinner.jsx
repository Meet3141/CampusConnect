/**
 * Spinner.jsx — Canonical loading spinner
 * Replaces all hardcoded animate-spin divs across the codebase.
 *
 * Usage:
 *   <Spinner />
 *   <Spinner size="lg" color="white" />
 *   <Spinner size="sm" color="muted" />
 */
import { cn } from "../../utils/cn";

const SIZES = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-7 h-7 border-2",
  lg: "w-10 h-10 border-[3px]",
  xl: "w-14 h-14 border-4",
};

const COLORS = {
  brand: "border-indigo-500/30 border-t-indigo-500",
  white: "border-white/30 border-t-white",
  muted: "border-cc-soft border-t-cc-muted",
  success:"border-emerald-500/30 border-t-emerald-500",
  danger: "border-red-500/30 border-t-red-500",
};

export default function Spinner({ size = "md", color = "brand", className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full animate-spin shrink-0",
        SIZES[size] ?? SIZES.md,
        COLORS[color] ?? COLORS.brand,
        className
      )}
    />
  );
}

/* Full-page loading screen */
Spinner.Page = function SpinnerPage({ message = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <Spinner size="lg" />
      <p className="text-caption text-muted font-mono tracking-widest uppercase">{message}</p>
    </div>
  );
};
