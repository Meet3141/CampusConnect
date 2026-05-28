/**
 * Tabs.jsx — Accessible tab navigation (Semantic Token Migration: Layer D)
 * - Active tab uses text-primary + bg-brand underline via semantic brand token
 * - Focus ring uses semantic border-focus token
 * - Border uses border-border-subtle
 * - Count badge uses surface-secondary + text-text-muted
 *
 * Usage:
 *   <Tabs value={tab} onChange={setTab}>
 *     <Tabs.List>
 *       <Tabs.Tab value="about">About</Tabs.Tab>
 *       <Tabs.Tab value="events">Events <Tabs.Count>12</Tabs.Count></Tabs.Tab>
 *     </Tabs.List>
 *     <Tabs.Panel value="about">...</Tabs.Panel>
 *     <Tabs.Panel value="events">...</Tabs.Panel>
 *   </Tabs>
 */
import React, { createContext, useContext } from "react";
import { cn } from "../../utils/cn";

const TabsCtx = createContext({ value: null, onChange: () => {} });

function Tabs({ value, onChange, children, className }) {
  return (
    <TabsCtx.Provider value={{ value, onChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsCtx.Provider>
  );
}

Tabs.List = function TabsList({ children, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-0.5 border-b border-border-subtle overflow-x-auto scrollbar-none",
        className
      )}
    >
      {children}
    </div>
  );
};

Tabs.Tab = function TabsTab({ value, children, className, disabled }) {
  const ctx    = useContext(TabsCtx);
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      disabled={disabled}
      onClick={() => ctx.onChange(value)}
      className={cn(
        /* base — interactive-soft transition, semantic focus ring */
        "relative flex items-center gap-1.5 px-4 py-2.5 text-body-sm font-medium",
        "transition-fast-premium whitespace-nowrap",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1",
        /* active — brand text + animated bottom border via pseudo */
        active
          ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
          : "text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-t-soft",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
};

/* Optional count badge inside a tab */
Tabs.Count = function TabsCount({ children }) {
  return (
    <span className="text-micro font-mono tabular-nums px-1.5 py-px surface-secondary rounded-md text-text-muted">
      {children}
    </span>
  );
};

Tabs.Panel = function TabsPanel({ value, children, className }) {
  const ctx = useContext(TabsCtx);
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={cn("pt-5", className)}
    >
      {children}
    </div>
  );
};

export default Tabs;
