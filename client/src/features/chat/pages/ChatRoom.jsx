/**
 * ChatRoom.jsx — Phase 6 upgrade
 * Modern social messaging structure:
 *
 * Desktop: 65% messages / 35% CommunityActivityPanel
 * Mobile: Full-width messages, panel as a collapsible top tab
 *
 * Changes from previous version:
 * - All hardcoded dark tokens (text-white, bg-[#0d0d18], bg-white/[0.06])
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

/* ── Community activity panel ── */
function CommunityActivityPanel({ chat, messages, currentUserId, onClose }) {
  const participants = chat?.participants || [];
  const highlights   = messages.filter((m) => !m.deleted).slice(-3).reverse();
  const initials     = (name) => name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const avatarColors = ["bg-indigo-600","bg-purple-600","bg-sky-600","bg-teal-600","bg-amber-600","bg-rose-600"];

  return (
    <div className="flex flex-col h-full border-l border-cc-soft bg-cc-bg cc-slide-in-right">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cc-soft shrink-0">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-muted" />
          <span className="text-[12px] font-semibold text-cc">Room Info</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted hover:text-cc transition-colors p-0.5 rounded-md hover:bg-cc-surface-hover">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Chat name + type */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2">
            <span className="text-lg font-bold text-indigo-300">{(chat?.name || "?")[0]?.toUpperCase()}</span>
          </div>
          <p className="text-[13px] font-semibold text-cc">{chat?.name || "Chat"}</p>
          {chat?.type && (
            <p className="text-[10px] text-muted capitalize mt-0.5">{chat.type} chat</p>
          )}
        </div>

        {/* Participants */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2 flex items-center gap-1.5">
            <Users size={10} />
            Members ({participants.length})
          </p>
          <div className="space-y-1.5">
            {participants.slice(0, 8).map((p, i) => {
              const name = p.name || p.userId?.name || "Member";
              const isMe = String(p._id || p.userId?._id || p.userId) === String(currentUserId);
              return (
                <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-cc-surface-hover transition-colors">
                  <div className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                    {initials(name)}
                  </div>
                  <span className="text-[12px] text-cc truncate flex-1">{name}</span>
                  {isMe && <span className="text-[9px] text-muted bg-cc-surface-hover px-1.5 py-0.5 rounded-full">You</span>}
                </div>
              );
            })}
            {participants.length > 8 && (
              <p className="text-[10px] text-muted text-center pt-1">+{participants.length - 8} more</p>
            )}
          </div>
        </div>

        {/* Recent highlights */}
        {highlights.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">Recent Activity</p>
            <div className="space-y-2">
              {highlights.map((msg) => {
                const senderName = msg.senderId?.name || "Unknown";
                return (
                  <div key={msg._id} className="p-2.5 rounded-xl bg-cc-surface-weak border border-cc-soft">
                    <p className="text-[10px] text-indigo-400 font-semibold mb-0.5">{senderName}</p>
                    <p className="text-[11px] text-cc-muted line-clamp-2 leading-relaxed">{msg.message}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatRoom() {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const { chat, messages, setMessages, loading } = useChatRoom(chatId);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText]   = useState("");
  const [socketState, setSocketState] = useState("connected");
  const [showPanel, setShowPanel] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── Socket.io (logic UNCHANGED) ── */
  useEffect(() => {
    const socket = connectChatSocket();
    setSocketState(socket?.connected ? "connected" : "connecting");
    joinChatRoom(chatId);

    const handleConnect        = () => setSocketState("connected");
    const handleDisconnect     = () => setSocketState("disconnected");
    const handleConnectError   = () => { setSocketState("error"); toast.error("Chat connection failed. Retrying in the background."); };
    const handleReconnectAttempt = () => setSocketState("reconnecting");
    const handleReconnect      = () => { setSocketState("connected"); toast.success("Reconnected to chat."); };
    const handleReconnectFailed= () => { setSocketState("error"); toast.error("Chat reconnection failed."); };

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
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    /* Outer: full height flex row — message area (65%) + community panel (35%) */
    <div className="flex h-full text-cc overflow-hidden">

      {/* ── Message area (always visible, 100% on mobile / 65% on lg+) ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Connection status banner */}
        {socketState !== "connected" && (
          <div className="px-5 py-1.5 text-[11px] text-amber-200 bg-amber-950/40 border-b border-amber-500/20 flex items-center justify-between gap-3">
            <span>
              {socketState === "reconnecting" ? "Reconnecting to chat…" : socketState === "error" ? "Chat connection interrupted. Retrying." : "Connecting to chat…"}
            </span>
            <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">{socketState}</span>
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600/40 to-purple-600/40 border border-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0">
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
            {/* Mobile panel toggle */}
            <button
              onClick={() => setShowPanel((x) => !x)}
              className="cc-panel-toggle lg:hidden"
              aria-label="Toggle room info"
            >
              <Info size={12} />
              Info
            </button>
            {/* Desktop info toggle */}
            <button
              onClick={() => setShowPanel((x) => !x)}
              className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted hover:text-cc transition-colors p-1.5 rounded-lg hover:bg-cc-surface-hover"
            >
              <Info size={13} />
            </button>
            <button
              onClick={handleLeaveChat}
              className="text-[11px] text-muted hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Mobile panel (shown inline above messages when toggled) */}
        {showPanel && (
          <div className="lg:hidden border-b border-cc-soft max-h-64 overflow-y-auto bg-cc-bg">
            <CommunityActivityPanel
              chat={chat}
              messages={messages}
              currentUserId={user?._id}
              onClose={() => setShowPanel(false)}
            />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-[13px] text-muted">No messages yet. Start the conversation!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe       = String(msg.senderId?._id || msg.senderId) === String(user?._id);
            const senderName = msg.senderId?.name || "Unknown";
            const initial    = senderName[0]?.toUpperCase() || "?";
            const time       = new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            const showAvatar = i === 0 || String((messages[i-1]?.senderId?._id || messages[i-1]?.senderId)) !== String(msg.senderId?._id || msg.senderId);

            return (
              <div key={msg._id} className={`flex gap-2.5 group ${isMe ? "flex-row-reverse" : ""}`}>
                {showAvatar ? (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 ${isMe ? "bg-indigo-600 text-white" : "bg-cc-surface-hover text-cc"}`}>
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
                        className="flex-1 bg-cc-surface-hover border border-indigo-500/40 rounded-xl px-3 py-1.5 text-[13px] text-cc focus:outline-none focus:border-indigo-500/60"
                        autoFocus
                      />
                      <button onClick={() => handleEdit(msg._id)} className="text-[11px] text-indigo-400 hover:text-indigo-300">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-[11px] text-muted">Cancel</button>
                    </div>
                  ) : (
                    <div className={`inline-block px-3.5 py-2 text-[13px] leading-relaxed ${
                      msg.deleted
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
                          className={`text-[11px] px-1.5 py-0.5 rounded-full border transition-all ${
                            hasMe ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300" : "bg-cc-surface-weak border-cc-soft text-muted hover:border-cc-strong"
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
                      <button onClick={() => handleDelete(msg._id)} className="text-[10px] text-muted hover:text-red-400">Delete</button>
                    </div>
                  )}

                  {/* Quick react */}
                  {!msg.deleted && (
                    <div className="flex gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {["👍","❤️","😂","🎉"].map((emoji) => (
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
            className="flex-1 bg-cc-surface-weak border border-cc-soft rounded-2xl px-4 py-2.5 text-[13px] text-cc placeholder-muted focus:outline-none focus:border-indigo-500/60 focus:bg-cc-surface transition-all"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all duration-150 disabled:opacity-40 active:scale-95 shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* ── Community activity panel (desktop: 35% right column) ── */}
      {showPanel && (
        <div className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 h-full overflow-hidden">
          <CommunityActivityPanel
            chat={chat}
            messages={messages}
            currentUserId={user?._id}
            onClose={() => setShowPanel(false)}
          />
        </div>
      )}
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
