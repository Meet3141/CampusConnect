/**
 * ClubDetail.jsx
 * Full single-club page with 3 tabs: Overview | Members | Events
 *
 * API calls:
 *   GET /api/clubs/:id            → { success, data: club }
 *        club.adminId             = { _id, name, email }  ← POPULATED
 *        club.members[].userId    = raw ObjectId string   ← NOT populated here
 *
 *   GET /api/clubs/:id/members    → { success, data: member[] }  (requires auth)
 *        member.userId            = { _id, name, email, roles }  ← POPULATED
 *
 *   POST /api/clubs/:id/approve-member  body: { memberId: userId._id }
 *   POST /api/clubs/:id/reject-member   body: { memberId: userId._id }
 *   POST /api/clubs/:id/join            → { success, message }
 *   POST /api/clubs/:id/leave           → { success, message }
 *
 *   GET /api/events?clubId=:id    → { success, data: events[] }  (public)
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORY_META = {
  technical: { emoji: "⚙️", heroBg: "from-cyan-900/50 via-blue-900/30",    accent: "text-cyan-400",    ring: "ring-cyan-500/20",    tabActive: "border-cyan-500 text-cyan-400"    },
  cultural:  { emoji: "🎭", heroBg: "from-purple-900/50 via-pink-900/30",   accent: "text-purple-400",  ring: "ring-purple-500/20",  tabActive: "border-purple-500 text-purple-400"  },
  sports:    { emoji: "⚡", heroBg: "from-emerald-900/50 via-green-900/30", accent: "text-emerald-400", ring: "ring-emerald-500/20", tabActive: "border-emerald-500 text-emerald-400" },
  academic:  { emoji: "📚", heroBg: "from-amber-900/50 via-orange-900/30",  accent: "text-amber-400",   ring: "ring-amber-500/20",   tabActive: "border-amber-500 text-amber-400"   },
  arts:      { emoji: "🎨", heroBg: "from-rose-900/50 via-red-900/30",      accent: "text-rose-400",    ring: "ring-rose-500/20",    tabActive: "border-rose-500 text-rose-400"      },
  other:     { emoji: "🌐", heroBg: "from-slate-800/50 via-slate-900/30",   accent: "text-slate-400",   ring: "ring-slate-500/20",   tabActive: "border-slate-400 text-slate-300"    },
};

const TABS = ["Overview", "Members", "Events"];

export default function ClubDetail() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [club, setClub]       = useState(null);
  const [members, setMembers] = useState([]);    // from GET /members (populated)
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState("Overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [memberActionId, setMemberActionId] = useState(null); // userId being approved/rejected
  const [chatLoading, setChatLoading] = useState(false);

  /* ── Derived: is current user the club admin? ──
     club.adminId is POPULATED as { _id, name, email } in getClubById       */
  const isOrgAdmin   = user?.roles?.includes("orgAdmin");
  const isClubAdmin  = isOrgAdmin || (club && String(club.adminId?._id) === String(user?._id));

  /* ── My membership (from populated members list) ── */
  const myMembership = members.find(
    (m) => String(m.userId?._id) === String(user?._id)
  );
  const myStatus = myMembership?.status;

  /* ── Fetch ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Club detail — public endpoint
        const clubRes = await api.get(`/clubs/${id}`);
        setClub(clubRes.data.data);              // response key: "data"

        // Events — public endpoint, filter by clubId
        const eventsRes = await api.get("/events", { params: { clubId: id, limit: 50 } });
        setEvents(eventsRes.data.data || []);    // response key: "data"

        // Members — requires auth; skip if not logged in
        if (user) {
          const membersRes = await api.get(`/clubs/${id}/members`);
          setMembers(membersRes.data.data || []); // response key: "data"
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load club.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  /* ── Join ── */
  const handleJoin = async () => {
    if (!user) { navigate("/login"); return; }
    setActionLoading(true);
    try {
      // POST /api/clubs/:id/join → { success, message }
      await api.post(`/clubs/${id}/join`);
      // Append optimistic pending entry to members list
      setMembers((prev) => [
        ...prev,
        {
          _id: "temp",
          userId: { _id: user._id, name: user.name, email: user.email, roles: user.roles },
          status: "pending",
          joinedAt: new Date().toISOString(),
        },
      ]);
      // Bump the displayed member count
      setClub((prev) => ({ ...prev, memberCount: (prev.memberCount || 0) }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Leave ── */
  const handleLeave = async () => {
    if (!window.confirm("Leave this club?")) return;
    setActionLoading(true);
    try {
      // POST /api/clubs/:id/leave → { success, message }
      await api.post(`/clubs/${id}/leave`);
      setMembers((prev) =>
        prev.filter((m) => String(m.userId?._id) !== String(user?._id))
      );
      setClub((prev) => ({
        ...prev,
        memberCount: Math.max(0, (prev.memberCount || 1) - 1),
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Approve member ──
     POST /api/clubs/:id/approve-member  body: { memberId: userId._id }
     memberId = the user's ObjectId, NOT the subdocument _id              */
  const handleApprove = async (userId) => {
    setMemberActionId(userId);
    try {
      await api.post(`/clubs/${id}/approve-member`, { memberId: userId });
      setMembers((prev) =>
        prev.map((m) =>
          String(m.userId?._id) === String(userId)
            ? { ...m, status: "active", approvedBy: user._id, approvedAt: new Date() }
            : m
        )
      );
      setClub((prev) => ({ ...prev, memberCount: (prev.memberCount || 0) + 1 }));
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed.");
    } finally {
      setMemberActionId(null);
    }
  };

  /* ── Reject member ──
     POST /api/clubs/:id/reject-member  body: { memberId: userId._id }    */
  const handleReject = async (userId) => {
    setMemberActionId(userId);
    try {
      await api.post(`/clubs/${id}/reject-member`, { memberId: userId });
      setMembers((prev) =>
        prev.map((m) =>
          String(m.userId?._id) === String(userId)
            ? { ...m, status: "rejected" }
            : m
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Rejection failed.");
    } finally {
      setMemberActionId(null);
    }
  };

  /* ── Open / create club chat ──
     POST /chats  { type:"club", referenceId: clubId, name }
       → creates if new, returns existing if already created (idempotent)
     POST /chats/:id/join  → adds user to participants               */
  const handleOpenChat = async () => {
    setChatLoading(true);
    try {
      // Create or get existing club chat
      const res = await api.post("/chats", {
        type: "club",
        referenceId: id,
        name: `${club.name} Chat`,
      });
      const chatId = res.data.data._id;

      // Auto-join the user (idempotent on backend)
      await api.post(`/chats/${chatId}/join`);

      navigate(`/chats/${chatId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to open chat.");
    } finally {
      setChatLoading(false);
    }
  };

  /* ── Delete club (orgAdmin only) ── */
  const handleDeleteClub = async () => {
    if (!window.confirm("Are you sure you want to delete this club? This action is permanent and cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api.delete(`/clubs/${id}`);
      navigate("/clubs");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete club.");
    } finally {
      setActionLoading(false);
    }
  };

  const meta           = CATEGORY_META[club?.category] || CATEGORY_META.other;
  const activeMembers  = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── Error / not found ── */
  if (error || !club) {
    return (
      <div className="flex items-center justify-center px-4 py-20 text-center">
        <div>
          <p className="text-red-400 mb-4">{error || "Club not found."}</p>
          <button
            onClick={() => navigate("/clubs")}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors"
          >
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${meta.heroBg} to-transparent`} />
        {club.coverImage && (
          <img
            src={club.coverImage}
            alt={club.name}
            className="absolute inset-0 w-full h-full object-cover opacity-[0.08]"
          />
        )}

        <div className="relative w-full px-5 lg:px-6 pt-5 pb-6">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-8 transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
            Back
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.07] ring-1 ${meta.ring} flex items-center justify-center text-3xl sm:text-4xl shrink-0`}>
              {meta.emoji}
            </div>

            <div className="flex-1 min-w-0">
              {/* Category + status */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-widest text-slate-600 font-mono">
                  {club.category}
                </span>
                {myStatus === "active" && (
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded-full font-semibold">
                    Member
                  </span>
                )}
                {myStatus === "pending" && (
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-yellow-950 text-yellow-300 border border-yellow-700 rounded-full font-semibold">
                    Pending Approval
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{club.name}</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-2xl">
                {club.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-5">
                <StatPill label="Members" value={club.memberCount ?? 0} />
                <StatPill label="Events"  value={events.length} />
                {isClubAdmin && pendingMembers.length > 0 && (
                  <StatPill label="Awaiting" value={pendingMembers.length} highlight />
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              {/* Not a member at all */}
              {!myStatus && user && (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {actionLoading ? "Requesting…" : "Request to Join"}
                </button>
              )}
              {!user && (
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Login to Join
                </button>
              )}
              {/* Active member (non-admin) */}
              {myStatus === "active" && !isClubAdmin && (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="px-5 py-2.5 border border-red-900/60 hover:bg-red-950/40 text-red-400 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Leave Club
                </button>
              )}
              {/* Admin controls */}
              {isClubAdmin && (
                <button
                  onClick={() => navigate(`/clubs/${id}/edit`)}
                  className="px-5 py-2.5 bg-white/[0.07] hover:bg-white/[0.12] rounded-xl text-sm text-white transition-colors whitespace-nowrap"
                >
                  ⚙ Manage
                </button>
              )}
              {/* Club Chat — visible to active members & admins */}
              {(myStatus === "active" || isClubAdmin) && (
                <button
                  onClick={handleOpenChat}
                  disabled={chatLoading}
                  className="px-5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {chatLoading ? "Opening…" : "💬 Club Chat"}
                </button>
              )}
              {/* Delete club — orgAdmin only */}
              {isOrgAdmin && (
                <button
                  onClick={handleDeleteClub}
                  disabled={actionLoading}
                  className="px-5 py-2.5 border border-red-900/60 hover:bg-red-950/40 text-red-400 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  🗑 Delete Club
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-0 z-10 bg-[#0a0a12]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="w-full px-5 lg:px-6 flex gap-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                tab === t
                  ? meta.tabActive
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
              {/* Pending badge on Members tab */}
              {t === "Members" && isClubAdmin && pendingMembers.length > 0 && (
                <span className="ml-2 text-[10px] bg-yellow-500 text-black rounded-full px-1.5 py-px font-bold">
                  {pendingMembers.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="w-full px-5 lg:px-6 py-6">

        {/* ─ Overview ─ */}
        {tab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <Panel title="About">
                <p className="text-slate-300 text-sm leading-relaxed">{club.description}</p>
              </Panel>

              {events.length > 0 && (
                <Panel title="Upcoming Events">
                  <div className="space-y-2">
                    {events.slice(0, 4).map((ev) => (
                      <div
                        key={ev._id}
                        onClick={() => navigate(`/events/${ev._id}`)}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{ev.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            📅{" "}
                            {new Date(ev.date).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                            {"  "}·{"  "}📍 {ev.venue}
                          </p>
                        </div>
                        <span className="text-slate-600 text-sm">→</span>
                      </div>
                    ))}
                    {events.length > 4 && (
                      <button
                        onClick={() => setTab("Events")}
                        className={`text-xs mt-1 ${meta.accent} hover:underline`}
                      >
                        See all {events.length} events →
                      </button>
                    )}
                  </div>
                </Panel>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Panel title="Info">
                <dl className="space-y-3 text-sm">
                  <InfoRow label="Category" value={club.category.charAt(0).toUpperCase() + club.category.slice(1)} />
                  <InfoRow label="Members"  value={club.memberCount ?? 0} />
                  <InfoRow
                    label="Admin"
                    value={club.adminId?.name || "—"}    // adminId is populated in detail
                  />
                  <InfoRow
                    label="Created"
                    value={new Date(club.createdAt).toLocaleDateString("en-US", {
                      month: "long", year: "numeric",
                    })}
                  />
                </dl>
              </Panel>

              {activeMembers.length > 0 && (
                <Panel title="Members">
                  <div className="flex flex-wrap gap-2">
                    {activeMembers.slice(0, 9).map((m) => (
                      <div
                        key={m._id}
                        title={m.userId?.name}
                        className="w-8 h-8 rounded-full bg-indigo-950 ring-1 ring-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-300 uppercase select-none"
                      >
                        {(m.userId?.name || "?")[0]}
                      </div>
                    ))}
                    {activeMembers.length > 9 && (
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] ring-1 ring-white/[0.08] flex items-center justify-center text-[10px] text-slate-500">
                        +{activeMembers.length - 9}
                      </div>
                    )}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        )}

        {/* ─ Members ─ */}
        {tab === "Members" && (
          <div className="space-y-8 max-w-3xl">
            {/* Pending requests — visible to admins only */}
            {isClubAdmin && pendingMembers.length > 0 && (
              <div>
                <SectionHeading
                  label="Pending Requests"
                  count={pendingMembers.length}
                  countCls="text-yellow-400"
                />
                <div className="space-y-2">
                  {pendingMembers.map((m) => (
                    <MemberRow
                      key={m._id}
                      member={m}
                      isAdmin={isClubAdmin}
                      actionLoading={memberActionId === String(m.userId?._id)}
                      onApprove={() => handleApprove(String(m.userId?._id))}
                      onReject={() => handleReject(String(m.userId?._id))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active members */}
            <div>
              <SectionHeading label="Active Members" count={activeMembers.length} />
              {activeMembers.length === 0 ? (
                <p className="text-slate-600 text-sm">No active members yet.</p>
              ) : (
                <div className="space-y-2">
                  {activeMembers.map((m) => (
                    <MemberRow key={m._id} member={m} isAdmin={false} />
                  ))}
                </div>
              )}
            </div>

            {/* Not logged in notice */}
            {!user && (
              <p className="text-slate-600 text-sm">
                <button onClick={() => navigate("/login")} className="text-indigo-400 underline">
                  Log in
                </button>{" "}
                to see the full members list.
              </p>
            )}
          </div>
        )}

        {/* ─ Events ─ */}
        {tab === "Events" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <SectionHeading label="Club Events" count={events.length} />
              {isClubAdmin && (
                <button
                  onClick={() => navigate(`/events/create?clubId=${id}`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors"
                >
                  + Add Event
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-slate-600 text-sm">No events yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((ev) => (
                  <div
                    key={ev._id}
                    onClick={() => navigate(`/events/${ev._id}`)}
                    className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] p-5 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium ${
                        ev.status === "upcoming"
                          ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                          : "bg-white/[0.04] text-slate-500 border-white/[0.06]"
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {ev.title}
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-2">
                      📅 {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">📍 {ev.venue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function StatPill({ label, value, highlight }) {
  return (
    <div>
      <p className={`text-2xl font-bold tabular-nums ${highlight ? "text-yellow-400" : "text-white"}`}>
        {value}
      </p>
      <p className="text-[11px] text-slate-600 mt-0.5">{label}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <h3 className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-white font-medium text-right max-w-[60%] truncate">{value}</dd>
    </div>
  );
}

function SectionHeading({ label, count, countCls = "text-slate-500" }) {
  return (
    <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-4">
      {label}
      <span className={`font-mono ${countCls}`}>{count}</span>
    </h2>
  );
}

function MemberRow({ member, isAdmin, actionLoading, onApprove, onReject }) {
  const name    = member.userId?.name  || "Unknown";
  const email   = member.userId?.email || "";
  const initial = name[0]?.toUpperCase() || "?";
  const joined  = member.joinedAt
    ? new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-indigo-950 ring-1 ring-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-[11px] text-slate-600 truncate">{email} · {joined}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        {/* Pending: show approve / reject buttons (admin only) */}
        {member.status === "pending" && isAdmin && (
          <>
            <button
              onClick={onApprove}
              disabled={actionLoading}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800 text-emerald-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {actionLoading ? "…" : "Approve"}
            </button>
            <button
              onClick={onReject}
              disabled={actionLoading}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-900 text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {actionLoading ? "…" : "Reject"}
            </button>
          </>
        )}

        {/* Status pill */}
        {member.status === "active" && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
            Active
          </span>
        )}
        {member.status === "rejected" && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-red-950 text-red-400 border border-red-900 rounded-full">
            Rejected
          </span>
        )}
        {member.status === "pending" && !isAdmin && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-yellow-950 text-yellow-400 border border-yellow-800 rounded-full">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}
