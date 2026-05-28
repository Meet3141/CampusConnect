/**
 * PageHeader.jsx
 * Standard page header with breadcrumb, title, subtitle, actions, and optional decorative glows.
 * Used at the top of every authenticated page to create consistent visual hierarchy.
 *
 * Usage:
 *   <PageHeader
 *     breadcrumb="Dashboard / Clubs"
 *     title="Discover Clubs"
 *     titleAccent="Clubs"
 *     subtitle="142 clubs on campus"
 *     actions={<button>+ New Club</button>}
 *     decorative
 *   />
 */

/**
 * @param {{
 *   breadcrumb?: string,
 *   title: string,
 *   titleAccent?: string,
 *   subtitle?: string,
 *   actions?: React.ReactNode,
 *   filterRow?: React.ReactNode,
 *   decorative?: boolean,
 *   glowColor?: 'indigo'|'sky'|'violet'|'emerald'|'amber',
 *   className?: string,
 * }} props
 */
export default function PageHeader({
  breadcrumb,
  title,
  titleAccent,
  subtitle,
  actions,
  filterRow,
  decorative = false,
  glowColor = "indigo",
  className = "",
}) {
  const GLOWS = {
    indigo: ["bg-primary-soft/60 left-1/3", "bg-primary-soft/30 right-1/4"],
    sky:    ["bg-accent-soft/50 left-1/4",   "bg-primary-soft/40 right-1/3"],
    violet: ["bg-primary-soft/50 left-1/4",  "bg-primary-soft/30 right-1/3"],
    emerald:["bg-success/5 left-1/3",         "bg-accent-soft/30 right-1/4"],
    amber:  ["bg-warning/5 left-1/3",         "bg-warning/3 right-1/4"],
  };

  const ACCENT_GRADIENT = {
    indigo:  "from-brand to-accent",
    sky:     "from-accent to-brand",
    violet:  "from-brand to-brand-hover",
    emerald: "from-success to-accent",
    amber:   "from-warning to-brand",
  };

  const glows       = GLOWS[glowColor] ?? GLOWS.indigo;
  const accentGrad  = ACCENT_GRADIENT[glowColor] ?? ACCENT_GRADIENT.indigo;

  // Build the title node — optionally highlight an accent word with a gradient
  const renderTitle = () => {
    if (!titleAccent || !title.includes(titleAccent)) {
      return <h1 className="text-display-lg font-heading text-cc leading-tight">{title}</h1>;
    }
    const parts = title.split(titleAccent);
    return (
      <h1 className="text-display-lg font-heading text-cc leading-tight">
        {parts[0]}
        <span className={`bg-gradient-to-r ${accentGrad} bg-clip-text text-transparent`}>
          {titleAccent}
        </span>
        {parts[1]}
      </h1>
    );
  };

  return (
    <div className={`cc-page-header ${className}`.trim()}>
      {/* Decorative blurred glows */}
      {decorative && (
        <div className="cc-page-header-glow" aria-hidden="true">
          <div className={`absolute top-0 w-96 h-64 rounded-full blur-3xl ${glows[0]}`} />
          <div className={`absolute top-0 w-64 h-64 rounded-full blur-3xl ${glows[1]}`} />
        </div>
      )}

      <div className="cc-page-header-content">
        {/* Breadcrumb */}
        {breadcrumb && (
          <p className="text-micro uppercase tracking-widest text-cc-muted font-mono">
            {breadcrumb}
          </p>
        )}

        {/* Title row + actions */}
        <div className="cc-page-header-top">
          <div className="stack-xs">
            {renderTitle()}
            {subtitle && (
              <p className="text-body-sm text-secondary">{subtitle}</p>
            )}
          </div>

          {actions && (
            <div className="cc-action-bar">
              {actions}
            </div>
          )}
        </div>

        {/* Optional filter row (search + filters) */}
        {filterRow && (
          <div className="cc-filter-row mt-1">
            {filterRow}
          </div>
        )}
      </div>
    </div>
  );
}
