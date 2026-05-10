import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || "http://localhost:5000").replace(/\/$/, "");

let socket;

export const connectChatSocket = () => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  return socket;
};

export const getChatSocket = () => socket;

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
};

export const joinChatRoom = (chatId) => {
  if (!socket) return;
  socket.emit("chat:join", chatId);
};

export const leaveChatRoom = (chatId) => {
  if (!socket) return;
  socket.emit("chat:leave", chatId);
};

export const onChatEvent = (eventName, handler) => {
  if (!socket) return () => {};
  socket.on(eventName, handler);
  return () => socket.off(eventName, handler);
};
