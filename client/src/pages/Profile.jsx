import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ─── 12 Geometric SVG Avatars ────────────────────────────────────────────────
const AVATARS = {
  avatar_1: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#1a1a2e" />
      <polygon points="40,10 70,65 10,65" fill="#e94560" opacity="0.9" />
      <circle cx="40" cy="40" r="12" fill="#0f3460" />
    </svg>
  ),
  avatar_2: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#0d0d0d" />
      <rect x="15" y="15" width="50" height="50" rx="8" fill="#f5a623" opacity="0.85" />
      <circle cx="40" cy="40" r="14" fill="#0d0d0d" />
      <circle cx="40" cy="40" r="6" fill="#f5a623" />
    </svg>
  ),
  avatar_3: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#0a1628" />
      <circle cx="40" cy="40" r="28" fill="none" stroke="#00d4ff" strokeWidth="4" />
      <circle cx="40" cy="40" r="18" fill="none" stroke="#00d4ff" strokeWidth="2" opacity="0.5" />
      <circle cx="40" cy="40" r="8" fill="#00d4ff" />
    </svg>
  ),
  avatar_4: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#1a0a2e" />
      <polygon points="40,8 74,62 6,62" fill="none" stroke="#b347ea" strokeWidth="3" />
      <polygon points="40,20 64,58 16,58" fill="#b347ea" opacity="0.4" />
      <circle cx="40" cy="40" r="8" fill="#b347ea" />
    </svg>
  ),
  avatar_5: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#0a2010" />
      <rect x="20" y="20" width="40" height="40" fill="none" stroke="#39d353" strokeWidth="3" transform="rotate(45 40 40)" />
      <rect x="28" y="28" width="24" height="24" fill="#39d353" opacity="0.3" transform="rotate(45 40 40)" />
      <circle cx="40" cy="40" r="7" fill="#39d353" />
    </svg>
  ),
  avatar_6: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#1a0a00" />
      <circle cx="40" cy="30" r="16" fill="#ff6b35" opacity="0.9" />
      <ellipse cx="40" cy="58" rx="20" ry="10" fill="#ff6b35" opacity="0.6" />
    </svg>
  ),
  avatar_7: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#0d1117" />
      <line x1="40" y1="5" x2="40" y2="75" stroke="#58a6ff" strokeWidth="2" />
      <line x1="5" y1="40" x2="75" y2="40" stroke="#58a6ff" strokeWidth="2" />
      <line x1="12" y1="12" x2="68" y2="68" stroke="#58a6ff" strokeWidth="2" />
      <line x1="68" y1="12" x2="12" y2="68" stroke="#58a6ff" strokeWidth="2" />
      <circle cx="40" cy="40" r="10" fill="#58a6ff" />
    </svg>
  ),
  avatar_8: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#16001e" />
      <path d="M40 10 L55 30 L75 35 L60 52 L63 72 L40 62 L17 72 L20 52 L5 35 L25 30 Z" fill="#ff47a3" opacity="0.8" />
      <circle cx="40" cy="40" r="9" fill="#16001e" />
    </svg>
  ),
  avatar_9: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#001a1a" />
      <rect x="12" y="12" width="56" height="56" rx="28" fill="none" stroke="#00ffcc" strokeWidth="3" />
      <rect x="22" y="22" width="36" height="36" rx="4" fill="#00ffcc" opacity="0.15" />
      <text x="40" y="46" textAnchor="middle" fontSize="20" fill="#00ffcc" fontFamily="monospace">{'</>'}</text>
    </svg>
  ),
  avatar_10: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#1a1000" />
      <polygon points="40,12 68,28 68,52 40,68 12,52 12,28" fill="none" stroke="#ffd700" strokeWidth="3" />
      <polygon points="40,22 58,32 58,48 40,58 22,48 22,32" fill="#ffd700" opacity="0.25" />
      <circle cx="40" cy="40" r="8" fill="#ffd700" />
    </svg>
  ),
  avatar_11: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#0a0a1a" />
      <circle cx="26" cy="35" r="10" fill="#4fc3f7" opacity="0.8" />
      <circle cx="54" cy="35" r="10" fill="#f48fb1" opacity="0.8" />
      <circle cx="40" cy="52" r="10" fill="#a5d6a7" opacity="0.8" />
    </svg>
  ),
  avatar_12: (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#100010" />
      <path d="M40 15 Q65 40 40 65 Q15 40 40 15Z" fill="#e040fb" opacity="0.7" />
      <path d="M15 40 Q40 15 65 40 Q40 65 15 40Z" fill="#7c4dff" opacity="0.7" />
      <circle cx="40" cy="40" r="8" fill="#100010" />
    </svg>
  ),
};

