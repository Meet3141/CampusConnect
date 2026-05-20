/**
 * features/admin/api.js
 * Encapsulates all admin-related API calls.
 * Keeps the axios instance in services/api (shared infra).
 */
import api from "../../services/api";

// ── Club Management ──────────────────────────────────────────────────────────

/** GET /clubs?page=&limit= — paginated list of all clubs */
export const listAllClubs = (page = 1, limit = 20) =>
  api.get("/clubs", { params: { page, limit } });

/** GET /clubs/:id/members — all members of a club */
export const fetchClubMembers = (clubId) =>
  api.get(`/clubs/${clubId}/members`);

/** DELETE /clubs/:id — permanently delete a club (orgAdmin only) */
export const deleteClub = (clubId) =>
  api.delete(`/clubs/${clubId}`);

// ── External Event Verification ──────────────────────────────────────────────

/** GET /external-events?verified=false — events pending review */
export const fetchUnverifiedEvents = (page = 1, limit = 15) =>
  api.get("/external-events", { params: { verified: "false", page, limit } });

/** GET /external-events?verified=true — already verified events */
export const fetchVerifiedEvents = (page = 1, limit = 15) =>
  api.get("/external-events", { params: { verified: "true", page, limit } });

/** PATCH /external-events/:id/verify — approve an external event */
export const verifyExternalEvent = (eventId) =>
  api.patch(`/external-events/${eventId}/verify`);

// ── Platform Stats (AdminStats page) ────────────────────────────────────────

/**
 * Fetches all data needed for the platform analytics dashboard.
 * Returns a Promise.allSettled result array — callers handle individual failures.
 */
export const fetchPlatformStats = () =>
  Promise.allSettled([
    api.get("/clubs",           { params: { limit: 200 } }),
    api.get("/events",          { params: { limit: 200 } }),
    api.get("/external-events", { params: { limit: 1 } }),
    api.get("/external-events", { params: { limit: 1, verified: "true" } }),
    api.get("/chats"),
    api.get("/bookmarks"),
  ]);

/** GET /events/reviews — governance review dashboard */
export const fetchReviewDashboard = () =>
  api.get("/events/reviews");

/** GET /notifications — current user's notifications */
export const fetchNotifications = (limit = 8) =>
  api.get("/notifications", { params: { limit } });

/** PATCH /notifications/:id/read — mark a notification as read */
export const markNotificationRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}/read`);

/** PATCH /notifications/read-all — mark all current user's notifications as read */
export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all");
