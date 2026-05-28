import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { fetchMyProfile, updateMyProfile } from "../api";
import { useSyneFont } from "../../auth/hooks";
import AchievementBadge, { BADGE_DEFINITIONS, deriveEarnedBadges } from "../../../components/ui/AchievementBadge";
import { TechStackBadges } from "../techStack.jsx";
import { MAX_TECH_STACK_ITEMS, getTechAliasKey, normalizeTechStack, resolveTechIcon } from "../techStackUtils";

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

const buildProfileForm = (u = {}) => ({
  name: u.name || "",
  bio: u.bio || "",
  phone: u.phone || "",
  interests: u.interests || [],
  techStack: normalizeTechStack(u.techStack),
  avatar: u.profilePicture || "avatar_1",
  socialLinks: {
    github:    u.socialLinks?.github    || "",
    instagram: u.socialLinks?.instagram || "",
    linkedin:  u.socialLinks?.linkedin  || "",
    website:   u.socialLinks?.website   || "",
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useSyneFont();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit form state
  const [form, setForm] = useState(() => buildProfileForm());
  const [interestInput, setInterestInput] = useState("");
  const [techInput, setTechInput] = useState("");
  const [techResolving, setTechResolving] = useState(false);
  const [socialErrors, setSocialErrors] = useState({ github: "", instagram: "", linkedin: "", website: "" });

  // ── Fetch profile ──
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetchMyProfile();
      setProfile(res.data.user);
      setForm(buildProfileForm(res.data.user));
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Save ──
  const handleSave = async () => {
    // Validate social links before sending
    const errs = {};
    Object.entries(form.socialLinks).forEach(([key, val]) => {
      if (val.trim()) errs[key] = validateSocialLink(key, val.trim());
    });
    setSocialErrors(prev => ({ ...prev, ...errs }));
    if (Object.values(errs).some(e => e)) {
      setServerError("Fix the social link errors below before saving.");
      return;
    }

    setServerError("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const res = await updateMyProfile({
        name: form.name,
        bio: form.bio,
        phone: form.phone || null,
        interests: form.interests,
        techStack: normalizeTechStack(form.techStack),
        avatar: form.avatar,
        socialLinks: {
          github:    form.socialLinks.github.trim()    || null,
          instagram: form.socialLinks.instagram.trim() || null,
          linkedin:  form.socialLinks.linkedin.trim()  || null,
          website:   form.socialLinks.website.trim()   || null,
        },
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
    setForm(buildProfileForm(profile));
    setTechInput("");
    setTechResolving(false);
    setSocialErrors({ github: "", instagram: "", linkedin: "", website: "" });
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

  const addTech = async () => {
    const label = techInput.trim();
    const currentStack = normalizeTechStack(form.techStack);
    const alreadyAdded = currentStack.some((item) => getTechAliasKey(item.label) === getTechAliasKey(label));

    if (!label || alreadyAdded || currentStack.length >= MAX_TECH_STACK_ITEMS || techResolving) {
      setTechInput("");
      return;
    }

    setTechResolving(true);
    const icon = await resolveTechIcon(label);
    setForm(f => ({ ...f, techStack: normalizeTechStack([...f.techStack, { label, icon }]) }));
    setTechInput("");
    setTechResolving(false);
  };

  const removeTech = (label) => {
    setForm(f => ({
      ...f,
      techStack: normalizeTechStack(f.techStack).filter((item) => getTechAliasKey(item.label) !== getTechAliasKey(label)),
    }));
  };

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

          {/* ─ Achievement Badge Shelf ─ */}
          {(() => {
            const earnedIds = deriveEarnedBadges({
              clubs: profile?.joinedClubs,
              attendedEvents: profile?.attendedEvents,
              bookmarks: profile?.bookmarks,
              chats: profile?.chats,
              volunteerEvents: profile?.volunteerEvents,
            });
            const allBadges = Object.values(BADGE_DEFINITIONS);
            return (
              <div style={{
                background: "var(--cc-surface-weak)",
                border: "1px solid var(--cc-border-soft)",
                borderRadius: 14,
                padding: "20px 22px",
                marginBottom: 20,
              }}>
                <h3 style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--cc-muted)",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  margin: "0 0 16px", paddingBottom: 10,
                  borderBottom: "1px solid var(--cc-border-soft)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  Achievements
                  <span style={{ fontSize: 10 }}>{earnedIds.length}/{allBadges.length} earned</span>
                </h3>
                <div style={{
                  display: "flex",
                  gap: 16,
                  overflowX: "auto",
                  paddingBottom: 4,
                  scrollbarWidth: "none",
                }}>
                  {allBadges.map((badge) => (
                    <AchievementBadge
                      key={badge.id}
                      badge={badge}
                      earned={earnedIds.includes(badge.id)}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ─ Body grid ─ */}
          <div style={S.bodyGrid}>

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

            {/* Working Stack card */}
            <div style={S.card}>
                <h3 style={S.cardTitle}>Working Stack</h3>
                <TechStackBadges
                  items={editMode ? form.techStack : profile?.techStack}
                  emptyText="No technologies added."
                  removable={editMode}
                  onRemove={removeTech}
                  chipStyle={S.techChip}
                  iconWrapStyle={S.techIconWrap}
                  labelStyle={S.techLabel}
                  removeStyle={S.techRemove}
                  emptyStyle={S.emptyText}
                />
                {editMode && (
                  <>
                    <div style={S.tagInputRow}>
                      <input
                        className="edit-input"
                        value={techInput}
                        onChange={e => setTechInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTech();
                          }
                        }}
                        style={S.tagInput}
                        placeholder="Add technology & press Enter"
                        maxLength={40}
                        disabled={techResolving || normalizeTechStack(form.techStack).length >= MAX_TECH_STACK_ITEMS}
                      />
                      <button
                        type="button"
                        onClick={addTech}
                        disabled={techResolving || normalizeTechStack(form.techStack).length >= MAX_TECH_STACK_ITEMS}
                        style={{
                          ...S.addTagBtn,
                          opacity: techResolving || normalizeTechStack(form.techStack).length >= MAX_TECH_STACK_ITEMS ? 0.55 : 1,
                        }}
                        title="Add technology"
                      >
                        {techResolving ? "..." : "+"}
                      </button>
                    </div>
                    <p style={S.techHint}>{normalizeTechStack(form.techStack).length}/{MAX_TECH_STACK_ITEMS} technologies</p>
                  </>
                )}
              </div>

              <div style={S.card}>
                <h3 style={S.cardTitle}>Social Links</h3>
                {editMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <SocialInput
                      icon={<GithubIcon />}
                      label="GitHub"
                      placeholder="https://github.com/username"
                      value={form.socialLinks.github}
                      onChange={v => { setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, github: v } })); setSocialErrors(e => ({ ...e, github: "" })); }}
                      onBlur={() => setSocialErrors(e => ({ ...e, github: validateSocialLink("github", form.socialLinks.github) }))}
                      error={socialErrors.github}
                    />
                    <SocialInput
                      icon={<InstagramIcon />}
                      label="Instagram"
                      placeholder="https://instagram.com/username"
                      value={form.socialLinks.instagram}
                      onChange={v => { setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, instagram: v } })); setSocialErrors(e => ({ ...e, instagram: "" })); }}
                      onBlur={() => setSocialErrors(e => ({ ...e, instagram: validateSocialLink("instagram", form.socialLinks.instagram) }))}
                      error={socialErrors.instagram}
                    />
                    <SocialInput
                      icon={<LinkedInIcon />}
                      label="LinkedIn"
                      placeholder="https://linkedin.com/in/username"
                      value={form.socialLinks.linkedin}
                      onChange={v => { setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, linkedin: v } })); setSocialErrors(e => ({ ...e, linkedin: "" })); }}
                      onBlur={() => setSocialErrors(e => ({ ...e, linkedin: validateSocialLink("linkedin", form.socialLinks.linkedin) }))}
                      error={socialErrors.linkedin}
                    />
                    <SocialInput
                      icon={<WebsiteIcon />}
                      label="Website"
                      placeholder="https://yoursite.com"
                      value={form.socialLinks.website}
                      onChange={v => { setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, website: v } })); setSocialErrors(e => ({ ...e, website: "" })); }}
                      onBlur={() => setSocialErrors(e => ({ ...e, website: validateSocialLink("website", form.socialLinks.website) }))}
                      error={socialErrors.website}
                    />
                  </div>
                ) : (
                  <SocialLinksView links={profile?.socialLinks} />
                )}
              </div>

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
                    { label: "Technologies", value: `${normalizeTechStack(profile?.techStack).length} items` },
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

