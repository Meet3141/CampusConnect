import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket;

export const connectChatSocket = () => {
  if (socket?.connected) {
    return socket;
  }

  const token = localStorage.getItem("token");
  socket = io(SOCKET_URL, {
    autoConnect: true,
    auth: { token },
    transports: ["websocket"],
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
