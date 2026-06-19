/**
 * AppLayout.jsx
 * Shared layout wrapper for all authenticated pages.
 *
 * Sidebar behaviour:
 *   Desktop (≥1024px):
 *     - Detached floating pill, 16px from edges
 *     - 72px collapsed (icons only), 250px on hover
 *     - Glassmorphism background with blur
 *     - Overlaps content — no layout shift
 *   Mobile/Tablet (<1024px):
 *     - Hidden by default, hamburger button top-left
 *     - Slides in from left as modal drawer (280px)
 *     - Swipe from left edge to open, swipe left to close
 *     - BottomNav preserved on phones (<768px)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/* ─── Nav item (unified — works both collapsed & expanded via CSS) ─── */
function NavItem({ label, path, icon, pathname, onNavigate }) {
  const active = isActivePath(pathname, path);

  return (
    <li>
      <button
        onClick={() => onNavigate(path)}
        title={label}
        aria-label={label}
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
        <span className="shrink-0 flex items-center justify-center w-5 h-5">
          {icon({ size: 18, active })}
        </span>
        <span className="sidebar-text-label flex-1 text-left leading-none">
          {label}
        </span>
      </button>
    </li>
  );
}

/* ─── Nav section ─── */
function NavSection({ section, items, pathname, onNavigate }) {
  return (
    <div className="cc-sidebar-group">
      <p
        className="sidebar-text-label text-[11px] uppercase tracking-widest font-semibold px-3 mb-1.5"
        style={{ color: 'var(--cc-color-text-secondary)' }}
      >
        {section}
      </p>
      <ul className="space-y-0.5">
        {items.map(({ label, path, icon }) => (
          <NavItem
            key={path}
            label={label}
            path={path}
            icon={icon}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

/* ─── Main layout ─── */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationProcessingId, setNotificationProcessingId] = useState("");
  const [markAllProcessing, setMarkAllProcessing] = useState(false);
  const notificationsRef = useRef(null);

  /* Swipe gesture refs */
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchActiveRef = useRef(false);

  const isAdmin = user?.roles?.includes("orgAdmin");
  const isEditor = user?.roles?.includes("editor");
  const isClubAdmin = user?.roles?.includes("clubAdmin");
  const adminNav = getAdminNav({ isAdmin, isEditor, isClubAdmin });

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

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

  /* ─── Swipe gesture handlers ─── */
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    // Only activate swipe if starting from left edge (to open) or menu is open (to close)
    touchActiveRef.current = touch.clientX < 50 || mobileOpen;
  }, [mobileOpen]);

  const handleTouchMove = useCallback((e) => {
    // Intentionally empty — we process in touchEnd
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchActiveRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only process horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX > 50 && touchStartRef.current.x < 50) {
      // Swipe right from left edge → open
      setMobileOpen(true);
    } else if (deltaX < -50 && mobileOpen) {
      // Swipe left → close
      setMobileOpen(false);
    }

    touchActiveRef.current = false;
  }, [mobileOpen]);

  return (
    <div
      className="cc-app-shell"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      {/* ── Hamburger button (mobile/tablet only) ── */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <IconMenu size={20} />
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="cc-sidebar-backdrop md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════════════
          UNIFIED SIDEBAR — Detached Mini-Drawer
      ══════════════════════════════════════════════ */}
      <aside
        className={`sidebar-detached overflow-x-hidden${mobileOpen ? " mobile-open" : ""}`}
        aria-label="Main navigation"
        onMouseEnter={() => window.innerWidth >= 768 && setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* ── Logo / wordmark ── */}
        <div
          className="flex items-center shrink-0 px-4 py-4"
          style={{ borderBottom: '1px solid var(--cc-sidebar-glass-border)' }}
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
            <img src="/depstar-logo.jpeg" alt="DEPSTAR" className="w-full h-full object-contain p-0.5 bg-white rounded-lg" />
          </div>
          <span className="sidebar-text-label font-semibold text-sm tracking-tight ml-3"
            style={{ color: 'var(--cc-color-text-primary)' }}
          >
            CampusConnect
          </span>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-2">
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

        {/* ── Sidebar footer ── */}
        <div
          className="shrink-0 py-3"
          style={{ borderTop: '1px solid var(--cc-sidebar-glass-border)' }}
        >

          {/* ── UTILITY ROW: Bell + Theme Toggle ──
               Expanded  → flex-row, left-aligned
               Collapsed → flex-col, centred          */}
          <div
            className={`flex items-center px-2 pb-1 ${
              isExpanded || mobileOpen
                ? 'flex-row gap-1'
                : 'flex-col gap-3'
            }`}
          >
            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen((o) => !o)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150"
                style={{ color: 'var(--cc-color-sidebar-text)' }}
                title="Notifications"
                aria-label="Notifications"
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--cc-color-sidebar-hover)';
                  e.currentTarget.style.color = 'var(--cc-color-text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--cc-color-sidebar-text)';
                }}
              >
                <span className="relative flex items-center justify-center">
                  <IconBell size={18} />
                  {unreadNotifications.length > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        backgroundColor: 'var(--cc-color-warning)',
                        color: 'var(--cc-color-on-brand)',
                      }}
                    >
                      {unreadNotifications.length}
                    </span>
                  )}
                </span>
              </button>

              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div
                  className="absolute left-full bottom-0 ml-2 w-80 rounded-2xl shadow-xl overflow-hidden z-50"
                  style={{
                    backgroundColor: 'var(--cc-color-surface)',
                    border: '1px solid var(--cc-color-border)',
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid var(--cc-color-border-subtle)' }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--cc-color-text-primary)' }}>Notifications</p>
                      <p className="text-[11px]" style={{ color: 'var(--cc-color-text-muted)' }}>Attendance and moderation updates</p>
                    </div>
                    <button
                      disabled={markAllProcessing}
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium transition-colors disabled:opacity-50"
                      style={{ color: 'var(--cc-color-accent)' }}
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
                        <p className="text-sm" style={{ color: 'var(--cc-color-text-muted)' }}>No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          onClick={() => handleMarkRead(n._id)}
                          disabled={notificationProcessingId === n._id}
                          className="w-full text-left px-4 py-3 transition-colors"
                          style={{
                            borderBottom: '1px solid var(--cc-color-border-subtle)',
                            backgroundColor: n.status === "read" || n.readAt ? 'transparent' : 'var(--cc-color-surface-weak)',
                            opacity: n.status === "read" || n.readAt ? 0.6 : 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--cc-color-surface-hover)'; }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              n.status === "read" || n.readAt ? 'transparent' : 'var(--cc-color-surface-weak)';
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--cc-color-text-primary)' }}>{n.title}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--cc-color-text-muted)' }}>{n.message}</p>
                            </div>
                            {n.status !== "read" && !n.readAt && (
                              <span
                                className="mt-1 h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: 'var(--cc-color-warning)' }}
                              />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-center shrink-0">
              <ThemeToggle />
            </div>
          </div>

          {/* ── USER ROW: Avatar + Info + Logout ──
               Expanded  → flex-row, space-between: [Avatar | Name+Role ···· Logout]
               Collapsed → Avatar centred, Info+Logout hidden              */}
          <div
            className={`flex items-center w-full px-2 pt-1 ${
              isExpanded || mobileOpen ? 'justify-between' : 'justify-center'
            }`}
          >
            {/* Avatar (always visible) */}
            <button
              onClick={() => onNavigate('/profile')}
              className="flex items-center gap-2.5 rounded-xl py-1.5 transition-colors min-w-0"
              style={{
                paddingLeft: isExpanded || mobileOpen ? '4px' : '0',
                flex: isExpanded || mobileOpen ? '1' : 'none',
              }}
              title={user?.name || 'Profile'}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--cc-color-sidebar-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  backgroundColor: 'var(--cc-color-primary-soft)',
                  color: 'var(--cc-color-brand)',
                  border: '1px solid var(--cc-color-primary-border)',
                }}
              >
                {userInitials}
              </div>
              {/* User info — hidden when collapsed */}
              {(isExpanded || mobileOpen) && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--cc-color-text-primary)' }}>
                    {user?.name}
                  </p>
                  <p className="text-[10px] capitalize" style={{ color: 'var(--cc-color-text-muted)' }}>
                    {user?.roles?.[0] || 'member'}
                  </p>
                </div>
              )}
            </button>

            {/* Logout — hidden when collapsed */}
            {(isExpanded || mobileOpen) && (
              <button
                onClick={logout}
                className="shrink-0 p-2 rounded-xl transition-all ml-1"
                style={{ color: 'var(--cc-color-text-muted)' }}
                title="Log out"
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--cc-color-danger)';
                  e.currentTarget.style.backgroundColor = 'var(--cc-color-danger-soft)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--cc-color-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <IconLogout size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT COLUMN
      ══════════════════════════════════════════════ */}
      <div className="cc-main">
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
