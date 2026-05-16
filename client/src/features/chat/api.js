/**
 * features/chat/api.js
 * Encapsulates all chat & message-related API calls.
 * Keeps the axios instance in services/api (shared infra).
 */
import api from "../../services/api";

// ── Chats ───────────────────────────────────────────────────────────────────

/** GET /chats — list user's chats */
export const listChats = () =>
  api.get("/chats");

/** GET /chats/:id — single chat details */
export const fetchChatById = (chatId) =>
  api.get(`/chats/${chatId}`);

/** POST /chats — create a new chat */
export const createChat = (payload) =>
  api.post("/chats", payload);

/** POST /chats/:id/join */
export const joinChat = (chatId) =>
  api.post(`/chats/${chatId}/join`);

/** POST /chats/:id/leave */
export const leaveChat = (chatId) =>
  api.post(`/chats/${chatId}/leave`);

// ── Messages ────────────────────────────────────────────────────────────────

/** GET /messages/chat/:chatId — fetch messages for a chat */
export const fetchMessages = (chatId, params = {}) =>
  api.get(`/messages/chat/${chatId}`, { params });

/** POST /messages/chat/:chatId — send a new message */
export const sendMessage = (chatId, message) =>
  api.post(`/messages/chat/${chatId}`, { message });

/** PUT /messages/:id — edit a message */
export const editMessage = (messageId, message) =>
  api.put(`/messages/${messageId}`, { message });

/** DELETE /messages/:id — delete a message */
export const deleteMessage = (messageId) =>
  api.delete(`/messages/${messageId}`);

/** POST /messages/:id/reactions — react to a message */
export const reactToMessage = (messageId, emoji) =>
  api.post(`/messages/${messageId}/reactions`, { emoji });
