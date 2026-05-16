import api from "../../services/api";

export const listClubs = ({ page = 1, limit = 20, q, category } = {}) => {
  const params = { page, limit };
  if (q) params.q = q;
  if (category) params.category = category;
  return api.get("/clubs", { params });
};

export const listMyClubs = () => api.get("/clubs/mine");

export const fetchClubById = (clubId) => api.get(`/clubs/${clubId}`);

export const fetchClubMembers = (clubId) => api.get(`/clubs/${clubId}/members`);

export const fetchClubEvents = (clubId, limit = 50) =>
  api.get("/events", { params: { clubId, limit } });

export const createClub = (payload) => api.post("/clubs", payload);

export const updateClub = (clubId, payload) => api.put(`/clubs/${clubId}`, payload);

export const deleteClub = (clubId) => api.delete(`/clubs/${clubId}`);

export const joinClub = (clubId) => api.post(`/clubs/${clubId}/join`);

export const leaveClub = (clubId) => api.post(`/clubs/${clubId}/leave`);

export const approveMember = (clubId, memberId) =>
  api.post(`/clubs/${clubId}/approve-member`, { memberId });

export const rejectMember = (clubId, memberId) =>
  api.post(`/clubs/${clubId}/reject-member`, { memberId });

export const assignCoordinator = (clubId, memberId, coordinatorCategory) =>
  api.post(`/clubs/${clubId}/coordinator/assign`, {
    memberId,
    coordinatorCategory,
  });

export const removeCoordinator = (clubId, userId) =>
  api.delete(`/clubs/${clubId}/coordinator/${userId}`);

export const fetchAnnouncements = (clubId) => api.get(`/clubs/${clubId}/announcements`);

export const createAnnouncement = (clubId, payload) =>
  api.post(`/clubs/${clubId}/announcements`, payload);

export const deleteAnnouncement = (clubId, announcementId) =>
  api.delete(`/clubs/${clubId}/announcements/${announcementId}`);

export const publishEvent = (eventId) => api.post(`/events/${eventId}/publish`);

export const createClubChat = (clubId, name) =>
  api.post("/chats", { type: "club", referenceId: clubId, name });

export const joinChat = (chatId) => api.post(`/chats/${chatId}/join`);