import api from "./api";

export const chatApi = {
  getMyChats: async () => {
    const response = await api.get("/chats");
    return response.data;
  },

  getChatById: async (chatId) => {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  createChat: async (payload) => {
    const response = await api.post("/chats", payload);
    return response.data;
  },

  joinChat: async (chatId) => {
    const response = await api.post(`/chats/${chatId}/join`);
    return response.data;
  },

  leaveChat: async (chatId) => {
    const response = await api.post(`/chats/${chatId}/leave`);
    return response.data;
  },

  getMessages: async (chatId, params = {}) => {
    const response = await api.get(`/messages/chat/${chatId}`, { params });
    return response.data;
  },

  sendMessage: async (chatId, payload) => {
    const response = await api.post(`/messages/chat/${chatId}`, payload);
    return response.data;
  },

  editMessage: async (messageId, payload) => {
    const response = await api.put(`/messages/${messageId}`, payload);
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  reactToMessage: async (messageId, emoji) => {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },
};

export default chatApi;
