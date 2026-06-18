/**
 * features/events/api.js
 * Encapsulates all event-related API calls.
 * Keeps the axios instance in services/api (shared infra).
 */
import api from "../../services/api";

// ── Internal Events ─────────────────────────────────────────────────────────

export const listEvents = (params = {}) =>
  api.get("/events", { params });

export const fetchEventById = (eventId) =>
  api.get(`/events/${eventId}`);

export const fetchEventAnalytics = (eventId) =>
  api.get(`/events/${eventId}/analytics`);

export const createEvent = (payload) =>
  api.post("/events", payload);

export const updateEvent = (eventId, payload) =>
  api.put(`/events/${eventId}`, payload);

export const deleteEvent = (eventId) =>
  api.delete(`/events/${eventId}`);

export const startEvent = (eventId) =>
  api.post(`/events/${eventId}/start`);

export const restartEvent = (eventId) =>
  api.post(`/events/${eventId}/restart`);

export const endEvent = (eventId) =>
  api.post(`/events/${eventId}/end`);

export const fetchEventAttendees = (eventId) =>
  api.get(`/events/${eventId}/attendees`);

export const rsvpEvent = (eventId) =>
  api.post(`/events/${eventId}/rsvp`);

export const submitGraceRequest = (eventId, reason) =>
  api.post(`/events/${eventId}/grace-request`, { reason });

export const reviewAttendanceIssue = (id, studentId, action, reason = "") => api.post(`/events/${id}/review/${studentId}`, { action, reason });

export const amendAttendance = (id, attendeeIds) => api.post(`/events/${id}/attendance-correction`, { attendeeIds });
export const requestAttendanceCorrection = (id, reason) => api.post(`/events/${id}/attendance-correction/request`, { reason });
export const reviewCorrectionRequest = (id, requestId, action, reason = "") => api.post(`/events/${id}/attendance-correction/request/${requestId}/review`, { action, reason });
export const getCorrectionRequest = (id) => api.get(`/events/${id}/attendance-correction/request`);

export const cancelRsvp = (eventId) =>
  api.post(`/events/${eventId}/cancel-rsvp`);

// ── Volunteers ──────────────────────────────────────────────────────────────

export const volunteerForEvent = (eventId) =>
  api.post(`/events/${eventId}/volunteer`);

export const reviewVolunteer = (eventId, userId, action) =>
  api.patch(`/events/${eventId}/volunteer/${userId}/review`, { action });

export const removeVolunteer = (eventId, userId) =>
  api.delete(`/events/${eventId}/volunteer/${userId}`);

// ── External Events ─────────────────────────────────────────────────────────

export const listExternalEvents = (params = {}) =>
  api.get("/external-events", { params });

export const fetchExternalEventById = (eventId) =>
  api.get(`/external-events/${eventId}`);

export const createExternalEvent = (payload) =>
  api.post("/external-events", payload);

export const extractExternalEventOcr = (imageUrl) =>
  api.post("/external-events/ocr/extract", { imageUrl });

// ── Bookmarks (event-related) ───────────────────────────────────────────────

export const listBookmarks = () =>
  api.get("/bookmarks");

export const createBookmark = (eventId, eventType) =>
  api.post("/bookmarks", { eventId, eventType });

export const deleteBookmark = (bookmarkId) =>
  api.delete(`/bookmarks/${bookmarkId}`);
