/**
 * ChatRoom.jsx
 * Real-time messaging view.
 *
 * API: GET /messages/chat/:chatId  → { success, data: Message[], meta }
 *      POST /messages/chat/:chatId → body: {message}
 *      PUT /messages/:id           → body: {message}
 *      DELETE /messages/:id
 *      POST /messages/:id/reactions → body: {emoji}
 *      GET /chats/:id              → { success, data: Chat }
 *
 * Socket.io: events message:new, message:updated, message:deleted, message:reacted
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  connectChatSocket,
  joinChatRoom,
  leaveChatRoom,
  onChatEvent,
} from "../services/chatSocket";
// D: Centralized socket — no more inline io() to avoid duplicate connections

export default function ChatRoom() {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [chat, setChat]           = useState(null);
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText]   = useState("");
  const [socketState, setSocketState] = useState("connected");

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── Fetch initial data ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [chatRes, msgRes] = await Promise.allSettled([
          api.get(`/chats/${chatId}`),
          api.get(`/messages/chat/${chatId}`, { params: { limit: 100 } }),
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

  /* ── Socket.io for real-time messages (D: uses shared socket service) ── */
  useEffect(() => {
    // Connect via shared service (reuses existing connection if already open)
    const socket = connectChatSocket();
    setSocketState(socket?.connected ? "connected" : "connecting");
    joinChatRoom(chatId);

    const handleConnect = () => setSocketState("connected");
    const handleDisconnect = () => setSocketState("disconnected");
    const handleConnectError = () => {
      setSocketState("error");
      toast.error("Chat connection failed. Retrying in the background.");
    };
    const handleReconnectAttempt = () => setSocketState("reconnecting");
    const handleReconnect = () => {
      setSocketState("connected");
      toast.success("Reconnected to chat.");
    };
    const handleReconnectFailed = () => {
      setSocketState("error");
      toast.error("Chat reconnection failed.");
    };

    socket?.on("connect", handleConnect);
    socket?.on("disconnect", handleDisconnect);
    socket?.on("connect_error", handleConnectError);
    socket?.io?.on("reconnect_attempt", handleReconnectAttempt);
    socket?.io?.on("reconnect", handleReconnect);
    socket?.io?.on("reconnect_failed", handleReconnectFailed);

    const offNew = onChatEvent("message:new", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 100);
    });

    const offUpdated = onChatEvent("message:updated", (msg) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    });

    const offDeleted = onChatEvent("message:deleted", ({ _id }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === _id ? { ...m, deleted: true, message: "This message was deleted" } : m
        )
      );
    });

    const offReacted = onChatEvent("message:reacted", (msg) => {
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    });

    return () => {
      // Unsubscribe handlers and leave room — do NOT disconnect the shared socket
      offNew();
      offUpdated();
      offDeleted();
      offReacted();
      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
      socket?.off("connect_error", handleConnectError);
      socket?.io?.off("reconnect_attempt", handleReconnectAttempt);
      socket?.io?.off("reconnect", handleReconnect);
      socket?.io?.off("reconnect_failed", handleReconnectFailed);
      leaveChatRoom(chatId);
    };
  }, [chatId, scrollToBottom]);

  /* Auto-scroll on initial load */
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(scrollToBottom, 200);
    }
  }, [loading, messages.length, scrollToBottom]);

  /* ── Send message ── */
  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.post(`/messages/chat/${chatId}`, { message: text });
      setInput("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  };

  /* ── Edit message ── */
  const handleEdit = async (msgId) => {
    const text = editText.trim();
    if (!text) return;
    try {
      await api.put(`/messages/${msgId}`, { message: text });
      setEditingId(null);
      setEditText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Edit failed.");
    }
  };

  /* ── Delete message ── */
  const handleDelete = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.delete(`/messages/${msgId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    }
  };

  /* ── React to message ── */
  const handleReact = async (msgId, emoji) => {
    try {
      await api.post(`/messages/${msgId}/reactions`, { emoji });
    } catch (err) {
      toast.error(err.response?.data?.message || "Reaction failed.");
    }
  };

  /* ── Leave chat ── */
  const handleLeaveChat = async () => {
    if (!window.confirm("Leave this chat? You can rejoin later.")) return;
    try {
      await api.post(`/chats/${chatId}/leave`);
      navigate("/chats");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave chat.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white">
      {socketState !== "connected" && (
        <div className="px-5 py-2 text-xs text-amber-200 bg-amber-950/40 border-b border-amber-500/20 flex items-center justify-between gap-3">
          <span>
            {socketState === "reconnecting"
              ? "Reconnecting to chat… messages will resume automatically."
              : socketState === "error"
                ? "Chat connection interrupted. Retrying in the background."
                : "Connecting to chat…"}
          </span>
          <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-200">
            {socketState}
          </span>
        </div>
      )}

      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-[#0d0d18]/80 backdrop-blur-md shrink-0">
        <button onClick={() => navigate("/chats")} className="text-slate-400 hover:text-white transition-colors">
          ← 
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-950 ring-1 ring-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0">
          {(chat?.name || "?")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{chat?.name || "Chat"}</p>
          <p className="text-[10px] text-slate-600">
            {chat?.participants?.length || 0} participant{chat?.participants?.length !== 1 ? "s" : ""}
            {chat?.type && <span> · {chat.type}</span>}
          </p>
        </div>
        <button onClick={handleLeaveChat}
          className="text-xs text-slate-600 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
          title="Leave chat">
          Leave
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = String(msg.senderId?._id || msg.senderId) === String(user?._id);
          const senderName = msg.senderId?.name || "Unknown";
          const initial = senderName[0]?.toUpperCase() || "?";
          const time = new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          const showAvatar = i === 0 || String((messages[i - 1]?.senderId?._id || messages[i - 1]?.senderId)) !== String(msg.senderId?._id || msg.senderId);

          return (
            <div key={msg._id} className={`flex gap-2.5 group ${isMe ? "flex-row-reverse" : ""}`}>
              {showAvatar ? (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-1 ${
                  isMe ? "bg-indigo-600 text-white" : "bg-white/[0.08] text-slate-300"
                }`}>
                  {initial}
                </div>
              ) : (
                <div className="w-7 shrink-0" />
              )}
              <div className={`max-w-[70%] ${isMe ? "text-right" : ""}`}>
                {showAvatar && (
                  <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "justify-end" : ""}`}>
                    <span className="text-[11px] font-medium text-slate-400">{isMe ? "You" : senderName}</span>
                    <span className="text-[10px] text-slate-600">{time}</span>
                  </div>
                )}
                {editingId === msg._id ? (
                  <div className="flex gap-2">
                    <input value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEdit(msg._id)}
                      className="flex-1 bg-white/[0.06] border border-indigo-500/40 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleEdit(msg._id)} className="text-xs text-indigo-400">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-slate-500">Cancel</button>
                  </div>
                ) : (
                  <div className={`inline-block px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.deleted
                      ? "bg-white/[0.03] text-slate-600 italic"
                      : isMe
                        ? "bg-indigo-600 text-white"
                        : "bg-white/[0.06] text-slate-200"
                  } ${showAvatar ? (isMe ? "rounded-tr-md" : "rounded-tl-md") : ""}`}>
                    {msg.message}
                    {msg.edited && !msg.deleted && (
                      <span className="text-[10px] opacity-50 ml-1">(edited)</span>
                    )}
                  </div>
                )}

                {/* Reactions */}
                {msg.reactions?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {groupReactions(msg.reactions, user?._id).map(({ emoji, count, hasMe }) => (
                      <button key={emoji}
                        onClick={() => handleReact(msg._id, emoji)}
                        className={`text-xs px-1.5 py-0.5 rounded-full border transition-all ${
                          hasMe
                            ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                            : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:border-white/[0.15]"
                        }`}>
                        {emoji} {count}
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {isMe && !msg.deleted && editingId !== msg._id && (
                  <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(msg._id); setEditText(msg.message); }}
                      className="text-[10px] text-slate-600 hover:text-slate-300">Edit</button>
                    <button onClick={() => handleDelete(msg._id)}
                      className="text-[10px] text-slate-600 hover:text-red-400">Delete</button>
                  </div>
                )}

                {/* Quick react */}
                {!msg.deleted && (
                  <div className="flex gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {["👍", "❤️", "😂", "🎉"].map((emoji) => (
                      <button key={emoji} onClick={() => handleReact(msg._id, emoji)}
                        className="text-xs hover:scale-125 transition-transform">{emoji}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 px-5 py-3 border-t border-white/[0.06] bg-[#0d0d18]/80 backdrop-blur-md shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-all"
        />
        <button type="submit" disabled={sending || !input.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

/* ── Helper: group reactions by emoji ── */
function groupReactions(reactions, currentUserId) {
  const map = {};
  reactions.forEach((r) => {
    if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, count: 0, hasMe: false, userIds: [] };
    map[r.emoji].count++;
    map[r.emoji].userIds.push(r.userId);
    if (currentUserId && String(r.userId) === String(currentUserId)) {
      map[r.emoji].hasMe = true;
    }
  });
  return Object.values(map);
}
