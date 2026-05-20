/**
 * AppLayout.jsx
 * Shared layout wrapper for all authenticated pages.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { IconBell, IconLogout, IconMenu, IconSearch } from "./LayoutIcons";
import { NAV, getAdminNav } from "./navigationConfig";
import ThemeToggle from "../ui/ThemeToggle";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../features/admin/api";

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
        {items.map(({ label, path, icon }) => {
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
                {icon({ size: 15, active })}
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
  const [topSearch, setTopSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationProcessingId, setNotificationProcessingId] = useState("");
  const [markAllProcessing, setMarkAllProcessing] = useState(false);
  const notificationsRef = useRef(null);

  const isAdmin = user?.roles?.includes("orgAdmin");
  const isEditor = user?.roles?.includes("editor");
  const isClubAdmin = user?.roles?.includes("clubAdmin");
  const adminNav = getAdminNav({ isAdmin, isEditor, isClubAdmin });

  const userInitials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => notification.status !== "read" && !notification.readAt),
    [notifications]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
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

    loadNotifications();
  }, [user]);

  const onNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
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

  const handleMarkRead = async (notificationId) => {
    try {
      setNotificationProcessingId(notificationId);
      await markNotificationRead(notificationId);
      await refreshNotifications();
    } finally {
      setNotificationProcessingId("");
    }
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
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-60 w-55 flex flex-col bg-cc-surface border-r border-cc-soft transition-transform duration-300 ${
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = topSearch.trim();
              if (q) navigate(`/clubs?q=${encodeURIComponent(q)}`);
              else navigate("/clubs");
            }}
            className="hidden sm:flex items-center gap-2"
          >
            <IconSearch size={14} />
            <input
              type="search"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Search clubs, events..."
              className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-slate-500 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/6 transition-all w-64"
            />
            <span className="text-[11px] px-1.5 py-px bg-white/6 rounded-md text-slate-600">/</span>
          </form>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative p-2 rounded-xl hover-bg-cc-surface transition-colors text-cc-muted hover:text-cc"
                title="Notifications"
              >
                <IconBell size={16} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-[10px] text-black font-bold flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-[320px] rounded-2xl border border-cc-soft bg-cc-surface shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-cc-soft">
                    <div>
                      <p className="text-sm font-semibold text-cc">Notifications</p>
                      <p className="text-[11px] text-cc-muted">Attendance and moderation updates</p>
                    </div>
                    <button disabled={markAllProcessing} onClick={handleMarkAllRead} className="text-xs text-indigo-300 hover:text-indigo-200 disabled:opacity-50">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationLoading ? (
                      <div className="px-4 py-6 text-sm text-cc-muted">Loading…</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-cc-muted">No notifications yet.</div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification._id}
                          onClick={() => handleMarkRead(notification._id)}
                          disabled={notificationProcessingId === notification._id}
                          className={`w-full text-left px-4 py-3 border-b border-cc-soft/60 hover-bg-cc-surface transition-colors ${
                            notification.status === "read" || notification.readAt ? "opacity-70" : "bg-cc-surface-weak"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-cc">{notification.title}</p>
                              <p className="text-xs text-cc-muted mt-1">{notification.message}</p>
                            </div>
                            {notification.status !== "read" && !notification.readAt && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
