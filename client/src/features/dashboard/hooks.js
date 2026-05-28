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
import { listEvents, listExternalEvents } from "../events/api";

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
  const [ongoingEvents, setOngoingEvents] = useState([]);
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
          // Avoid firing many parallel requests (trips server rate limits).
          // Fetch club events sequentially to reduce burst traffic.
          const collected = [];
          for (const club of userClubs) {
            try {
              const res = await fetchClubEvents(club._id, 50);
              collected.push(...(res.data.data || []));
            } catch (err) {
              // Log but continue — don't fail the whole dashboard
              console.warn(`Dashboard: failed to fetch events for club ${club._id}:`, err?.message || err);
            }
          }
          allEvents = collected;
        } catch (err) {
          console.error("Dashboard: failed to fetch events:", err);
        }
      }

      // Upcoming only, capped at 5
      const now = new Date();
      const upcomingEvents = allEvents
        .filter((e) => e.status === "upcoming" && new Date(e.date) > now)
        .slice(0, 5);
      const liveEvents = allEvents
        .filter((e) => e.status === "ongoing")
        .slice(0, 5);
      setEvents(upcomingEvents);
      setOngoingEvents(liveEvents);

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
    return {
      activeClubs,
      pendingClubs,
      events: events.length,
      ongoingEvents: ongoingEvents.length,
      unreadChats,
      totalBk,
      internalBk,
      externalBk,
    };
  }, [myClubs, events, ongoingEvents, chats, bookmarks]);

  return { myClubs, events, ongoingEvents, chats, bookmarks, loading, stats };
};

const toStartOfMonth = (base) =>
  new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);

const toEndOfMonth = (base) =>
  new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);

const parseDateValue = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toTimestamp = (value) => {
  const d = parseDateValue(value);
  return d ? d.getTime() : null;
};

const normalizeInternalEvent = (ev) => ({
  id: ev._id,
  title: ev.title || "Untitled event",
  date: ev.date,
  timestamp: toTimestamp(ev.date),
  category: ev.category || "meeting",
  organizerLabel: ev.clubId?.name || ev._clubName || "Club event",
  registeredCount: Number(ev.registeredCount ?? ev.rsvpCount ?? 0),
  source: "internal",
});

const normalizeExternalEvent = (ev) => ({
  id: ev._id,
  title: ev.title || "Untitled event",
  date: ev.date,
  timestamp: toTimestamp(ev.date),
  category: ev.category || "conference",
  organizerLabel: ev.universityName || "External host",
  registeredCount: 0,
  source: "external",
});

const withinRange = (ts, start, end) =>
  typeof ts === "number" && ts >= start.getTime() && ts <= end.getTime();

/**
 * Aggregates internal + external events for the current month.
 * Uses optional date filters on the API to keep payloads small.
 */
export const useMonthlyCalendarEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referenceDate] = useState(() => new Date());

  const monthStart = useMemo(() => toStartOfMonth(referenceDate), [referenceDate]);
  const monthEnd = useMemo(() => toEndOfMonth(referenceDate), [referenceDate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const fetchPaged = async (fetcher, params) => {
          const limit = 50;
          const maxPages = 10;
          const collected = [];
          let page = 1;
          let total = null;

          while (page <= maxPages) {
            const res = await fetcher({ ...params, page, limit });
            const data = res?.data?.data || [];
            const meta = res?.data?.meta || {};
            if (typeof meta.total === "number") total = meta.total;
            collected.push(...data);
            if (data.length < limit) break;
            if (total !== null && collected.length >= total) break;
            page += 1;
          }
          return collected;
        };

        const startIso = monthStart.toISOString();
        const endIso = monthEnd.toISOString();

        const [internalRes, externalRes] = await Promise.allSettled([
          fetchPaged(listEvents, { startDate: startIso, endDate: endIso, includeClub: "true" }),
          fetchPaged(listExternalEvents, { startDate: startIso, endDate: endIso, verified: "true" }),
        ]);

        const internalRaw = internalRes.status === "fulfilled" ? internalRes.value : [];
        const externalRaw = externalRes.status === "fulfilled" ? externalRes.value : [];

        const normalized = [
          ...internalRaw.map(normalizeInternalEvent),
          ...externalRaw.map(normalizeExternalEvent),
        ].filter((ev) => withinRange(ev.timestamp, monthStart, monthEnd));

        setEvents(normalized);
      } catch (err) {
        console.error("Calendar: failed to load events:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [monthStart, monthEnd]);

  return { events, loading, monthStart, monthEnd, referenceDate };
};
