/**
 * features/dashboard/api.js
 * Encapsulates all dashboard-related API calls.
 * Keeps the axios instance in services/api (shared infra).
 */
import api from "../../services/api";

/** GET /clubs/mine — clubs the current user belongs to */
export const fetchMyClubs = () =>
  api.get("/clubs/mine");

/** GET /events?clubId=&limit= — events for a specific club */
export const fetchClubEvents = (clubId, limit = 50) =>
  api.get("/events", { params: { clubId, limit } });

/** GET /chats — chats the current user is in */
export const fetchDashboardChats = () =>
  api.get("/chats");

/** GET /bookmarks — bookmarks saved by the current user */
export const fetchDashboardBookmarks = () =>
  api.get("/bookmarks");
