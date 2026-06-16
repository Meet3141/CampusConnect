/**
 * ChatRoom.jsx — Phase 6 upgrade
 * Modern social messaging structure:
 *
 * Desktop: 100% messages (CommunityActivityPanel removed)
 * Mobile: Full-width messages
 *
 * Changes from previous version:
 * - All hardcoded dark tokens (text-[var(--cc-color-on-brand)], bg-[#0d0d18], bg-white/6)
 *   replaced with semantic CSS variables
 * - New CommunityActivityPanel (uses existing chat/messages state, no new API)
 * - Refined message bubbles with cc-msg-bubble-me / cc-msg-bubble-other
 * - Mobile: panel toggle tab
 * - All socket/message/edit/delete/react logic UNCHANGED
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  connectChatSocket,
  joinChatRoom,
  leaveChatRoom,
  onChatEvent,
} from "../../../services/chatSocket";
import { useChatRoom } from "../hooks";
import {
  sendMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  leaveChat,
} from "../api";
import { ArrowLeft, Users, Info, X, Send } from "lucide-react";

export default function ChatRoom() {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const { chat, messages, setMessages, loading } = useChatRoom(chatId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [socketState, setSocketState] = useState("connected");

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── Socket.io (logic UNCHANGED) ── */
  useEffect(() => {
    const socket = connectChatSocket();
    setSocketState(socket?.connected ? "connected" : "connecting");
    joinChatRoom(chatId);

    const handleConnect = () => setSocketState("connected");
    const handleDisconnect = () => setSocketState("disconnected");
    const handleConnectError = () => { setSocketState("error"); toast.error("Chat connection failed. Retrying in the background."); };
    const handleReconnectAttempt = () => setSocketState("reconnecting");
    const handleReconnect = () => { setSocketState("connected"); toast.success("Reconnected to chat."); };
    const handleReconnectFailed = () => { setSocketState("error"); toast.error("Chat reconnection failed."); };

    socket?.on("connect", handleConnect);
    socket?.on("disconnect", handleDisconnect);
    socket?.on("connect_error", handleConnectError);
    socket?.io?.on("reconnect_attempt", handleReconnectAttempt);
    socket?.io?.on("reconnect", handleReconnect);
    socket?.io?.on("reconnect_failed", handleReconnectFailed);

    const offNew = onChatEvent("message:new", (msg) => {
      setMessages((prev) => { if (prev.some((m) => m._id === msg._id)) return prev; return [...prev, msg]; });
      setTimeout(scrollToBottom, 100);
    });
    const offUpdated = onChatEvent("message:updated", (msg) => { setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m))); });
    const offDeleted = onChatEvent("message:deleted", ({ _id }) => { setMessages((prev) => prev.map((m) => m._id === _id ? { ...m, deleted: true, message: "This message was deleted" } : m)); });
    const offReacted = onChatEvent("message:reacted", (msg) => { setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m))); });

    return () => {
      offNew(); offUpdated(); offDeleted(); offReacted();
      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
      socket?.off("connect_error", handleConnectError);
      socket?.io?.off("reconnect_attempt", handleReconnectAttempt);
      socket?.io?.off("reconnect", handleReconnect);
      socket?.io?.off("reconnect_failed", handleReconnectFailed);
      leaveChatRoom(chatId);
    };
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (!loading && messages.length > 0) setTimeout(scrollToBottom, 200);
  }, [loading, messages.length, scrollToBottom]);

  /* ── Send (UNCHANGED) ── */
  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try { await sendMessage(chatId, text); setInput(""); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to send."); }
    finally { setSending(false); }
  };

  /* ── Edit (UNCHANGED) ── */
  const handleEdit = async (msgId) => {
    const text = editText.trim();
    if (!text) return;
    try { await editMessage(msgId, text); setEditingId(null); setEditText(""); }
    catch (err) { toast.error(err.response?.data?.message || "Edit failed."); }
  };

  /* ── Delete (UNCHANGED) ── */
  const handleDelete = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try { await deleteMessage(msgId); }
    catch (err) { toast.error(err.response?.data?.message || "Delete failed."); }
  };

  /* ── React (UNCHANGED) ── */
  const handleReact = async (msgId, emoji) => {
    try { await reactToMessage(msgId, emoji); }
    catch (err) { toast.error(err.response?.data?.message || "Reaction failed."); }
  };

  /* ── Leave (UNCHANGED) ── */
  const handleLeaveChat = async () => {
    if (!window.confirm("Leave this chat? You can rejoin later.")) return;
    try { await leaveChat(chatId); navigate("/chats"); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to leave chat."); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--cc-color-brand)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    /* Outer: full height flex row — message area (100%) */
    <div className="flex h-full text-cc overflow-hidden">

      {/* ── Message area (always visible, 100%) ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Connection status banner */}
        {socketState !== "connected" && (
          <div className="px-5 py-1.5 text-[11px] text-[var(--cc-color-warning)] bg-[var(--cc-color-warning-soft)] border-b border-[var(--cc-color-warning)]/20 flex items-center justify-between gap-3">
            <span>
              {socketState === "reconnecting" ? "Reconnecting to chat…" : socketState === "error" ? "Chat connection interrupted. Retrying." : "Connecting to chat…"}
            </span>
            <span className="shrink-0 rounded-full border border-[var(--cc-color-warning)]/20 bg-[var(--cc-color-warning)]/10 px-2 py-0.5 text-[10px] text-[var(--cc-color-warning)]">{socketState}</span>
          </div>
        )}

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cc-soft bg-cc-surface-overlay backdrop-blur-md shrink-0">
          <button
            onClick={() => navigate("/chats")}
            className="text-muted hover:text-cc transition-colors p-1 -ml-1 rounded-lg hover:bg-cc-surface-hover"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--cc-color-brand)]/40 to-purple-600/40 border border-[var(--cc-color-brand)]/20 flex items-center justify-center text-[11px] font-bold text-[var(--cc-color-brand)] shrink-0">
            {(chat?.name || "?")[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-cc truncate">{chat?.name || "Chat"}</p>
            <p className="text-[11px] text-muted">
              {chat?.participants?.length || 0} participant{chat?.participants?.length !== 1 ? "s" : ""}
              {chat?.type && <span> · {chat.type}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLeaveChat}
              className="text-[11px] text-muted hover:text-[var(--cc-color-danger)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--cc-color-danger-soft)]"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-[13px] text-muted">No messages yet. Start the conversation!</p>
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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 ${isMe ? "bg-[var(--cc-color-brand)] text-[var(--cc-color-on-brand)]" : "bg-cc-surface-hover text-cc"}`}>
                    {initial}
                  </div>
                ) : (
                  <div className="w-7 shrink-0" />
                )}

                <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "justify-end" : ""}`}>
                      <span className="text-[11px] font-semibold text-muted">{isMe ? "You" : senderName}</span>
                      <span className="text-[10px] text-muted">{time}</span>
                    </div>
                  )}

                  {editingId === msg._id ? (
                    <div className="flex gap-2 w-full">
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleEdit(msg._id)}
                        className="flex-1 bg-cc-surface-hover border border-[var(--cc-color-brand)]/40 rounded-xl px-3 py-1.5 text-[13px] text-cc focus:outline-none focus:border-[var(--cc-color-brand)]/60"
                        autoFocus
                      />
                      <button onClick={() => handleEdit(msg._id)} className="text-[11px] text-[var(--cc-color-brand)] hover:text-[var(--cc-color-brand-hover)]">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-[11px] text-muted">Cancel</button>
                    </div>
                  ) : (
                    <div className={`inline-block px-3.5 py-2 text-[13px] leading-relaxed ${msg.deleted
                      ? "bg-cc-surface-weak text-muted italic rounded-2xl"
                      : isMe
                        ? "cc-msg-bubble-me"
                        : "cc-msg-bubble-other"
                      }`}>
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
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg._id, emoji)}
                          className={`text-[11px] px-1.5 py-0.5 rounded-full border transition-all ${hasMe ? "bg-[var(--cc-color-brand)]/20 border-[var(--cc-color-brand)]/40 text-[var(--cc-color-brand)]" : "bg-cc-surface-weak border-cc-soft text-muted hover:border-cc-strong"
                            }`}
                        >
                          {emoji} {count}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message actions on hover */}
                  {isMe && !msg.deleted && editingId !== msg._id && (
                    <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(msg._id); setEditText(msg.message); }} className="text-[10px] text-muted hover:text-cc">Edit</button>
                      <button onClick={() => handleDelete(msg._id)} className="text-[10px] text-muted hover:text-[var(--cc-color-danger)]">Delete</button>
                    </div>
                  )}

                  {/* Quick react */}
                  {!msg.deleted && (
                    <div className="flex gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {["👍", "❤️", "😂", "🎉"].map((emoji) => (
                        <button key={emoji} onClick={() => handleReact(msg._id, emoji)} className="text-[12px] hover:scale-125 transition-transform">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2.5 px-4 py-3 border-t border-cc-soft bg-cc-surface-overlay backdrop-blur-md shrink-0"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-cc-surface-weak border border-cc-soft rounded-2xl px-4 py-2.5 text-[13px] text-cc placeholder-muted focus:outline-none focus:border-[var(--cc-color-brand)]/60 focus:bg-cc-surface transition-all"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex items-center justify-center w-10 h-10 btn-primary rounded-2xl transition-all duration-150 disabled:opacity-40 active:scale-95 shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

    </div>
  );
}

/* ── Helper: group reactions by emoji ── */
function groupReactions(reactions, currentUserId) {
  const map = {};
  reactions.forEach((r) => {
    if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, count: 0, hasMe: false };
    map[r.emoji].count++;
    if (currentUserId && String(r.userId) === String(currentUserId)) map[r.emoji].hasMe = true;
  });
  return Object.values(map);
}