// ── Social platform SVG icons ────────────────────────────────────────────────
function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function WebsiteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

// Colours keyed by platform
// ── Platform URL validators (client-side, mirrors backend) ──────────────────
const SOCIAL_VALIDATORS = {
  github: {
    pattern: /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-][A-Za-z0-9_.-]*/i,
    hint: "Must be a github.com URL — e.g. https://github.com/username",
  },
  instagram: {
    pattern: /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+/i,
    hint: "Must be an instagram.com URL — e.g. https://instagram.com/username",
  },
  linkedin: {
    pattern: /^https?:\/\/(www\.)?linkedin\.com\/(in|company|school|pub)\/[A-Za-z0-9_.-]+/i,
    hint: "Must be a linkedin.com/in/ or /company/ URL",
  },
  website: {
    pattern: /^https?:\/\/[^\s.]+\.[^\s]{2,}/i,
    hint: "Must be a valid URL starting with http:// or https://",
  },
};

/** Returns an error string if invalid, or "" if valid/empty. */
function validateSocialLink(key, value) {
  if (!value || !value.trim()) return ""; // empty is OK (clears the field)
  const v = SOCIAL_VALIDATORS[key];
  if (!v) return "";
  return v.pattern.test(value.trim()) ? "" : v.hint;
}

const SOCIAL_META = {
  github:    { label: "GitHub",    color: "#e0e0e0", hoverBg: "rgba(224,224,224,0.08)" },
  instagram: { label: "Instagram", color: "#e1306c", hoverBg: "rgba(225,48,108,0.1)"   },
  linkedin:  { label: "LinkedIn",  color: "#0a66c2", hoverBg: "rgba(10,102,194,0.12)"  },
  website:   { label: "Website",   color: "#00d4ff", hoverBg: "rgba(0,212,255,0.1)"    },
};

