/**
 * ChatList.jsx
 * Shows all chats the user participates in.
 *
 * API: GET /chats  → { success, data: Chat[] } sorted by lastMessageTime DESC
 */

import { useNavigate } from "react-router-dom";
import { useChatList } from "../hooks";
import Button from "../../../components/ui/Button";

const styles = {
  page: "text-cc",
  header: "relative overflow-hidden border-b border-cc-soft",
  headerInner: "relative px-5 lg:px-6 pt-6 pb-5",
  headerKicker: "text-[11px] tracking-widest text-cc-muted uppercase font-mono mb-3",
  headerTitle: "text-3xl font-bold tracking-tight",
  headerCount: "text-cc-muted mt-1.5 text-sm",
  content: "px-5 lg:px-6 py-6",
  loadingCard: "h-16 rounded-xl bg-cc-surface-weak animate-pulse",
  emptyState: "flex flex-col items-center py-16 gap-4 text-center",
  emptyTitle: "text-lg font-semibold",
  emptyMeta: "text-cc-muted text-sm mt-1",
  chatList: "space-y-1.5",
  chatRow:
    "group w-full flex items-center gap-3 p-4 rounded-xl border border-cc-soft bg-cc-surface-weak hover:bg-cc-surface hover-border-cc-strong transition-all text-left",
  avatar: "w-10 h-10 rounded-full ring-1 ring-cc-soft flex items-center justify-center text-xs font-bold shrink-0",
  chatName: "text-sm font-medium text-cc group-hover:text-indigo-300 transition-colors truncate",
  chatTypeBadge:
    "shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-medium",
  chatMessage: "text-[11px] text-cc-muted truncate",
  chatMessageMuted: "text-[11px] text-cc-muted italic",
  timeLabel: "text-[10px] text-cc-muted",
  arrow: "text-[11px] text-cc-muted opacity-0 group-hover:opacity-100 transition-opacity",
};

export default function ChatList() {
  const navigate = useNavigate();
  const { chats, loading } = useChatList();

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
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/3 w-80 h-80 bg-indigo-700/6 rounded-full blur-3xl" />
        </div>
        <div className={styles.headerInner}>
          <p className={styles.headerKicker}>
            Dashboard / Chats
          </p>
          <h1 className={styles.headerTitle}>
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Chats</span>
          </h1>
          <p className={styles.headerCount}>
            {chats.length} conversation{chats.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.loadingCard} />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="text-4xl">💬</span>
            <div>
              <h2 className={styles.emptyTitle}>No chats yet</h2>
              <p className={styles.emptyMeta}>Join a club or event to start chatting.</p>
            </div>
            <Button onClick={() => navigate("/clubs")}>
              Browse Clubs
            </Button>
          </div>
        ) : (
          <div className={styles.chatList}>
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
                  className={styles.chatRow}
                >
                  <div className={`${styles.avatar} ${getAvatarCls(chat.name)}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={styles.chatName}>
                        {chat.name}
                      </p>
                      <span className={`${styles.chatTypeBadge} ${typeBadge}`}>
                        {chat.type}
                      </span>
                    </div>
                    {chat.lastMessage ? (
                      <p className={styles.chatMessage}>{chat.lastMessage}</p>
                    ) : (
                      <p className={styles.chatMessageMuted}>No messages yet</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {timeLabel && <span className={styles.timeLabel}>{timeLabel}</span>}
                    <span className={styles.arrow}>→</span>
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
