/**
 * cn.js — Class name merger utility
 * Combines class strings/objects/conditionals, filters falsy values.
 *
 * Usage:
 *   cn("base", isActive && "active", { hidden: !visible })
 *   → "base active" (if isActive && visible)
 */
export function cn(...args) {
  return args
    .flatMap((arg) => {
      if (!arg) return [];
      if (typeof arg === "string") return [arg];
      if (Array.isArray(arg)) return [cn(...arg)];
      if (typeof arg === "object") {
        return Object.entries(arg)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k);
      }
      return [];
    })
    .filter(Boolean)
    .join(" ");
}
