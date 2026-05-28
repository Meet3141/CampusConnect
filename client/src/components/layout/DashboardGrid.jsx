/**
 * DashboardGrid.jsx
 * The standard 3+2 split grid used in the main dashboard.
 * Left column: main content (events, activity). Right column: sidebar widgets (chats, bookmarks).
 * Stacks vertically on tablet and below.
 *
 * Usage:
 *   <DashboardGrid>
 *     <div>Left content (takes 3fr)</div>
 *     <div>Right aside (takes 2fr)</div>
 *   </DashboardGrid>
 */

/**
 * @param {{ className?: string, children: React.ReactNode }} props
 */
export default function DashboardGrid({ className = "", children }) {
  return (
    <div className={`cc-dashboard-grid ${className}`.trim()}>
      {children}
    </div>
  );
}
