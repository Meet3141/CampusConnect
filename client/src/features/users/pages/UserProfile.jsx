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
import { useSyneFont } from "../../auth/hooks";
import { TechStackBadges } from "../techStack.jsx";
import { normalizeTechStack } from "../techStackUtils";

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

  useSyneFont();

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
  return (
    <>
      <style>{`
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

            {/* Working Stack */}
            <div style={S.panel}>
              <h3 style={S.panelTitle}>Working Stack</h3>
              <TechStackBadges
                items={profile.techStack}
                emptyText="No technologies listed."
                chipStyle={S.techChip}
                iconWrapStyle={S.techIconWrap}
                labelStyle={S.techLabel}
                emptyStyle={S.emptyText}
              />
            </div>

            {/* Social Links */}
            <div style={S.panel}>
              <h3 style={S.panelTitle}>Social Links</h3>
              <PublicSocialLinks links={profile.socialLinks} />
            </div>

            {/* Account snapshot */}
            <div style={S.panel}>
              <h3 style={S.panelTitle}>Account</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "User ID",   value: (profile._id || "").slice(-8).toUpperCase() },
                  { label: "Roles",     value: (profile.roles || []).join(", ") },
                  { label: "Interests", value: `${(profile.interests || []).length} topics` },
                  { label: "Technologies", value: `${normalizeTechStack(profile.techStack).length} items` },
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

// ── Inline social icon SVGs (self-contained so UserProfile has no cross-feature imports) ──
function GHIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z"/></svg>;
}
function IGIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
}
function LIIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
}
function WWIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}

const PUB_SOCIAL = [
  { key: "github",    label: "GitHub",    Icon: GHIcon, color: "#e0e0e0", hoverBg: "rgba(224,224,224,0.08)" },
  { key: "instagram", label: "Instagram", Icon: IGIcon, color: "#e1306c", hoverBg: "rgba(225,48,108,0.1)"   },
  { key: "linkedin",  label: "LinkedIn",  Icon: LIIcon, color: "#0a66c2", hoverBg: "rgba(10,102,194,0.12)"  },
  { key: "website",   label: "Website",   Icon: WWIcon, color: "#00d4ff", hoverBg: "rgba(0,212,255,0.1)"    },
];

function PublicSocialLinks({ links }) {
  const filled = PUB_SOCIAL.filter(s => links?.[s.key]);
  if (!filled.length) {
    return <p style={{ color: "#444", fontSize: 13, fontStyle: "italic", fontFamily: "'DM Mono', monospace" }}>No social links shared.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {filled.map((social) => {
        const SocialIcon = social.Icon;
        const raw = links[social.key];
        const href = raw.startsWith("http") ? raw : `https://${raw}`;
        return (
          <a
            key={social.key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 8, textDecoration: "none", color: social.color, transition: "background 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = social.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}><SocialIcon /></span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#555", width: 70, flexShrink: 0 }}>{social.label}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: social.color }}>{raw}</span>
          </a>
        );
      })}
    </div>
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

  main: { maxWidth: 1160, margin: "0 auto", padding: "32px 24px", animation: "fadeUp 0.35s ease both" },

  card: { position: "relative", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 28px 24px", marginBottom: 24, overflow: "hidden" },
  gradientBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #e94560, #b347ea, #00d4ff)", borderRadius: "16px 16px 0 0" },

  headerRow: { display: "flex", alignItems: "flex-start", gap: 22, flexWrap: "wrap", marginTop: 6 },
  avatarRing: { width: 84, height: 84, flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #e94560, #b347ea)", padding: 3, display: "flex", alignItems: "center", justifyContent: "center" },
  avatarInner: { width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(22px, 3vw, 30px)", margin: "0 0 8px", color: "#f0f0f0", letterSpacing: "-0.01em" },
  rolesRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  since: { fontFamily: "'DM Mono', monospace", fontSize: 11, margin: 0 },

  grid: { columnWidth: 330, columnGap: 20 },
  panel: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", display: "inline-block", width: "100%", marginBottom: 20, breakInside: "avoid", pageBreakInside: "avoid", verticalAlign: "top", animation: "fadeUp 0.4s ease both" },
  panelTitle: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" },

  tag: { fontFamily: "'DM Mono', monospace", fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#a0a0a0" },

  emptyText: { color: "#444", fontSize: 13, fontStyle: "italic", fontFamily: "'DM Mono', monospace", margin: 0 },
  techChip: { display: "inline-flex", alignItems: "center", gap: 8, maxWidth: "100%", fontFamily: "'DM Mono', monospace", fontSize: 12, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d0d0d0" },
  techIconWrap: { width: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "#00d4ff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  techLabel: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  statLabel: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#555" },
  statValue: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#888" },
};
