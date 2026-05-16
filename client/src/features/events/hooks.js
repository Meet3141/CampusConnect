/**
 * features/events/hooks.js
 * Reusable hooks for event data fetching and state management.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  listEvents,
  fetchEventById,
  fetchEventAttendees,
  listBookmarks,
  listExternalEvents,
} from "./api";

// ── My-club events (used by Events page) ────────────────────────────────────
import api from "../../services/api";

/**
 * Fetches events from all clubs the current user belongs to.
 * Returns deduplicated, sorted events along with the user's clubs.
 */
export const useMyClubEvents = () => {
  const [myClubs, setMyClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const clubsRes = await api.get("/clubs/mine");
        const clubs = (clubsRes.data.data || []).filter(
          (c) =>
            c.myStatus === "approved" ||
            c.myStatus === "active" ||
            c.myStatus === "admin"
        );
        setMyClubs(clubs);

        if (clubs.length === 0) {
          setLoading(false);
          return;
        }

        const results = await Promise.allSettled(
          clubs.map((c) =>
            listEvents({ clubId: c._id, limit: 50 }).then((r) =>
              (r.data.data || []).map((ev) => ({
                ...ev,
                _clubName: c.name,
                _clubCategory: c.category,
              }))
            )
          )
        );

        const all = results
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value);

        // Deduplicate by _id
        const seen = new Set();
        const deduped = all.filter((ev) => {
          if (seen.has(ev._id)) return false;
          seen.add(ev._id);
          return true;
        });

        // Sort: upcoming first, then by date ascending
        deduped.sort((a, b) => {
          const order = {
            upcoming: 0,
            ongoing: 1,
            completed: 2,
            cancelled: 3,
            draft: 4,
            pending_approval: 5,
          };
          if (order[a.status] !== order[b.status])
            return (order[a.status] ?? 9) - (order[b.status] ?? 9);
          return new Date(a.date) - new Date(b.date);
        });

        setEvents(deduped);
      } catch (err) {
        console.error("Events load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { myClubs, events, loading };
};

// ── Single event detail with attendees + bookmark ───────────────────────────

/**
 * Fetches a single event, its attendees, and the user's bookmark status.
 * @param {string} eventId
 * @param {object|null} user  – the logged-in user (from AuthContext)
 */
export const useEventDetail = (eventId, user) => {
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarkId, setBookmarkId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const evRes = await fetchEventById(eventId);
        setEvent(evRes.data.data);

        if (user) {
          const [attRes, bkRes] = await Promise.allSettled([
            fetchEventAttendees(eventId),
            listBookmarks(),
          ]);
          if (attRes.status === "fulfilled")
            setAttendees(attRes.value.data.data || []);
          if (bkRes.status === "fulfilled") {
            const mine = (bkRes.value.data.data || []).find(
              (b) => String(b.eventId) === eventId && b.eventType === "internal"
            );
            if (mine) setBookmarkId(mine._id);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load event.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, user]);

  return { event, setEvent, attendees, setAttendees, loading, error, bookmarkId, setBookmarkId };
};

// ── External events list ────────────────────────────────────────────────────

export const useExternalEvents = ({ page = 1, limit = 12, category = "", universityName = "" } = {}) => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit, verified: "true" };
        if (category) params.category = category;
        if (universityName) params.universityName = universityName;
        const res = await listExternalEvents(params);
        setEvents(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, limit, category, universityName]);

  return { events, total, loading };
};