const ROLE_COLORS = {
  member: { bg: "rgba(88, 166, 255, 0.15)", color: "#58a6ff", border: "rgba(88,166,255,0.3)" },
  clubAdmin: { bg: "rgba(255,167,38, 0.15)", color: "#ffa726", border: "rgba(255,167,38,0.3)" },
  editor: { bg: "rgba(102,187,106, 0.15)", color: "#66bb6a", border: "rgba(102,187,106,0.3)" },
  orgAdmin: { bg: "rgba(229,57,53, 0.15)", color: "#e53935", border: "rgba(229,57,53,0.3)" },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit form state
  const [form, setForm] = useState({ name: "", bio: "", phone: "", interests: [], avatar: "avatar_1" });
  const [interestInput, setInterestInput] = useState("");

  // ── Fetch profile ──
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/users/profile");
      setProfile(res.data.user);
      const u = res.data.user;
      setForm({
        name: u.name || "",
        bio: u.bio || "",
        phone: u.phone || "",
        interests: u.interests || [],
        avatar: u.profilePicture || "avatar_1",
      });
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Save ──
  const handleSave = async () => {
    setServerError("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const res = await api.patch("/users/profile", {
        name: form.name,
        bio: form.bio,
        phone: form.phone || null,
        interests: form.interests,
        avatar: form.avatar,
      });
      setProfile(res.data.user);
      setSuccessMsg("Profile saved!");
      setEditMode(false);
      setShowAvatarPicker(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setServerError(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const u = profile;
    setForm({ name: u.name || "", bio: u.bio || "", phone: u.phone || "", interests: u.interests || [], avatar: u.profilePicture || "avatar_1" });
    setEditMode(false);
    setShowAvatarPicker(false);
    setServerError("");
  };

  const addInterest = () => {
    const val = interestInput.trim().toLowerCase();
    if (val && !form.interests.includes(val) && form.interests.length < 15) {
      setForm(f => ({ ...f, interests: [...f.interests, val] }));
    }
    setInterestInput("");
  };

  const removeInterest = (tag) => setForm(f => ({ ...f, interests: f.interests.filter(i => i !== tag) }));

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.page}>
      <div style={S.loadWrap}>
        <div style={S.spinner} />
        <p style={{ color: "var(--cc-muted)", marginTop: 16, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>loading profile_</p>
      </div>
    </div>
  );

  const displayAvatar = editMode ? form.avatar : (profile?.profilePicture || "avatar_1");
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--cc-muted); border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .avatar-opt:hover { transform: scale(1.08); border-color: var(--cc-border-strong) !important; }
        .avatar-opt { transition: transform 0.18s ease, border-color 0.18s ease; }
        .tag-chip:hover .rm { opacity: 1 !important; }
        .nav-btn:hover { background: var(--cc-surface-hover) !important; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .action-btn { transition: opacity 0.2s, transform 0.2s; }
        .edit-input:focus { border-color: var(--cc-border-strong) !important; background: var(--cc-surface-hover) !important; outline: none; }
        .edit-input { transition: border-color 0.2s, background 0.2s; }
      `}</style>

      <div style={S.page}>
        {/* ── Top Nav ── */}
        <nav style={S.nav}>
          <button className="nav-btn" onClick={() => navigate("/dashboard")} style={S.navBack}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>dashboard</span>
          </button>
          <span style={S.navBrand}>CAMPUS<span style={{ color: "#e94560" }}>CONNECT</span></span>
          <button className="nav-btn" onClick={logout} style={S.navLogout}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>logout</span>
          </button>
        </nav>

        {/* ── Main card ── */}
        <main style={S.main}>

          {/* ─ Header strip ─ */}
          <div style={S.headerStrip}>
            <div style={S.gradientBar} />

            {/* Avatar section */}
            <div style={S.avatarSection}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <div style={S.avatarRing}>
                  <div style={S.avatarInner}>{AVATARS[displayAvatar]}</div>
                </div>
                {editMode && (
                  <button
                    onClick={() => setShowAvatarPicker(p => !p)}
                    style={S.avatarEditBtn}
                    title="Change avatar"
                  >✎</button>
                )}
              </div>

              {/* Avatar picker overlay */}
              {showAvatarPicker && (
                <div style={S.avatarPicker}>
                  <p style={S.pickerLabel}>choose avatar</p>
                  <div style={S.pickerGrid}>
                    {Object.keys(AVATARS).map(key => (
                      <div
                        key={key}
                        className="avatar-opt"
                        onClick={() => { setForm(f => ({ ...f, avatar: key })); setShowAvatarPicker(false); }}
                        style={{
                          ...S.pickerOption,
                          border: form.avatar === key ? "2px solid #e94560" : "2px solid var(--cc-border-soft)",
                        }}
                      >
                        {AVATARS[key]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Name & roles */}
            <div style={S.headerInfo}>
              {editMode ? (
                <input
                  className="edit-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={S.nameInput}
                  placeholder="Your name"
                  maxLength={50}
                />
              ) : (
                <h1 style={S.userName}>{profile?.name}</h1>
              )}

              <div style={S.rolesRow}>
                {profile?.roles?.map(role => (
                  <span key={role} style={{ ...S.roleChip, ...ROLE_COLORS[role] }}>
                    {role}
                  </span>
                ))}
              </div>

              <p style={S.memberSince}>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--cc-muted)", fontSize: 11 }}>member since </span>
                <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--cc-muted)", fontSize: 11 }}>{memberSince}</span>
              </p>
            </div>

            {/* Edit / Save buttons */}
            <div style={S.headerActions}>
              {!editMode ? (
                <button className="action-btn" onClick={() => setEditMode(true)} style={S.editBtn}>
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="action-btn" onClick={handleCancel} style={S.cancelBtn}>
                    Cancel
                  </button>
                  <button className="action-btn" onClick={handleSave} disabled={saving} style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─ Feedback banners ─ */}
          {serverError && <div style={S.errorBanner}>{serverError}</div>}
          {successMsg && <div style={S.successBanner}>{successMsg}</div>}

          {/* ─ Body grid ─ */}
          <div style={S.bodyGrid}>

            {/* Left column */}
            <div style={S.leftCol}>

              {/* Bio card */}
              <div style={S.card}>
                <h3 style={S.cardTitle}>Bio</h3>
                {editMode ? (
                  <>
                    <textarea
                      className="edit-input"
                      value={form.bio}
                      onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      style={S.bioTextarea}
                      placeholder="Tell your campus about yourself…"
                      maxLength={500}
                    />
                    <p style={S.charCount}>{form.bio.length}/500</p>
                  </>
                ) : (
                  <p style={S.bioText}>{profile?.bio || <span style={{ color: "var(--cc-muted)", fontStyle: "italic" }}>No bio yet.</span>}</p>
                )}
              </div>

              {/* Interests card */}
              <div style={S.card}>
                <h3 style={S.cardTitle}>Interests</h3>
                <div style={S.tagsWrap}>
                  {(editMode ? form.interests : profile?.interests || []).map(tag => (
                    <span key={tag} className="tag-chip" style={S.tagChip}>
                      {tag}
                      {editMode && (
                        <span className="rm" onClick={() => removeInterest(tag)} style={S.tagRemove}>×</span>
                      )}
                    </span>
                  ))}
                  {(editMode ? form.interests : profile?.interests || []).length === 0 && (
                    <span style={{ color: "var(--cc-muted)", fontStyle: "italic", fontSize: 13 }}>No interests added.</span>
                  )}
                </div>
                {editMode && (
                  <div style={S.tagInputRow}>
                    <input
                      className="edit-input"
                      value={interestInput}
                      onChange={e => setInterestInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addInterest()}
                      style={S.tagInput}
                      placeholder="Add interest & press Enter"
                      maxLength={30}
                    />
                    <button onClick={addInterest} style={S.addTagBtn}>+</button>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div style={S.rightCol}>

              {/* Contact card */}
              <div style={S.card}>
                <h3 style={S.cardTitle}>Contact & Details</h3>
                <div style={S.detailsGrid}>
                  <DetailRow
                    icon="✉"
                    label="email"
                    value={profile?.email}
                    editMode={false}
                  />
                  <DetailRow
                    icon="☏"
                    label="phone"
                    value={editMode ? form.phone : profile?.phone}
                    editMode={editMode}
                    placeholder="+91 98765 43210"
                    onChange={v => setForm(f => ({ ...f, phone: v }))}
                  />
                  <DetailRow
                    icon="◉"
                    label="verified"
                    value={profile?.isVerified ? "Verified ✓" : "Not verified"}
                    editMode={false}
                    valueStyle={{ color: profile?.isVerified ? "#66bb6a" : "var(--cc-muted)" }}
                  />
                  <DetailRow
                    icon="⬡"
                    label="clubs joined"
                    value={profile?.joinedClubs?.length || 0}
                    editMode={false}
                  />
                </div>
              </div>

              {/* Stats card */}
              <div style={S.card}>
                <h3 style={S.cardTitle}>Account</h3>
                <div style={S.statsList}>
                  {[
                    { label: "User ID", value: profile?._id?.slice(-8).toUpperCase() },
                    { label: "Roles", value: profile?.roles?.join(", ") },
                    { label: "Interests", value: `${profile?.interests?.length || 0} topics` },
                  ].map(({ label, value }) => (
                    <div key={label} style={S.statRow}>
                      <span style={S.statLabel}>{label}</span>
                      <span style={S.statValue}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ── Small reusable detail row ─────────────────────────────────────────────────
function DetailRow({ icon, label, value, editMode, placeholder, onChange, valueStyle = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--cc-border-soft)" }}>
      <span style={{ fontSize: 16, width: 22, textAlign: "center", color: "var(--cc-muted)" }}>{icon}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--cc-muted)", width: 70, flexShrink: 0 }}>{label}</span>
      {editMode ? (
        <input
          className="edit-input"
          defaultValue={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, background: "var(--cc-surface-weak)", border: "1px solid var(--cc-border-strong)",
            borderRadius: 6, color: "var(--cc-text)", padding: "5px 10px", fontSize: 13,
            fontFamily: "'DM Mono', monospace",
          }}
        />
      ) : (
        <span style={{ fontSize: 13, color: "var(--cc-text)", fontFamily: "'DM Mono', monospace", ...valueStyle }}>
          {value || <span style={{ color: "var(--cc-muted)" }}>—</span>}
        </span>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "var(--cc-bg)",
    color: "var(--cc-text)",
    fontFamily: "'Syne', sans-serif",
  },
  loadWrap: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    minHeight: "100vh",
  },
  spinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "2px solid var(--cc-border-soft)",
    borderTopColor: "#e94560",
    animation: "spin 0.7s linear infinite",
  },

  // Nav
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 32px", height: 56,
    borderBottom: "1px solid var(--cc-border-soft)",
    background: "var(--cc-surface-overlay)",
    backdropFilter: "blur(10px)",
    position: "sticky", top: 0, zIndex: 50,
  },
  navBack: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--cc-surface-weak)", border: "1px solid var(--cc-border-soft)",
    borderRadius: 8, padding: "6px 14px", color: "var(--cc-muted)", cursor: "pointer",
  },
  navBrand: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15,
    letterSpacing: "0.12em", color: "var(--cc-text)",
  },
  navLogout: {
    background: "transparent", border: "1px solid rgba(233,69,96,0.3)",
    borderRadius: 8, padding: "6px 14px", color: "#e94560", cursor: "pointer",
  },

  // Main
  main: {
    maxWidth: 900, margin: "0 auto", padding: "32px 24px",
    animation: "fadeUp 0.4s ease both",
  },

  // Header strip
  headerStrip: {
    position: "relative",
    background: "var(--cc-surface-weak)",
    border: "1px solid var(--cc-border-soft)",
    borderRadius: 16, padding: "28px 28px 24px",
    display: "flex", alignItems: "flex-start", gap: 24,
    flexWrap: "wrap",
    marginBottom: 24, overflow: "hidden",
  },
  gradientBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    background: "linear-gradient(90deg, #e94560, #b347ea, #00d4ff)",
    borderRadius: "16px 16px 0 0",
  },
  avatarSection: { position: "relative", flexShrink: 0 },
  avatarRing: {
    width: 88, height: 88, borderRadius: "50%",
    background: "linear-gradient(135deg, #e94560, #b347ea)",
    padding: 3, display: "flex", alignItems: "center", justifyContent: "center",
  },
  avatarInner: {
    width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--cc-bg)",
  },
  avatarEditBtn: {
    position: "absolute", bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: "50%",
    background: "#e94560", border: "2px solid var(--cc-bg)",
    color: "#fff", fontSize: 13, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "sans-serif",
  },

  // Avatar picker
  avatarPicker: {
    position: "absolute", top: 100, left: 0, zIndex: 100,
    background: "var(--cc-surface)", border: "1px solid var(--cc-border-strong)",
    borderRadius: 14, padding: "16px 16px 12px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
    width: 260,
    animation: "fadeUp 0.2s ease both",
  },
  pickerLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--cc-muted)",
    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12,
  },
  pickerGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
  },
  pickerOption: {
    width: 52, height: 52, borderRadius: 10, overflow: "hidden",
    cursor: "pointer", padding: 4, background: "var(--cc-bg)",
  },

  headerInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: "clamp(22px, 3vw, 30px)", margin: "0 0 8px",
    color: "var(--cc-text)", letterSpacing: "-0.01em",
  },
  nameInput: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26,
    background: "var(--cc-surface-weak)", border: "1px solid var(--cc-border-strong)",
    borderRadius: 8, color: "var(--cc-text)", padding: "6px 12px",
    width: "100%", marginBottom: 8,
  },
  rolesRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  roleChip: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    padding: "3px 10px", borderRadius: 6,
    border: "1px solid",
    letterSpacing: "0.05em",
  },
  memberSince: { margin: 0 },

  headerActions: { display: "flex", alignItems: "flex-start", paddingTop: 4 },
  editBtn: {
    background: "rgba(233,69,96,0.12)", border: "1px solid rgba(233,69,96,0.4)",
    color: "#e94560", borderRadius: 10, padding: "9px 22px",
    fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  saveBtn: {
    background: "#e94560", border: "none", color: "#fff",
    borderRadius: 10, padding: "9px 22px",
    fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  cancelBtn: {
    background: "transparent", border: "1px solid var(--cc-border-strong)",
    color: "var(--cc-muted)", borderRadius: 10, padding: "9px 18px",
    fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },

  // Banners
  errorBanner: {
    background: "rgba(233,69,96,0.1)", border: "1px solid rgba(233,69,96,0.3)",
    color: "#e94560", borderRadius: 10, padding: "12px 18px",
    fontFamily: "'DM Mono', monospace", fontSize: 13, marginBottom: 20,
  },
  successBanner: {
    background: "rgba(102,187,106,0.1)", border: "1px solid rgba(102,187,106,0.3)",
    color: "#66bb6a", borderRadius: 10, padding: "12px 18px",
    fontFamily: "'DM Mono', monospace", fontSize: 13, marginBottom: 20,
  },

  // Body grid
  bodyGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
  },
  leftCol: { display: "flex", flexDirection: "column", gap: 20 },
  rightCol: { display: "flex", flexDirection: "column", gap: 20 },

  // Card
  card: {
    background: "var(--cc-surface-weak)", border: "1px solid var(--cc-border-soft)",
    borderRadius: 14, padding: "20px 22px",
    animation: "fadeUp 0.4s ease both",
  },
  cardTitle: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--cc-muted)",
    textTransform: "uppercase", letterSpacing: "0.12em",
    margin: "0 0 14px", paddingBottom: 10,
    borderBottom: "1px solid var(--cc-border-soft)",
  },

  // Bio
  bioText: { color: "var(--cc-muted)", fontSize: 14, lineHeight: 1.7, margin: 0 },
  bioTextarea: {
    width: "100%", minHeight: 100, resize: "vertical",
    background: "var(--cc-surface-weak)", border: "1px solid var(--cc-border-strong)",
    borderRadius: 8, color: "var(--cc-text)", padding: "10px 12px",
    fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Mono', monospace",
  },
  charCount: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--cc-muted)", margin: "4px 0 0", textAlign: "right" },

  // Tags
  tagsWrap: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 0 },
  tagChip: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "var(--cc-surface-hover)", border: "1px solid var(--cc-border-soft)",
    borderRadius: 6, padding: "4px 10px",
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--cc-muted)",
    position: "relative",
  },
  tagRemove: {
    cursor: "pointer", color: "#e94560", fontSize: 15, lineHeight: 1,
    opacity: 0, transition: "opacity 0.15s", fontWeight: 700,
  },
  tagInputRow: { display: "flex", gap: 8, marginTop: 12 },
  tagInput: {
    flex: 1, background: "var(--cc-surface-weak)", border: "1px solid var(--cc-border-strong)",
    borderRadius: 8, color: "var(--cc-text)", padding: "7px 12px",
    fontFamily: "'DM Mono', monospace", fontSize: 12,
  },
  addTagBtn: {
    background: "rgba(233,69,96,0.15)", border: "1px solid rgba(233,69,96,0.3)",
    color: "#e94560", borderRadius: 8, width: 36, fontSize: 20,
    cursor: "pointer", fontWeight: 300,
  },

  // Details
  detailsGrid: { display: "flex", flexDirection: "column" },

  // Stats
  statsList: { display: "flex", flexDirection: "column", gap: 0 },
  statRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0", borderBottom: "1px solid var(--cc-border-soft)",
  },
  statLabel: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--cc-muted)" },
  statValue: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--cc-muted)" },
};
