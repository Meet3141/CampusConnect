/**
 * ChatList.jsx — Phase 6 upgrade
 * Modern messaging list with:
 * - Section headers: "Active" (has messages) / "All Chats"
 * - Unread dot indicator
 * - Avatar ring animation on hover
 * - Time badge
 * - Type pill (club / group)
 * - Premium feel, semantic tokens throughout
 */

import { useNavigate } from "react-router-dom";
import { useChatList } from "../hooks";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/layout/PageHeader";
import PageContainer from "../../../components/layout/PageContainer";
import { MessageCircle, Search, ChevronRight } from "lucide-react";
import { useState } from "react";

function formatRelative(date) {
  const now = new Date();
  const diff = now - date;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const AVATAR_COLORS = [
  "from-indigo-600 to-indigo-800",
  "from-purple-600 to-purple-800",
  "from-emerald-600 to-emerald-800",
  "from-amber-600 to-amber-800",
  "from-rose-600 to-rose-800",
  "from-cyan-600 to-cyan-800",
];

function getAvatarGrad(name) {
  return AVATAR_COLORS[(name?.length || 0) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ChatList() {
  const navigate = useNavigate();
  const { chats, loading } = useChatList();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? chats.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : chats;

  const activeChats = filtered.filter((c) => !!c.lastMessage);
  const quietChats = filtered.filter((c) => !c.lastMessage);

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <PageHeader
        breadcrumb="Dashboard / Chats"
        title="Chats"
        titleAccent="Chats"
        subtitle={
          <>
            {loading ? "…" : `${chats.length} conversation${chats.length !== 1 ? "s" : ""}`}
            {activeChats.length > 0 && !loading && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-[var(--cc-color-brand)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-color-brand)] animate-pulse" />
                {activeChats.length} with messages
              </span>
            )}
          </>
        }
        decorative
        glowColor="indigo"
        filterRow={
          <div className="mt-4 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-9 pr-4 py-2.5 bg-cc-surface-weak border border-cc-soft rounded-xl text-[13px] text-cc placeholder-muted focus:outline-none focus:border-[var(--cc-color-brand)]/60 transition-all"
            />
          </div>
        }
      />

      {/* ── Content ── */}
      <PageContainer className="py-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-cc-surface-weak animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cc-surface-weak border border-cc-soft text-3xl">💬</span>
            <div>
              <h2 className="text-heading-md text-cc">No chats yet</h2>
              <p className="text-body-sm text-muted mt-1">Join a club or event to start chatting.</p>
            </div>
            <Button onClick={() => navigate("/clubs")}>Browse Clubs</Button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Active conversations */}
            {activeChats.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-color-brand)] animate-pulse" />
                  Active ({activeChats.length})
                </p>
                <div className="space-y-1">
                  {activeChats.map((chat) => <ChatRow key={chat._id} chat={chat} onClick={() => navigate(`/chats/${chat._id}`)} />)}
                </div>
              </div>
            )}

            {/* Quiet chats */}
            {quietChats.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">
                  All Chats ({quietChats.length})
                </p>
                <div className="space-y-1">
                  {quietChats.map((chat) => <ChatRow key={chat._id} chat={chat} onClick={() => navigate(`/chats/${chat._id}`)} />)}
                </div>
              </div>
            )}

            {search && filtered.length === 0 && (
              <p className="text-center text-muted py-8">No chats match "{search}".</p>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
}

function ChatRow({ chat, onClick }) {
  const timeLabel = chat.lastMessageTime ? formatRelative(new Date(chat.lastMessageTime)) : "";
  const hasUnread = !!chat.lastMessage;
  const typeCls = chat.type === "club"
    ? "bg-[var(--cc-color-surface-brand)] text-[var(--cc-color-brand)] border-[var(--cc-color-brand)]"
    : "bg-[var(--cc-color-success-soft)] text-[var(--cc-color-success)] border-[var(--cc-color-success)]";

  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface hover:border-cc-strong transition-all duration-200 text-left hover:-translate-y-px hover:shadow-sm"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getAvatarGrad(chat.name)} flex items-center justify-center text-[12px] font-bold text-white ring-1 ring-white/10 group-hover:ring-[var(--cc-color-brand)]/30 transition-all duration-200`}>
          {getInitials(chat.name)}
        </div>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--cc-color-brand)] border-2 border-cc-bg" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[13px] font-semibold text-cc group-hover:text-[var(--cc-color-brand)] transition-colors truncate">
            {chat.name}
          </p>
          {chat.type && (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${typeCls}`}>
              {chat.type}
            </span>
          )}
        </div>
        {chat.lastMessage ? (
          <p className="text-[11px] text-muted truncate">{chat.lastMessage}</p>
        ) : (
          <p className="text-[11px] text-muted italic">No messages yet</p>
        )}
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {timeLabel && <span className="text-[10px] text-muted">{timeLabel}</span>}
        <ChevronRight size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}
