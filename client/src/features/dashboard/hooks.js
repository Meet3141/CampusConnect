/**
 * features/dashboard/hooks.js
 * Reusable hooks for dashboard data fetching and state management.
 */
import { useState, useEffect, useMemo } from "react";
import {
  fetchMyClubs,
  fetchClubEvents,
  fetchDashboardChats,
  fetchDashboardBookmarks,
} from "./api";

/**
 * Fetches all dashboard data in a safe, sequential-then-parallel strategy:
 *   1. Fetch user's clubs
 *   2. In parallel: fetch events for each club, chats, bookmarks
 *
 * @param {object|null} user - The logged-in user from AuthContext
 * @returns {{ myClubs, events, chats, bookmarks, loading, stats }}
 */
export const useDashboardData = (user) => {
  const [myClubs,   setMyClubs]   = useState([]);
  const [events,    setEvents]    = useState([]);
  const [chats,     setChats]     = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const load = async () => {
      setLoading(true);

      // 1 — fetch the user's clubs first
      let userClubs = [];
      try {
        const res = await fetchMyClubs();
        userClubs = (res.data.data || []).filter(
          (c) => c.myStatus === "active" || c.myStatus === "admin" || c.myStatus === "approved"
        );
        setMyClubs(userClubs);
      } catch (err) {
        console.error("Dashboard: failed to fetch clubs:", err);
      }

      // 2 — fetch events for each club (parallel)
      let allEvents = [];
      if (userClubs.length > 0) {
        try {
          const results = await Promise.allSettled(
            userClubs.map((c) => fetchClubEvents(c._id, 50))
          );
          allEvents = results
            .filter((r) => r.status === "fulfilled")
            .flatMap((r) => r.value.data.data || []);
        } catch (err) {
          console.error("Dashboard: failed to fetch events:", err);
        }
      }

      // Upcoming only, capped at 5
      const now = new Date();
      setEvents(allEvents.filter((e) => new Date(e.date) > now).slice(0, 5));

      // 3 — fetch chats + bookmarks in parallel
      const [chatsRes, bookmarksRes] = await Promise.allSettled([
        fetchDashboardChats(),
        fetchDashboardBookmarks(),
      ]);

      if (chatsRes.status === "fulfilled") {
        setChats(chatsRes.value.data.data || []);
      } else {
        console.error("Dashboard: failed to fetch chats:", chatsRes.reason);
      }

      if (bookmarksRes.status === "fulfilled") {
        setBookmarks(bookmarksRes.value.data.data || []);
      } else {
        console.error("Dashboard: failed to fetch bookmarks:", bookmarksRes.reason);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  /** Derived stats — memoised to avoid recalculation on every render */
  const stats = useMemo(() => {
    const activeClubs  = myClubs.filter((c) => c.myStatus === "active" || c.myStatus === "admin").length;
    const pendingClubs = myClubs.filter((c) => c.myStatus === "pending").length;
    const unreadChats  = chats.filter((c) => c.lastMessage).length;
    const totalBk      = bookmarks.length;
    const internalBk   = bookmarks.filter((b) => b.eventType === "internal").length;
    const externalBk   = totalBk - internalBk;
    return { activeClubs, pendingClubs, events: events.length, unreadChats, totalBk, internalBk, externalBk };
  }, [myClubs, events, chats, bookmarks]);

  return { myClubs, events, chats, bookmarks, loading, stats };
};
