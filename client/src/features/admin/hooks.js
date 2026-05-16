/**
 * features/admin/hooks.js
 * Reusable hooks for admin data fetching and state management.
 */
import { useState, useEffect, useCallback } from "react";
import { listAllClubs, fetchClubMembers, fetchPlatformStats } from "./api";

// ── Paginated club list ──────────────────────────────────────────────────────

/**
 * Fetches a paginated list of all clubs on the platform.
 * @returns {{ clubs, meta, loading, fetchClubs }}
 */
export const useAdminClubs = () => {
  const [clubs,   setClubs]   = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);

  const fetchClubs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await listAllClubs(page, 20);
      setClubs(res.data.data || []);
      setMeta(res.data.meta || { total: 0, page: 1, limit: 20 });
    } catch (err) {
      console.error("Admin: failed to load clubs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClubs(1); }, [fetchClubs]);

  return { clubs, setClubs, meta, setMeta, loading, fetchClubs };
};

// ── Pending member counts (lazy — only loaded when "pending" tab is active) ──

/**
 * Fetches pending member counts for all clubs.
 * Only triggers when `active` is true (i.e., the pending tab is open).
 *
 * @param {array}   clubs  - Full club list from useAdminClubs
 * @param {boolean} active - Whether the pending tab is currently shown
 * @returns {{ pendingMap, pendingLoading }}
 */
export const useAdminPendingCounts = (clubs, active) => {
  const [pendingMap,     setPendingMap]     = useState({});
  const [pendingLoading, setPendingLoading] = useState(false);

  useEffect(() => {
    if (!active || clubs.length === 0) return;

    setPendingLoading(true);
    const load = async () => {
      const results = await Promise.allSettled(
        clubs.map((c) =>
          fetchClubMembers(c._id).then((r) => ({
            id:      c._id,
            count:   (r.data.data || []).filter((m) => m.status === "pending").length,
            members: r.data.data || [],
          }))
        )
      );
      const map = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") map[r.value.id] = r.value;
      });
      setPendingMap(map);
      setPendingLoading(false);
    };
    load();
  }, [clubs, active]);

  return { pendingMap, pendingLoading };
};

// ── Platform stats ───────────────────────────────────────────────────────────

/**
 * Fetches all data needed for the AdminStats analytics page.
 * @returns {{ data, loading }}
 *   data = { clubs, events, extTotal, extVerif, chats, bookmarks }
 */
export const useAdminStats = (canView) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canView) return;

    const load = async () => {
      const [clubsRes, eventsRes, extAllRes, extVerifiedRes, chatsRes, bkRes] =
        await fetchPlatformStats();

      setData({
        clubs:     clubsRes.status    === "fulfilled" ? clubsRes.value.data.data    || [] : [],
        events:    eventsRes.status   === "fulfilled" ? eventsRes.value.data.data   || [] : [],
        extTotal:  extAllRes.status      === "fulfilled" ? extAllRes.value.data.meta?.total      || 0 : 0,
        extVerif:  extVerifiedRes.status === "fulfilled" ? extVerifiedRes.value.data.meta?.total  || 0 : 0,
        chats:     chatsRes.status    === "fulfilled" ? chatsRes.value.data.data    || [] : [],
        bookmarks: bkRes.status       === "fulfilled" ? bkRes.value.data.data       || [] : [],
      });
      setLoading(false);
    };
    load();
  }, [canView]);

  return { data, loading };
};
