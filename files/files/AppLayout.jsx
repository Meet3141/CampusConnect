/**
 * AppLayout.jsx
 * Shared layout wrapper for all authenticated pages.
 * Persistent left sidebar (220px) + scrollable main content via <Outlet />.
 *
 * v2 changes:
 *  - Added "Admin" nav section — shown conditionally based on user roles
 *    clubAdmin/orgAdmin → see Admin Panel + Analytics
 *    editor/orgAdmin    → see Verify Events
 *  - Edit club/event links surface from within those pages (not sidebar)
 */

import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ─── Nav definition ────────────────────────────────────────── */
const NAV = [
  {
    section: "Main",
    items: [
      { label: "Dashboard",       path: "/dashboard",       icon: IconDashboard },
      { label: "My Clubs",        path: "/my-clubs",        icon: IconClubs     },
      { label: "Events",          path: "/clubs",           icon: IconEvents    },
      { label: "Chats",           path: "/chats",           icon: IconChat      },
    ],
  },
  {
    section: "Discover",
    items: [
      { label: "External Events", path: "/external-events", icon: IconGlobe     },
      { label: "Bookmarks",       path: "/bookmarks",       icon: IconBookmark  },
    ],
  },
];

/* Admin items are rendered separately — shown only to appropriate roles */
const ADMIN_NAV = [
  {
    label:  "Admin Panel",
    path:   "/admin",
    icon:   IconAdmin,
    roles:  ["orgAdmin"],                    // only orgAdmin
  },
  {
    label:  "Verify Events",
    path:   "/admin/verify",
    icon:   IconVerify,
    roles:  ["editor", "orgAdmin"],          // editor + orgAdmin
  },
  {
    label:  "Analytics",
    path:   "/admin/stats",
    icon:   IconStats,
    roles:  ["clubAdmin", "orgAdmin"],       // clubAdmin + orgAdmin
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRoles     = user?.roles || [];
  const isOrgAdmin    = userRoles.includes("orgAdmin");
  const isClubAdmin   = userRoles.includes("clubAdmin");
  const isEditor      = userRoles.includes("editor");
  const canCreateClub = isClubAdmin || isOrgAdmin;

  /* Filter admin nav items to those the current user can access */
  const visibleAdminNav = ADMIN_NAV.filter((item) =>
    item.roles.some((r) => userRoles.includes(r))
  );

  const userInitials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path + "/"));

  return (
    <div className="flex h-screen bg-[#0a0a12] text-white overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════ */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-[220px] flex flex-col
          bg-[#0d0d18] border-r border-white/[0.06] transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.95"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.6"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.6"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.3"/>
            </svg>
          </div>
          <span className="font-semibold text-base text-white tracking-tight">
            CampusConnect
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

          {/* Main + Discover sections */}
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <p className="text-[11px] uppercase tracking-widest text-slate-600 font-medium px-3 mb-2">
                {section}
              </p>
              <ul className="space-y-0.5">
                {items.map(({ label, path, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <li key={path}>
                      <button
                        onClick={() => { navigate(path); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-all ${
                          active
                            ? "bg-indigo-600/20 text-indigo-300"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        <Icon size={15} active={active} />
                        <span className="flex-1 text-left">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Admin section — only rendered if user has at least one admin role */}
          {visibleAdminNav.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-600 font-medium px-3 mb-2">
                Admin
              </p>
              <ul className="space-y-0.5">
                {visibleAdminNav.map(({ label, path, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <li key={path}>
                      <button
                        onClick={() => { navigate(path); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-all ${
                          active
                            ? "bg-amber-600/20 text-amber-300"   // amber accent for admin
                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                        }`}
                      >
                        <Icon size={15} active={active} />
                        <span className="flex-1 text-left">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* User + logout */}
        <div className="px-3 pb-4 pt-2 border-t border-white/[0.06]">
          {canCreateClub && (
            <button
              onClick={() => navigate("/clubs/create")}
              className="w-full mb-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              <span className="text-base leading-none">+</span> New Club
            </button>
          )}
          <button
            onClick={() => navigate("/profile")}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-950 ring-1 ring-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-600 capitalize">
                {userRoles[0] || "member"}
                {userRoles.length > 1 && <span className="text-slate-700"> +{userRoles.length - 1}</span>}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); logout(); navigate("/login"); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 p-1"
              title="Log out"
            >
              <IconLogout size={14} />
            </button>
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <IconMenu size={20} />
            </button>
          </div>

          <button
            onClick={() => navigate("/clubs")}
            className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-500 hover:text-white hover:border-white/[0.15] transition-all"
          >
            <IconSearch size={14} />
            Search clubs, events…
            <span className="text-[11px] px-1.5 py-px bg-white/[0.06] rounded-md text-slate-600">/</span>
          </button>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Icons — inline SVG (no external deps)
════════════════════════════════════════════════════════════ */

function IconDashboard({ size = 16, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill={active ? "#818cf8" : "currentColor"} opacity={active ? 1 : 0.7}/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.2"/>
    </svg>
  );
}
function IconClubs({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 14c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconEvents({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1" y="3.5" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 1v5M11 1v5M1 8h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconChat({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M2 2.5h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 2.5V3.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
function IconGlobe({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 1.5C8 1.5 5.5 4.5 5.5 8s2.5 6.5 2.5 6.5M8 1.5c0 0 2.5 3 2.5 6.5S8 14.5 8 14.5M1.5 8h13" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
function IconBookmark({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M3 2h10a1 1 0 011 1v11l-6-3.5L2 14V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
function IconAdmin({ size = 16, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconVerify({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M8 1.5L9.8 3.5H13l-2.7 2 1.1 3.3L8 7l-3.4 1.8 1.1-3.3L3 3.5h3.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M4 11l2.5 2.5L12 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconStats({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M1 13h2V7H1v6zM6 13h2V4H6v9zM11 13h2V9h-2v4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
function IconSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function IconLogout({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconMenu({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
