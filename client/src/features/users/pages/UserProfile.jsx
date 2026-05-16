/**
 * UserProfile.jsx
 * Read-only public profile view for any user.
 * Route: /users/:id
 *
 * API: GET /api/users/:id → { success, user: { name, bio, roles, interests, profilePicture, createdAt } }
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useUserProfile } from "../hooks";

// Same 12 avatars as Profile.jsx
const AVATARS = {
  avatar_1:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#1a1a2e"/><polygon points="40,10 70,65 10,65" fill="#e94560" opacity="0.9"/><circle cx="40" cy="40" r="12" fill="#0f3460"/></svg>,
  avatar_2:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#0d0d0d"/><rect x="15" y="15" width="50" height="50" rx="8" fill="#f5a623" opacity="0.85"/><circle cx="40" cy="40" r="14" fill="#0d0d0d"/><circle cx="40" cy="40" r="6" fill="#f5a623"/></svg>,
  avatar_3:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#0a1628"/><circle cx="40" cy="40" r="28" fill="none" stroke="#00d4ff" strokeWidth="4"/><circle cx="40" cy="40" r="18" fill="none" stroke="#00d4ff" strokeWidth="2" opacity="0.5"/><circle cx="40" cy="40" r="8" fill="#00d4ff"/></svg>,
  avatar_4:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#1a0a2e"/><polygon points="40,8 74,62 6,62" fill="none" stroke="#b347ea" strokeWidth="3"/><polygon points="40,20 64,58 16,58" fill="#b347ea" opacity="0.4"/><circle cx="40" cy="40" r="8" fill="#b347ea"/></svg>,
  avatar_5:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#0a2010"/><rect x="20" y="20" width="40" height="40" fill="none" stroke="#39d353" strokeWidth="3" transform="rotate(45 40 40)"/><rect x="28" y="28" width="24" height="24" fill="#39d353" opacity="0.3" transform="rotate(45 40 40)"/><circle cx="40" cy="40" r="7" fill="#39d353"/></svg>,
  avatar_6:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#1a0a00"/><circle cx="40" cy="30" r="16" fill="#ff6b35" opacity="0.9"/><ellipse cx="40" cy="58" rx="20" ry="10" fill="#ff6b35" opacity="0.6"/></svg>,
  avatar_7:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#0d1117"/><line x1="40" y1="5" x2="40" y2="75" stroke="#58a6ff" strokeWidth="2"/><line x1="5" y1="40" x2="75" y2="40" stroke="#58a6ff" strokeWidth="2"/><line x1="12" y1="12" x2="68" y2="68" stroke="#58a6ff" strokeWidth="2"/><line x1="68" y1="12" x2="12" y2="68" stroke="#58a6ff" strokeWidth="2"/><circle cx="40" cy="40" r="10" fill="#58a6ff"/></svg>,
  avatar_8:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#16001e"/><path d="M40 10 L55 30 L75 35 L60 52 L63 72 L40 62 L17 72 L20 52 L5 35 L25 30 Z" fill="#ff47a3" opacity="0.8"/><circle cx="40" cy="40" r="9" fill="#16001e"/></svg>,
  avatar_9:  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#001a1a"/><rect x="12" y="12" width="56" height="56" rx="28" fill="none" stroke="#00ffcc" strokeWidth="3"/><rect x="22" y="22" width="36" height="36" rx="4" fill="#00ffcc" opacity="0.15"/></svg>,
  avatar_10: <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#1a1000"/><polygon points="40,12 68,28 68,52 40,68 12,52 12,28" fill="none" stroke="#ffd700" strokeWidth="3"/><polygon points="40,22 58,32 58,48 40,58 22,48 22,32" fill="#ffd700" opacity="0.25"/><circle cx="40" cy="40" r="8" fill="#ffd700"/></svg>,
  avatar_11: <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#0a0a1a"/><circle cx="26" cy="35" r="10" fill="#4fc3f7" opacity="0.8"/><circle cx="54" cy="35" r="10" fill="#f48fb1" opacity="0.8"/><circle cx="40" cy="52" r="10" fill="#a5d6a7" opacity="0.8"/></svg>,
  avatar_12: <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#100010"/><path d="M40 15 Q65 40 40 65 Q15 40 40 15Z" fill="#e040fb" opacity="0.7"/><path d="M15 40 Q40 15 65 40 Q40 65 15 40Z" fill="#7c4dff" opacity="0.7"/><circle cx="40" cy="40" r="8" fill="#100010"/></svg>,
};

const ROLE_COLORS = {
  member:    { bg: "rgba(88,166,255,0.1)",  color: "#58a6ff",  border: "rgba(88,166,255,0.25)" },
  clubAdmin: { bg: "rgba(255,167,38,0.1)",  color: "#ffa726",  border: "rgba(255,167,38,0.25)" },
  editor:    { bg: "rgba(102,187,106,0.1)", color: "#66bb6a",  border: "rgba(102,187,106,0.25)" },
  orgAdmin:  { bg: "rgba(229,57,53,0.1)",   color: "#e53935",  border: "rgba(229,57,53,0.25)" },
};

export default function UserProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const { profile, loading, error } = useUserProfile(id);

  // If the current user is viewing their own profile, redirect to /profile
  useEffect(() => {
    if (me && String(me._id) === String(id)) {
      navigate("/profile", { replace: true });
    }
  }, [me, id, navigate]);


  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.center}>
          <div style={S.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={S.page}>
        <div style={S.center}>
          <p style={{ color: "#e94560", marginBottom: 16 }}>{error}</p>
          <button onClick={() => navigate(-1)} style={S.backBtn}>← Go Back</button>
        </div>
      </div>
    );
  }

  const avatar     = AVATARS[profile.profilePicture] || AVATARS.avatar_1;
  const since      = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";
  const initials   = (profile.name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .back-btn:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      <div style={S.page}>

        {/* ── Nav ── */}
        <nav style={S.nav}>
          <button className="back-btn" onClick={() => navigate(-1)} style={S.navBack}>
            <span style={{ fontSize: 18 }}>←</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>back</span>
          </button>
          <span style={S.navBrand}>CAMPUS<span style={{ color: "#e94560" }}>CONNECT</span></span>
          <div style={{ width: 80 }} />
        </nav>

        <main style={S.main}>

          {/* ── Profile card ── */}
          <div style={S.card}>
            <div style={S.gradientBar} />

            {/* Avatar + identity */}
            <div style={S.headerRow}>
              {/* Avatar */}
              <div style={S.avatarRing}>
                <div style={S.avatarInner}>{avatar}</div>
              </div>

              {/* Name + roles + since */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={S.name}>{profile.name}</h1>

                <div style={S.rolesRow}>
                  {(profile.roles || []).map(role => (
                    <span
                      key={role}
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 6,
                        border: "1px solid",
                        letterSpacing: "0.05em",
                        ...ROLE_COLORS[role],
                      }}
                    >
                      {role}
                    </span>
                  ))}
                </div>

                <p style={S.since}>
                  <span style={{ color: "#555" }}>member since </span>
                  <span style={{ color: "#888" }}>{since}</span>
                </p>
              </div>

              {/* "You" badge if this is the viewer's own profile (shouldn't normally reach here) */}
              {me && String(me._id) === String(id) && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#555", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6 }}>
                  you
                </span>
              )}
            </div>
          </div>

          {/* ── Content grid ── */}
          <div style={S.grid}>

            {/* Bio */}
            <div style={S.panel}>
              <h3 style={S.panelTitle}>Bio</h3>
              <p style={{ color: profile.bio ? "#b0b0b0" : "#444", fontSize: 14, lineHeight: 1.7, fontStyle: profile.bio ? "normal" : "italic" }}>
                {profile.bio || "This user hasn't added a bio yet."}
              </p>
            </div>

            {/* Interests */}
            <div style={S.panel}>
              <h3 style={S.panelTitle}>Interests</h3>
              {(profile.interests || []).length === 0 ? (
                <p style={{ color: "#444", fontSize: 13, fontStyle: "italic" }}>No interests listed.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile.interests.map(tag => (
                    <span key={tag} style={S.tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Account snapshot */}
            <div style={S.panel}>
              <h3 style={S.panelTitle}>Account</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "User ID",   value: (profile._id || "").slice(-8).toUpperCase() },
                  { label: "Roles",     value: (profile.roles || []).join(", ") },
                  { label: "Interests", value: `${(profile.interests || []).length} topics` },
                  { label: "Joined",    value: since },
                ].map(({ label, value }) => (
                  <div key={label} style={S.statRow}>
                    <span style={S.statLabel}>{label}</span>
                    <span style={S.statValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "#0d0d0d", color: "#e0e0e0", fontFamily: "'Syne', sans-serif" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" },
  spinner: { width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.05)", borderTopColor: "#e94560", animation: "spin 0.7s linear infinite" },
  backBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 18px", color: "#888", cursor: "pointer", fontFamily: "'Syne', sans-serif" },

  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,13,13,0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50 },
  navBack: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", color: "#888", cursor: "pointer", transition: "background 0.2s" },
  navBrand: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "0.12em", color: "#e0e0e0" },

  main: { maxWidth: 860, margin: "0 auto", padding: "32px 24px", animation: "fadeUp 0.35s ease both" },

  card: { position: "relative", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 28px 24px", marginBottom: 24, overflow: "hidden" },
  gradientBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #e94560, #b347ea, #00d4ff)", borderRadius: "16px 16px 0 0" },

  headerRow: { display: "flex", alignItems: "flex-start", gap: 22, flexWrap: "wrap", marginTop: 6 },
  avatarRing: { width: 84, height: 84, flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #e94560, #b347ea)", padding: 3, display: "flex", alignItems: "center", justifyContent: "center" },
  avatarInner: { width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(22px, 3vw, 30px)", margin: "0 0 8px", color: "#f0f0f0", letterSpacing: "-0.01em" },
  rolesRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  since: { fontFamily: "'DM Mono', monospace", fontSize: 11, margin: 0 },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 },
  panel: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", animation: "fadeUp 0.4s ease both" },
  panelTitle: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" },

  tag: { fontFamily: "'DM Mono', monospace", fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#a0a0a0" },

  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  statLabel: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#555" },
  statValue: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#888" },
};