const SOCIAL_ICONS = { github: GithubIcon, instagram: InstagramIcon, linkedin: LinkedInIcon, website: WebsiteIcon };

// ── Edit-mode row for a single social link ──────────────────────────────────
function SocialInput({ icon, label, placeholder, value, onChange, onBlur, error }) {
  const hasError = Boolean(error);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: hasError ? "#e94560" : "var(--cc-muted)", flexShrink: 0, display: "flex", alignItems: "center", transition: "color 0.2s" }}>{icon}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--cc-muted)", width: 70, flexShrink: 0 }}>{label}</span>
        <input
          className="edit-input"
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "var(--cc-surface-weak)",
            border: `1px solid ${hasError ? "rgba(233,69,96,0.6)" : "var(--cc-border-strong)"}`,
            borderRadius: 6,
            color: "var(--cc-text)",
            padding: "5px 10px",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            transition: "border-color 0.2s",
          }}
        />
      </div>
      {hasError && (
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: "#e94560",
          margin: "0 0 0 106px",
          lineHeight: 1.4,
        }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

// ── Read-only social links display ──────────────────────────────────────────
function SocialLinksView({ links }) {
  const entries = Object.entries(SOCIAL_META).map(([key, meta]) => ({
    key, meta, value: links?.[key],
  }));
  const hasAny = entries.some(e => e.value);

  if (!hasAny) {
    return (
      <p style={{ color: "var(--cc-muted)", fontStyle: "italic", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
        No social links added yet.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {entries.map(({ key, meta, value }) => {
        const Icon = SOCIAL_ICONS[key];
        if (!value) return null;
        const href = value.startsWith("http") ? value : `https://${value}`;
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "9px 10px", borderRadius: 8, textDecoration: "none",
              color: meta.color, transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = meta.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}><Icon /></span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--cc-muted)", width: 70, flexShrink: 0 }}>{meta.label}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: meta.color }}>
              {value}
            </span>
          </a>
        );
      })}
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
    maxWidth: 1160, margin: "0 auto", padding: "32px 24px",
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
    columnWidth: 330,
    columnGap: 20,
  },

  // Card
  card: {
    background: "var(--cc-surface-weak)", border: "1px solid var(--cc-border-soft)",
    borderRadius: 14, padding: "20px 22px",
    display: "inline-block", width: "100%", marginBottom: 20,
    breakInside: "avoid", pageBreakInside: "avoid", verticalAlign: "top",
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
  emptyText: {
    color: "var(--cc-muted)", fontStyle: "italic", fontSize: 13,
    fontFamily: "'DM Mono', monospace", margin: 0,
  },
  techChip: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "var(--cc-surface-hover)", border: "1px solid var(--cc-border-soft)",
    borderRadius: 8, padding: "6px 10px",
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--cc-text)",
    maxWidth: "100%",
  },
  techIconWrap: {
    width: 20, height: 20, borderRadius: 6,
    background: "var(--cc-surface-weak)", color: "#00d4ff",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  techLabel: {
    minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  techRemove: {
    width: 18, height: 18, borderRadius: "50%",
    border: "1px solid rgba(233,69,96,0.25)",
    background: "rgba(233,69,96,0.08)", color: "#e94560",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0, flexShrink: 0,
  },
  techHint: {
    fontFamily: "'DM Mono', monospace", fontSize: 10,
    color: "var(--cc-muted)", margin: "8px 0 0", textAlign: "right",
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
