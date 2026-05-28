/**
 * variants.js — CVA-inspired variant utility
 * Generates a class string from a base + variant config.
 *
 * Usage:
 *   const buttonCls = cv(
 *     "inline-flex items-center font-medium",
 *     {
 *       variants: {
 *         variant: { primary: "bg-indigo-600", ghost: "bg-transparent" },
 *         size:    { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" },
 *       },
 *       defaultVariants: { variant: "primary", size: "md" },
 *     }
 *   );
 *   buttonCls({ variant: "ghost", size: "sm" }) → "inline-flex ... bg-transparent px-3 py-1.5 text-xs"
 */
export function cv(base, config = {}) {
  const { variants = {}, defaultVariants = {}, compoundVariants = [] } = config;

  return function resolve(props = {}) {
    const parts = [base];

    for (const [key, map] of Object.entries(variants)) {
      const value = props[key] ?? defaultVariants[key];
      if (value != null && map[value]) {
        parts.push(map[value]);
      }
    }

    for (const { className, ...conditions } of compoundVariants) {
      const match = Object.entries(conditions).every(
        ([k, v]) => (props[k] ?? defaultVariants[k]) === v
      );
      if (match) parts.push(className);
    }

    // Merge extra className passed directly
    if (props.className) parts.push(props.className);

    return parts.filter(Boolean).join(" ");
  };
}
