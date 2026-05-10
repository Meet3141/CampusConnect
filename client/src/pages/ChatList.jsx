/**
 * ChatList.jsx
 * Shows all chats the user participates in.
 *
 * API: GET /chats  → { success, data: Chat[] } sorted by lastMessageTime DESC
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function ChatList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [chats, setChats]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/chats");
        setChats(res.data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load chats.");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const avatarColors = [
    "bg-indigo-950 text-indigo-300",
    "bg-purple-950 text-purple-300",
    "bg-emerald-950 text-emerald-300",
    "bg-amber-950 text-amber-300",
    "bg-rose-950 text-rose-300",
    "bg-cyan-950 text-cyan-300",
  ];
  const getAvatarCls = (name) => avatarColors[(name?.length || 0) % avatarColors.length];

  return (
    <div className="text-white">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/3 w-80 h-80 bg-indigo-700/6 rounded-full blur-3xl" />
        </div>
        <div className="relative px-5 lg:px-6 pt-6 pb-5">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase font-mono mb-3">
            Dashboard / Chats
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Chats</span>
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            {chats.length} conversation{chats.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-6 py-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-4xl">💬</span>
            <div>
              <h2 className="text-lg font-semibold">No chats yet</h2>
              <p className="text-slate-500 text-sm mt-1">Join a club or event to start chatting.</p>
            </div>
            <button onClick={() => navigate("/clubs")}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors">
              Browse Clubs
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {chats.map((chat) => {
              const initials = chat.name
                ? chat.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                : "?";
              const timeLabel = chat.lastMessageTime ? formatRelative(new Date(chat.lastMessageTime)) : "";
              const typeBadge = chat.type === "club"
                ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                : "bg-emerald-950 text-emerald-300 border-emerald-800";

              return (
                <button
                  key={chat._id}
                  onClick={() => navigate(`/chats/${chat._id}`)}
                  className="group w-full flex items-center gap-3 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] transition-all text-left"
                >
                  <div className={`w-10 h-10 rounded-full ${getAvatarCls(chat.name)} ring-1 ring-white/[0.08] flex items-center justify-center text-xs font-bold shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                        {chat.name}
                      </p>
                      <span className={`shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium ${typeBadge}`}>
                        {chat.type}
                      </span>
                    </div>
                    {chat.lastMessage ? (
                      <p className="text-[11px] text-slate-500 truncate">{chat.lastMessage}</p>
                    ) : (
                      <p className="text-[11px] text-slate-600 italic">No messages yet</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {timeLabel && <span className="text-[10px] text-slate-600">{timeLabel}</span>}
                    <span className="text-[11px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelative(date) {
  const now = new Date();
  const diff = now - date;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1)  return "now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7)  return `${d}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
