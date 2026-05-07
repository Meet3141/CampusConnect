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

// Base tabs — Announcements is injected only for members/coordinators/admins
const BASE_TABS = ["Overview", "Members", "Events"];


export default function ClubDetail() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [club, setClub]             = useState(null);
  const [members, setMembers]       = useState([]);
  const [events, setEvents]         = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading]       = useState(false);
  const [annPosting, setAnnPosting]       = useState(false);
  const [annForm, setAnnForm]             = useState({ title: "", body: "", tag: "general" });
  const [showAnnForm, setShowAnnForm]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [tab, setTab]               = useState("Overview");
  const [actionLoading, setActionLoading]   = useState(false);
  const [memberActionId, setMemberActionId] = useState(null);
  const [chatLoading, setChatLoading]       = useState(false);

  // Coordinator promotion state
  const [promotingMember, setPromotingMember] = useState(null);
  const [coordCategory,   setCoordCategory]   = useState("none");
  const [coordActing,     setCoordActing]      = useState(null);
  const [coordDropOpen,   setCoordDropOpen]    = useState(false);

  /* ── Derived: is current user the club admin? ──
     club.adminId is POPULATED as { _id, name, email } in getClubById.
     Mongoose toObject()/_id is serialised to a hex string by res.json().
     user._id (from user.toJSON via AuthContext) is also a hex string.
     We compare as strings to be safe across all serialisation paths.       */
  const currentUserId = String(user?._id || user?.id || "");
  const isOrgAdmin    = user?.roles?.includes("orgAdmin");
  // isClubAdmin = orgAdmin OR this user is the specific admin of THIS club
  const isClubAdmin   = isOrgAdmin ||
    (club != null && currentUserId !== "" &&
      String(club.adminId?._id || club.adminId) === currentUserId);

  /* ── My membership (from populated members list) ── */
  const myMembership = members.find(
    (m) => String(m.userId?._id || m.userId) === currentUserId
  );
  const myStatus = myMembership?.status;
  const isApprovedMember = myStatus === "approved" || myStatus === "active";

  /* ── Fetch ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Club detail — public endpoint
        const clubRes = await api.get(`/clubs/${id}`);
        setClub(clubRes.data.data);              // response key: "data"

        // Events — public endpoint (drafts filtered server-side for non-admin)
        const eventsRes = await api.get("/events", { params: { clubId: id, limit: 50 } });
        setEvents(eventsRes.data.data || []);

        // Members — requires auth; skip if not logged in
        if (user) {
          const membersRes = await api.get(`/clubs/${id}/members`);
          setMembers(membersRes.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load club.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  // Fetch announcements when that tab is opened
  useEffect(() => {
    if (tab !== "Announcements" || !user) return;
    const loadAnn = async () => {
      setAnnLoading(true);
      try {
        const res = await api.get(`/clubs/${id}/announcements`);
        setAnnouncements(res.data.data || []);
      } catch { /* member-only, ignore if not member */ }
      finally { setAnnLoading(false); }
    };
    loadAnn();
  }, [tab, id, user]);

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
        prev.filter((m) => String(m.userId?._id || m.userId) !== currentUserId)
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
          String(m.userId?._id || m.userId) === String(userId)
            ? { ...m, status: "approved", approvedBy: currentUserId, approvedAt: new Date() }
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
          String(m.userId?._id || m.userId) === String(userId)
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

  /* ── Promote to coordinator ── */
  const handlePromote = async () => {
    if (!promotingMember) return;
    setCoordActing(promotingMember.userId);
    try {
      await api.post(`/clubs/${id}/coordinator/assign`, {
        memberId: promotingMember.userId,
        coordinatorCategory: coordCategory,
      });
      setMembers((prev) =>
        prev.map((m) =>
          String(m.userId?._id || m.userId) === String(promotingMember.userId)
            ? { ...m, clubRole: "coordinator", coordinatorCategory: coordCategory }
            : m
        )
      );
      setPromotingMember(null);
      setCoordCategory("none");
      setCoordDropOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign coordinator.");
    } finally {
      setCoordActing(null);
    }
  };

  /* ── Demote coordinator ── */
  const handleDemote = async (userId) => {
    if (!window.confirm("Remove coordinator role from this member?")) return;
    setCoordActing(userId);
    try {
      await api.delete(`/clubs/${id}/coordinator/${userId}`);
      setMembers((prev) =>
        prev.map((m) =>
          String(m.userId?._id || m.userId) === String(userId)
            ? { ...m, clubRole: "member", coordinatorCategory: "none" }
            : m
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove coordinator.");
    } finally {
      setCoordActing(null);
    }
  };

  /* ── Publish draft event (clubAdmin only) ── */
  const handlePublishEvent = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/publish`);
      setEvents((prev) => prev.map((ev) => ev._id === eventId ? res.data.data : ev));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish event.");
    }
  };

  /* ── Post announcement ── */
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.body.trim()) return;
    setAnnPosting(true);
    try {
      const res = await api.post(`/clubs/${id}/announcements`, annForm);
      setAnnouncements((prev) => [res.data.data, ...prev]);
      setAnnForm({ title: "", body: "", tag: "general" });
      setShowAnnForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post announcement.");
    } finally {
      setAnnPosting(false);
    }
  };

  /* ── Delete announcement ── */
  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/clubs/${id}/announcements/${annId}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== annId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete.");
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
  const activeMembers  = members.filter((m) => m.status === "approved" || m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");

  // Is the current user a coordinator of THIS club?
  const isCoordinator = !isClubAdmin && members.some(
    (m) =>
      (String(m.userId?._id || m.userId) === currentUserId) &&
      m.status === "approved" &&
      m.clubRole === "coordinator"
  );
  const canCreateEvent = isClubAdmin || isCoordinator;

  // isMember = approved member OR coordinator OR admin (can see Announcements)
  const isMember = isClubAdmin || isCoordinator ||
    (myMembership?.status === "approved" || myMembership?.status === "active");

  // Announcements only visible to members+
  const TABS = isMember
    ? [...BASE_TABS, "Announcements"]
    : BASE_TABS;

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

  return (<>
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
                {isApprovedMember && (
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
              {/* A5: Not a member AND not the club admin (admin is not in members array) */}
              {!myStatus && user && !isClubAdmin && (
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
              {isApprovedMember && !isClubAdmin && (
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
              {(isApprovedMember || isClubAdmin) && (
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
                      onViewProfile={() => navigate(`/users/${m.userId?._id}`)}
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
                    <MemberRow
                      key={m._id}
                      member={m}
                      isAdmin={isClubAdmin}
                      onViewProfile={() => navigate(`/users/${m.userId?._id}`)}
                      onPromote={isClubAdmin ? () => {
                        setPromotingMember({ userId: String(m.userId?._id), name: m.userId?.name });
                        setCoordCategory(m.coordinatorCategory || "none");
                      } : undefined}
                      onDemote={isClubAdmin && m.clubRole === "coordinator"
                        ? () => handleDemote(String(m.userId?._id))
                        : undefined}
                      coordActing={coordActing === String(m.userId?._id)}
                    />
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
              {canCreateEvent && (
                <button
                  onClick={() => navigate(`/events/create?clubId=${id}`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors"
                >
                  {isCoordinator ? "+ Draft Event" : "+ Add Event"}
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
                        ev.status === "upcoming"        ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                        : ev.status === "draft"         ? "bg-slate-900 text-slate-400 border-slate-700"
                        : ev.status === "pending_approval" ? "bg-yellow-950 text-yellow-400 border-yellow-800"
                        : ev.status === "ongoing"       ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : ev.status === "completed"     ? "bg-white/[0.04] text-slate-500 border-white/[0.06]"
                        : "bg-red-950 text-red-400 border-red-900"
                      }`}>
                        {ev.status === "pending_approval" ? "Pending Approval" : ev.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {ev.title}
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-2">
                      📅 {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">📍 {ev.venue}</p>
                    {/* Publish button for admin on draft events */}
                    {isClubAdmin && ["draft", "pending_approval"].includes(ev.status) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePublishEvent(ev._id); }}
                        className="mt-3 w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors"
                      >
                        ✓ Publish Event
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─ Announcements ─ */}
        {tab === "Announcements" && (
          <div className="max-w-2xl space-y-6">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <SectionHeading label="Announcements" count={announcements.length} />
              {(isClubAdmin || isCoordinator) && (
                <button
                  onClick={() => setShowAnnForm((v) => !v)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors"
                >
                  {showAnnForm ? "Cancel" : "+ Post"}
                </button>
              )}
            </div>

            {/* Compose form */}
            {showAnnForm && (
              <form onSubmit={handlePostAnnouncement} className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5 space-y-3">
                <input
                  required
                  maxLength={120}
                  placeholder="Title…"
                  value={annForm.title}
                  onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.1] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-600/50"
                />
                <textarea
                  required
                  maxLength={2000}
                  rows={4}
                  placeholder="Write your announcement…"
                  value={annForm.body}
                  onChange={(e) => setAnnForm((f) => ({ ...f, body: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.1] rounded-xl text-white placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-600/50"
                />
                <div className="flex items-center gap-3">
                  <select
                    value={annForm.tag}
                    onChange={(e) => setAnnForm((f) => ({ ...f, tag: e.target.value }))}
                    className="px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-400 focus:outline-none"
                  >
                    <option value="general">📌 General</option>
                    <option value="event">📅 Event</option>
                    <option value="reminder">⏰ Reminder</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                  <button
                    type="submit"
                    disabled={annPosting}
                    className="ml-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {annPosting ? "Posting…" : "Post"}
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            {annLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📢</div>
                <p className="text-slate-600 text-sm">No announcements yet.</p>
                {!user && <p className="text-slate-700 text-xs mt-1">Join the club to see announcements.</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => {
                  const TAG_STYLE = {
                    general:  "bg-slate-900 text-slate-400 border-slate-700",
                    event:    "bg-indigo-950 text-indigo-300 border-indigo-800",
                    reminder: "bg-amber-950 text-amber-400 border-amber-800",
                    urgent:   "bg-red-950 text-red-400 border-red-900",
                  };
                  const canDel = isClubAdmin ||
                    (ann.postedBy && String(ann.postedBy._id || ann.postedBy) === currentUserId);
                  return (
                    <div
                      key={ann._id}
                      className={`rounded-2xl border p-5 ${
                        ann.pinned
                          ? "border-amber-700/50 bg-amber-950/20"
                          : "border-white/[0.07] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {ann.pinned && <span className="text-amber-400 text-xs">📌</span>}
                          <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-semibold ${TAG_STYLE[ann.tag] || TAG_STYLE.general}`}>
                            {ann.tag}
                          </span>
                          <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                        </div>
                        {canDel && (
                          <button
                            onClick={() => handleDeleteAnnouncement(ann._id)}
                            className="text-slate-700 hover:text-red-400 text-xs transition-colors shrink-0"
                            title="Delete announcement"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{ann.body}</p>
                      <p className="text-[11px] text-slate-700 mt-3">
                        {ann.postedBy?.name || "Unknown"} · {new Date(ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>

    {/* ── COORDINATOR PROMOTE MODAL ── */}
    {promotingMember && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-[#111] border border-white/[0.1] rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
            <h2 className="text-sm font-bold text-white">Assign Coordinator</h2>
            <button onClick={() => setPromotingMember(null)} className="text-slate-600 hover:text-white text-xl leading-none">×</button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-slate-400 text-sm">
              Promote <strong className="text-white">{promotingMember.name}</strong> to Student Club Coordinator?
            </p>
            <div className="relative">
              <label className="block text-[11px] text-slate-500 uppercase tracking-widest mb-1.5">Coordinator Category (optional)</label>

              {/* Custom dropdown trigger */}
              <button
                type="button"
                onClick={() => setCoordDropOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm bg-[#1a1a2a] border border-white/[0.12] rounded-xl text-white hover:border-indigo-600/50 transition-colors focus:outline-none focus:border-indigo-600/50"
              >
                <span>
                  {coordCategory === "none"      && "None (general)"}
                  {coordCategory === "event"     && "📅 Event Coordinator"}
                  {coordCategory === "content"   && "📝 Content Coordinator"}
                  {coordCategory === "technical" && "⚡ Technical Coordinator"}
                </span>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${coordDropOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown options */}
              {coordDropOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border border-white/[0.12] bg-[#1a1a2a] shadow-2xl overflow-hidden">
                  {[
                    { value: "none",      label: "None (general)",        icon: "🌐" },
                    { value: "event",     label: "Event Coordinator",     icon: "📅" },
                    { value: "content",   label: "Content Coordinator",   icon: "📝" },
                    { value: "technical", label: "Technical Coordinator",  icon: "⚡" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setCoordCategory(opt.value); setCoordDropOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        coordCategory === opt.value
                          ? "bg-indigo-600/20 text-indigo-300"
                          : "text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span>{opt.label}</span>
                      {coordCategory === opt.value && (
                        <svg className="ml-auto w-3.5 h-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-600 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 space-y-1">
              <p>✓ Can create draft events, edit details, manage registrations</p>
              <p>✓ Can mark attendance and post announcements</p>
              <p>✗ Cannot publish events or remove members</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setPromotingMember(null)}
                className="flex-1 py-2.5 border border-white/[0.1] text-slate-400 rounded-xl text-sm hover:border-white/[0.2] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={!!coordActing}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {coordActing ? "Assigning…" : "Assign Role"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>);
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

function MemberRow({ member, isAdmin, actionLoading, onApprove, onReject, onViewProfile, onPromote, onDemote, coordActing }) {
  const name      = member.userId?.name  || "Unknown";
  const email     = member.userId?.email || "";
  const initial   = name[0]?.toUpperCase() || "?";
  const joined    = member.joinedAt || member.createdAt
    ? new Date(member.joinedAt || member.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
  const isApproved    = member.status === "approved" || member.status === "active";
  const isCoordinator = member.clubRole === "coordinator";

  const COORD_CAT_LABEL = {
    event: "📅 Event", content: "📝 Content", technical: "⚡ Technical", none: "",
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] transition-colors group">
      {/* Left — clickable profile area */}
      <button
        onClick={onViewProfile}
        disabled={!onViewProfile}
        className="flex items-center gap-3 min-w-0 flex-1 text-left disabled:cursor-default"
        title={onViewProfile ? `View ${name}'s profile` : undefined}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-indigo-950 ring-1 ring-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0">
            {initial}
          </div>
          {/* Coordinator dot */}
          {isCoordinator && (
            <span
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0a0a12]"
              title="Coordinator"
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate transition-colors ${
              onViewProfile ? "text-white group-hover:text-indigo-300" : "text-white"
            }`}>
              {name}
              {onViewProfile && (
                <span className="ml-1 text-slate-600 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
              )}
            </p>
            {/* Coordinator badge */}
            {isCoordinator && (
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/50 font-semibold whitespace-nowrap">
                {COORD_CAT_LABEL[member.coordinatorCategory] || "Coordinator"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 truncate">{email ? `${email} · ` : ""}{joined}</p>
        </div>
      </button>

      {/* Right — status + admin actions */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {/* Pending: approve / reject */}
        {member.status === "pending" && isAdmin && (
          <>
            <button
              onClick={onApprove}
              disabled={actionLoading}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800 text-emerald-300 transition-colors disabled:opacity-40"
            >
              {actionLoading ? "…" : "Approve"}
            </button>
            <button
              onClick={onReject}
              disabled={actionLoading}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-900 text-red-400 transition-colors disabled:opacity-40"
            >
              {actionLoading ? "…" : "Reject"}
            </button>
          </>
        )}

        {/* Active member admin actions */}
        {isApproved && isAdmin && (
          isCoordinator ? (
            // Demote button
            <button
              onClick={onDemote}
              disabled={coordActing}
              title="Remove coordinator role"
              className="text-[11px] px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 text-amber-400 transition-colors disabled:opacity-40"
            >
              {coordActing ? "…" : "Demote"}
            </button>
          ) : (
            // Promote button
            <button
              onClick={onPromote}
              disabled={coordActing}
              title="Assign coordinator role"
              className="text-[11px] px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-800/60 text-indigo-300 transition-colors disabled:opacity-40"
            >
              {coordActing ? "…" : "★ Promote"}
            </button>
          )
        )}

        {/* Status pill */}
        {isApproved && !isAdmin && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
            Active
          </span>
        )}
        {isApproved && isAdmin && !isCoordinator && (
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

