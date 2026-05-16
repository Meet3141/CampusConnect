/**
 * features/chat/hooks.js
 * Reusable hooks for chat data fetching.
 */
import { useState, useEffect, useCallback } from "react";
import { listChats, fetchChatById, fetchMessages } from "./api";

// ── Chat list ───────────────────────────────────────────────────────────────

/**
 * Fetches all chats the current user participates in.
 * @returns {{ chats, loading }}
 */
export const useChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listChats();
        setChats(res.data.data || []);
      } catch (err) {
        console.error("Failed to load chats:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { chats, loading };
};

// ── Single chat room with messages ──────────────────────────────────────────

/**
 * Fetches a chat and its messages.
 * @param {string} chatId
 * @returns {{ chat, messages, setMessages, loading }}
 */
export const useChatRoom = (chatId) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [chatRes, msgRes] = await Promise.allSettled([
          fetchChatById(chatId),
          fetchMessages(chatId, { limit: 100 }),
        ]);

        setChat(chatRes.status === "fulfilled" ? chatRes.value.data.data : null);
        setMessages(msgRes.status === "fulfilled" ? msgRes.value.data.data || [] : []);
      } catch (err) {
        console.error("Failed to load chat:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chatId]);

  return { chat, messages, setMessages, loading };
};
