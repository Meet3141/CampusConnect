/**
 * features/volunteers/hooks.js
 * Reusable hooks for volunteer data fetching and state management.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchVolunteerFeed } from "./api";

/**
 * Fetches the volunteer feed (events with open volunteer slots).
 * Auto-polls every 10 s and on tab re-focus to keep the page current.
 *
 * @returns {{ events, setEvents, loading, refetch }}
 */
export const useVolunteerFeed = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetchVolunteerFeed();
      setEvents(res.data.data || []);
    } catch (err) {
      console.error("Volunteer feed error:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // Auto-refresh: poll every 10 s + on tab visibility/focus
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFeed(false);
    }, 10000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchFeed(false);
      }
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchFeed]);

  return { events, setEvents, loading, refetch: fetchFeed };
};
