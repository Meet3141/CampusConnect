/**
 * AppLayout.jsx
 * Shared layout wrapper for all authenticated pages.
 */

import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconLogout, IconMenu, IconSearch } from "./layout/LayoutIcons";
import { NAV, getAdminNav } from "./layout/navigationConfig";
import ThemeToggle from "./ThemeToggle";

function isActivePath(pathname, path) {
  return pathname === path || (path !== "/dashboard" && pathname.startsWith(path + "/"));
}

function NavSection({ section, items, pathname, onNavigate }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-cc-muted font-medium px-3 mb-2">
        {section}
      </p>
      <ul className="space-y-0.5">
        {items.map(({ label, path, icon: Icon }) => {
          const active = isActivePath(pathname, path);
          return (
            <li key={path}>
              <button
                onClick={() => onNavigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-all ${
                  active
                    ? "bg-cc-surface-hover text-cc"
                    : "text-cc-muted hover:text-cc hover-bg-cc-surface"
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
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.roles?.includes("orgAdmin");
  const isEditor = user?.roles?.includes("editor");
  const adminNav = getAdminNav({ isAdmin, isEditor });

  const userInitials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const onNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-cc-bg text-cc overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-60 w-[220px] flex flex-col bg-cc-surface border-r border-cc-soft transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-cc-soft">
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
            <img src="/depstar-logo.jpeg" alt="DEPSTAR" className="w-full h-full object-contain p-1 bg-white" />
          </div>
          <span className="font-semibold text-base text-cc tracking-tight">CampusConnect</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV.map(({ section, items }) => (
            <NavSection
              key={section}
              section={section}
              items={items}
              pathname={location.pathname}
              onNavigate={onNavigate}
            />
          ))}

          {adminNav.length > 0 && (
            <NavSection
              section="Administration"
              items={adminNav}
              pathname={location.pathname}
              onNavigate={onNavigate}
            />
          )}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-cc-soft">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="flex-1 flex items-center gap-3 px-2 py-2 rounded-xl hover-bg-cc-surface transition-colors text-left group/profile"
              title="View your profile"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-950 ring-1 ring-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cc truncate group-hover/profile:text-cc transition-colors">
                  {user?.name}
                </p>
                <p className="text-[10px] text-cc-muted capitalize">{user?.roles?.[0] || "member"}</p>
              </div>
            </button>

            <button onClick={logout} className="shrink-0 p-2 rounded-xl text-cc-muted hover:text-red-500 hover:bg-red-500/10 transition-all" title="Log out">
              <IconLogout size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className={`flex items-center justify-between px-6 py-3 border-b border-cc-soft bg-cc-surface-overlay backdrop-blur-md shrink-0 relative transition-opacity ${
            sidebarOpen ? "z-0 opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto" : "z-10"
          }`}
        >
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

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
