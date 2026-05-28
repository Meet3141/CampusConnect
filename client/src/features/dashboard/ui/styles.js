/**
 * dashboard/ui/styles.js
 * Phase 7 — Visual Hierarchy Reconstruction
 * Reconstructed for proper surface architecture, hierarchy contrast, and premium restraint.
 */
export const styles = {
  /* Page wrapper — uses full scroll area, no max-width cap (let layout primitives handle it) */
  page: "w-full px-5 lg:px-6 py-6 stack-lg",

  /* Stat grid — 4-col desktop, 2-col tablet/mobile via cc-stat-grid */
  statGrid: "cc-stat-grid",

  /* Two-column dashboard split — uses cc-dashboard-grid */
  twoColumnGrid: "cc-dashboard-grid",

  /* Section headers */
  sectionHeader: "cc-section-header",
  sectionTitleRow: "cc-section-title-row",
  sectionTitle: "text-heading-sm font-bold text-cc",
  sectionCount: "text-micro font-mono tabular-nums px-1.5 py-px bg-cc-surface-weak text-muted rounded-md",
  sectionLink: "text-caption text-accent font-medium",

  /* Stat card — top accent strip, proper surface, restrained hover */
  statCard:
    "group relative text-left bg-cc-surface border border-cc-soft rounded-2xl p-4 cc-stat-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--cc-shadow-hover-sm)] hover:border-cc-strong",
  statLabel: "text-caption text-muted font-medium",
  statValue: "text-heading-xl text-cc tabular-nums",
  statSub: "text-caption mt-1",

  /* Club mini card — white surface on grouped background */
  clubCard:
    "group text-left flex items-center gap-3 p-3 rounded-xl border border-cc-soft bg-cc-surface hover:border-cc-strong hover:-translate-y-px transition-all duration-200",
  clubName: "text-body-sm font-semibold text-cc group-hover:text-accent transition-colors truncate",
  clubMeta: "text-caption text-muted mt-0.5",

  /* Event / chat / bookmark list rows */
  eventList: "rounded-2xl border border-cc-soft overflow-hidden bg-cc-surface",
  rowBase:
    "relative group w-full flex items-center gap-4 px-4 py-3 hover:bg-cc-surface-hover transition-colors text-left",
  rowDate: "w-9 shrink-0 text-center",
  rowDivider: "w-px h-8 bg-cc-border-soft shrink-0",
  rowTitle: "text-body-sm font-semibold text-cc group-hover:text-accent transition-colors truncate",
  rowMeta: "text-caption text-muted mt-0.5 truncate",
  chatRow:
    "group w-full flex items-center gap-3 px-4 py-3 hover:bg-cc-surface-hover transition-colors text-left",
  chatName: "text-body-sm font-semibold text-cc truncate",
  chatMessage: "text-caption text-muted truncate mt-0.5",
  bookmarkRow: "flex items-center gap-3 px-4 py-3",
  bookmarkTitle: "text-body-sm font-semibold text-cc truncate",
  bookmarkMeta: "text-micro text-muted mt-0.5",

  /* Empty state — grouped surface background, cleaner look */
  emptyState:
    "flex flex-col items-center py-6 gap-3 text-center rounded-2xl bg-cc-surface-weak border border-cc-soft",

  /* Skeleton */
  skeletonWrapper: "px-5 lg:px-6 py-6 stack-lg",
  skeletonCard: "h-20 rounded-2xl cc-skeleton",
};