/**
 * BottomNav.jsx — Mobile hybrid adaptive bottom navigation
 * Visible only on screens < 768px (controlled via .cc-bottom-nav CSS class).
 *
 * 5 core tabs: Dashboard, Events, Clubs, Chats, Profile
 * Active state: brand color + upward pill indicator
 * Press state: spring scale-down for tactile feel
 */
import { useNavigate, useLocation } from "react-router-dom";

/* Nav tab definitions */
const TABS = [
  {
    label: "Home",
    path: "/dashboard",
    icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: "Events",
    path: "/events",
    icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Clubs",
    path: "/clubs",
    icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21V8l9-5 9 5v13" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.10 : 0} />
        <path d="M9 21v-8h6v8" />
      </svg>
    ),
  },
  {
    label: "Chats",
    path: "/chats",
    icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      </svg>
    ),
  },
  {
    label: "Profile",
    path: "/profile",
    icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

function isActive(pathname, path) {
  return pathname === path || (path !== "/dashboard" && pathname.startsWith(path + "/"));
}

export default function BottomNav() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="cc-bottom-nav" aria-label="Mobile navigation">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={`cc-bottom-nav__item${active ? " cc-bottom-nav__item--active" : ""}`}
          >
            {/* Active indicator dot above icon */}
            <span
              style={{
                width: 20,
                height: 3,
                borderRadius: 999,
                background: active ? "var(--cc-color-brand)" : "transparent",
                marginBottom: 2,
                transition: "background 200ms ease, width 200ms ease",
                alignSelf: "center",
              }}
            />
            <tab.icon active={active} />
            <span
              className="cc-bottom-nav__label"
              style={{
                opacity: active ? 1 : 0.7,
                fontWeight: active ? 700 : 500,
                transition: "opacity 150ms ease",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
