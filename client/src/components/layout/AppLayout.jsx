/**
 * AppLayout.jsx
 * Shared layout wrapper for all authenticated pages.
 *
 * Sidebar behaviour (desktop):
 *   - Always starts as a 56px icon-only rail
 *   - Smoothly expands to 220px on hover (spring easing)
 *   - Collapses back to rail on mouse-leave
 *   - No manual toggle / no localStorage needed
 * Mobile: Bottom navigation bar (BottomNav component), off-canvas drawer for tablet.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { IconBell, IconLogout, IconMenu } from "./LayoutIcons";
import { NAV, getAdminNav } from "./navigationConfig";
import ThemeToggle from "../ui/ThemeToggle";
import BottomNav from "../navigation/BottomNav";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../features/admin/api";

/* ─── Helpers ─── */
function isActivePath(pathname, path) {
  return pathname === path || (path !== "/dashboard" && pathname.startsWith(path + "/"));
}

/* ─── Nav item ─── */
function NavItem({ label, path, icon, pathname, onNavigate, collapsed }) {
  const active = isActivePath(pathname, path);

  if (collapsed) {
    return (
      <li className="flex justify-center">
        <button
          onClick={() => onNavigate(path)}
          title={label}
          aria-label={label}
          className="relative flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-200"
          style={{
            background: active ? 'var(--cc-color-sidebar-active, rgba(0,79,159,0.08))' : 'transparent',
            color: active ? 'var(--cc-color-sidebar-text-active, var(--cc-color-brand))' : 'var(--cc-color-sidebar-text, var(--cc-color-text-muted))',
            transform: active ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1), background 150ms ease, color 150ms ease',
          }}
        >
          {active && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
              style={{
                width: 3,
                height: 24,
                backgroundColor: 'var(--cc-color-brand)',
                transition: 'height 250ms cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          )}
          {icon({ size: 16, active })}
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => onNavigate(path)}
        className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200"
        style={{
          background: active ? 'var(--cc-color-sidebar-active)' : 'transparent',
          color: active ? 'var(--cc-color-sidebar-text-active)' : 'var(--cc-color-sidebar-text)',
          fontWeight: active ? 600 : 500,
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = 'var(--cc-color-sidebar-hover)';
            e.currentTarget.style.color = 'var(--cc-color-text-primary)';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--cc-color-sidebar-text)';
          }
        }}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
            style={{
              width: 3,
              height: 24,
              backgroundColor: 'var(--cc-color-brand)',
              transition: 'height 250ms cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        )}
        <span
          className="shrink-0 transition-transform duration-200"
          style={{ transform: active ? 'scale(1.12)' : 'scale(1)' }}
        >
          {icon({ size: 16, active })}
        </span>
        <span className="flex-1 text-left leading-none whitespace-nowrap overflow-hidden">
          {label}
        </span>
      </button>
    </li>
  );
}

/* ─── Nav section ─── */
function NavSection({ section, items, pathname, onNavigate, collapsed }) {
  return (
    <div className="cc-sidebar-group">
      {!collapsed && (
        <p
          className="text-[11px] uppercase tracking-widest font-semibold px-3 mb-1.5 whitespace-nowrap overflow-hidden"
          style={{ color: 'var(--cc-color-text-secondary)' }}
        >
          {section}
        </p>
      )}
      <ul className={collapsed ? "flex flex-col items-center gap-0.5" : "space-y-0.5"}>
        {items.map(({ label, path, icon }) => (
          <NavItem
            key={path}
            label={label}
            path={path}
            icon={icon}
            pathname={pathname}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ))}
      </ul>
    </div>
  );
}

/* ─── Main layout ─── */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [mobileOpen,             setMobileOpen]             = useState(false);
  const [sidebarHovered,         setSidebarHovered]         = useState(false);
  const [notificationsOpen,      setNotificationsOpen]      = useState(false);
  const [notifications,          setNotifications]          = useState([]);
  const [notificationLoading,    setNotificationLoading]    = useState(false);
  const [notificationProcessingId, setNotificationProcessingId] = useState("");
  const [markAllProcessing,      setMarkAllProcessing]      = useState(false);
  const notificationsRef = useRef(null);

  // Sidebar is collapsed whenever it's not being hovered (desktop)
  const collapsed = !sidebarHovered;

  const isAdmin     = user?.roles?.includes("orgAdmin");
  const isEditor    = user?.roles?.includes("editor");
  const isClubAdmin = user?.roles?.includes("clubAdmin");
  const adminNav    = getAdminNav({ isAdmin, isEditor, isClubAdmin });

  const userInitials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => n.status !== "read" && !n.readAt),
    [notifications]
  );

  /* Close notifications on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Load notifications */
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setNotificationLoading(true);
        const res = await fetchNotifications(6);
        setNotifications(res.data.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setNotificationLoading(false);
      }
    };
    load();
  }, [user]);

  const onNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const refreshNotifications = async () => {
    const res = await fetchNotifications(6);
    setNotifications(res.data.data || []);
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkAllProcessing(true);
      await markAllNotificationsRead();
      await refreshNotifications();
    } finally {
      setMarkAllProcessing(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      setNotificationProcessingId(id);
      await markNotificationRead(id);
      await refreshNotifications();
    } finally {
      setNotificationProcessingId("");
    }
  };

  return (
    <div className="cc-app-shell">

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="cc-sidebar-backdrop lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════════════
          SIDEBAR — desktop (hover-to-expand rail)
      ══════════════════════════════════════════════ */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`cc-sidebar hidden lg:flex ${collapsed ? "cc-sidebar--collapsed" : ""}`}
        aria-label="Main navigation"
      >
        {/* Logo / wordmark */}
        <div className={`flex items-center border-b border-[var(--cc-color-sidebar-border)] shrink-0 transition-all duration-300 ${
          collapsed ? "justify-center px-3 py-4" : "gap-3 px-4 py-4"
        }`}>
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 transition-transform duration-200 hover:scale-105">
            <img src="/depstar-logo.jpeg" alt="DEPSTAR" className="w-full h-full object-contain p-0.5 bg-white" />
          </div>
          <span
            className="font-semibold text-sm text-cc tracking-tight whitespace-nowrap overflow-hidden"
            style={{
              maxWidth: collapsed ? 0 : 160,
              opacity: collapsed ? 0 : 1,
              transition: "max-width 300ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease",
            }}
          >
            CampusConnect
          </span>
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-5 transition-all duration-300 ${
          collapsed ? "px-2" : "px-3"
        }`}>
          {NAV.map(({ section, items }) => (
            <NavSection
              key={section}
              section={section}
              items={items}
              pathname={location.pathname}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          ))}

          {adminNav.length > 0 && (
            <NavSection
              section="Administration"
              items={adminNav}
              pathname={location.pathname}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          )}
        </nav>

        {/* Bottom: user profile */}
        <div className={`shrink-0 border-t border-[var(--cc-color-sidebar-border)] transition-all duration-300 ${
          collapsed ? "px-2 py-3 flex flex-col items-center gap-2" : "px-3 pb-4 pt-3"
        }`}>
          {!collapsed ? (
            /* Expanded: avatar + name + logout */
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/profile")}
                className="flex-1 flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-hover transition-colors text-left group/profile"
                title="View your profile"
              >
                <div className="w-7 h-7 rounded-full bg-primary-soft ring-1 ring-primary-border flex items-center justify-center text-[11px] font-bold text-primary shrink-0 transition-all duration-200 group-hover/profile:ring-2 group-hover/profile:ring-primary-border">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cc truncate group-hover/profile:text-accent transition-colors">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-cc-muted capitalize">{user?.roles?.[0] || "member"}</p>
                </div>
              </button>
              <button
                onClick={logout}
                className="shrink-0 p-2 rounded-xl text-cc-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Log out"
              >
                <IconLogout size={24} />
              </button>
            </div>
          ) : (
            /* Rail: avatar only */
            <>
              <button
                onClick={() => navigate("/profile")}
                title={user?.name || "Profile"}
                className="w-9 h-9 rounded-full bg-primary-soft ring-1 ring-primary-border flex items-center justify-center text-[11px] font-bold text-primary hover:ring-2 hover:ring-primary-border transition-all duration-200"
              >
                {userInitials}
              </button>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl text-cc-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <IconLogout size={24} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          SIDEBAR — mobile (off-canvas drawer)
      ══════════════════════════════════════════════ */}
      <aside
        className={`cc-sidebar--mobile flex flex-col lg:hidden ${mobileOpen ? "cc-sidebar--mobile-open" : ""}`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--cc-color-sidebar-border)] shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <img src="/depstar-logo.jpeg" alt="DEPSTAR" className="w-full h-full object-contain p-0.5 bg-white" />
          </div>
          <span className="font-semibold text-sm text-cc tracking-tight">CampusConnect</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV.map(({ section, items }) => (
            <NavSection
              key={section}
              section={section}
              items={items}
              pathname={location.pathname}
              onNavigate={onNavigate}
              collapsed={false}
            />
          ))}
          {adminNav.length > 0 && (
            <NavSection
              section="Administration"
              items={adminNav}
              pathname={location.pathname}
              onNavigate={onNavigate}
              collapsed={false}
            />
          )}
        </nav>

        {/* User panel */}
        <div className="px-3 pb-4 pt-3 border-t border-[var(--cc-color-sidebar-border)] shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("/profile")}
              className="flex-1 flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-hover transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-primary-soft ring-1 ring-primary-border flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cc truncate">{user?.name}</p>
                <p className="text-[10px] text-cc-muted capitalize">{user?.roles?.[0] || "member"}</p>
              </div>
            </button>
            <button
              onClick={logout}
              className="shrink-0 p-2 rounded-xl text-cc-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Log out"
            >
              <IconLogout size={24} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT COLUMN
      ══════════════════════════════════════════════ */}
      <div className="cc-main">

        {/* ── Topbar ── */}
        <header className="cc-topbar">
          {/* Hamburger — only for tablet (sm-lg), mobile uses BottomNav */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="hidden sm:flex lg:hidden text-cc-muted hover:text-cc transition-colors p-1 -ml-1"
              aria-label="Open menu"
            >
              <IconMenu size={24} />
            </button>
          </div>

          {/* Right: utilities */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen((o) => !o)}
                className="relative p-2 rounded-xl hover:bg-surface-hover transition-all duration-150 text-cc-muted hover:text-cc hover:scale-105 active:scale-95"
                title="Notifications"
                aria-label="Notifications"
              >
                <IconBell size={24} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-amber-500 text-[9px] text-black font-bold flex items-center justify-center animate-pop-in">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-cc-soft bg-cc-surface shadow-xl overflow-hidden z-50 animate-fade-scale">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-cc-soft">
                    <div>
                      <p className="text-sm font-semibold text-cc">Notifications</p>
                      <p className="text-[11px] text-cc-muted">Attendance and moderation updates</p>
                    </div>
                    <button
                      disabled={markAllProcessing}
                      onClick={handleMarkAllRead}
                      className="text-xs text-accent hover:text-brand transition-colors disabled:opacity-50 font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationLoading ? (
                      <div className="px-4 py-6 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="cc-skeleton h-12 rounded-xl" />
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <span className="text-2xl mb-2 block">🔔</span>
                        <p className="text-sm text-cc-muted">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          onClick={() => handleMarkRead(n._id)}
                          disabled={notificationProcessingId === n._id}
                          className={`w-full text-left px-4 py-3 border-b border-cc-soft/60 hover:bg-surface-hover transition-colors ${
                            n.status === "read" || n.readAt ? "opacity-60" : "bg-cc-surface-weak"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-cc">{n.title}</p>
                              <p className="text-xs text-cc-muted mt-0.5">{n.message}</p>
                            </div>
                            {n.status !== "read" && !n.readAt && (
                              <span className="mt-1 h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <span className="w-px h-5 bg-cc-border-soft mx-1" aria-hidden="true" />

            <ThemeToggle />
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="cc-scroll-area" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <BottomNav />
    </div>
  );
}
