/**
 * features/volunteers/api.js
 * Encapsulates all volunteer-related API calls.
 * Keeps the axios instance in services/api (shared infra).
 */
import api from "../../services/api";

/** GET /events/volunteer-feed — open volunteer events (public) */
export const fetchVolunteerFeed = () =>
  api.get("/events/volunteer-feed");

/** POST /events/:id/volunteer — apply as volunteer (pending) */
export const applyToVolunteer = (eventId, skills = []) =>
  api.post(`/events/${eventId}/volunteer`, { skills });

/** DELETE /events/:id/volunteer/:userId — withdraw own application */
export const withdrawVolunteerApplication = (eventId, userId) =>
  api.delete(`/events/${eventId}/volunteer/${userId}`);
