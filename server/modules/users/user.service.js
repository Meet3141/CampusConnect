/**
 * modules/users/user.service.js
 * Business logic for user profiles and role management.
 */
import User from "./user.model.js";
import Membership from "../clubs/membership.model.js";
import RefreshToken from "../auth/refresh-token.model.js";

const getJoinedClubs = (userId) =>
  Membership.find({ userId, status: "approved" })
    .select("clubId")
    .populate("clubId", "name category coverImage")
    .then((rows) => rows.map((m) => m.clubId).filter(Boolean));

const ICONIFY_ICON_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:[-_.][a-z0-9]+)*$/i;
const TECH_SYNONYMS = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  node: "nodejs",
  nodejs: "nodejs",
  react: "react",
  reactjs: "react",
  vue: "vue",
  vuejs: "vue",
  next: "nextjs",
  nextjs: "nextjs",
  nuxt: "nuxtjs",
  nuxtjs: "nuxtjs",
  express: "expressjs",
  expressjs: "expressjs",
  nest: "nestjs",
  nestjs: "nestjs",
  mongo: "mongodb",
  mongodb: "mongodb",
  postgres: "postgresql",
  postgresql: "postgresql",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  html: "html5",
  html5: "html5",
  css: "css3",
  css3: "css3",
  cpp: "cplusplus",
  cplusplus: "cplusplus",
  csharp: "csharp",
};

const normalizeTechKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/#/g, "sharp")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "");

const getTechAliasKey = (value) => {
  const key = normalizeTechKey(value);
  return TECH_SYNONYMS[key] || key;
};

const normalizeTechStack = (techStack) => {
  if (!Array.isArray(techStack)) {
    const err = new Error("techStack must be an array");
    err.statusCode = 400;
    throw err;
  }

  const seen = new Set();
  const cleaned = [];

  for (const item of techStack) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      const err = new Error("Each techStack item must be an object");
      err.statusCode = 400;
      throw err;
    }

    if (typeof item.label !== "string") {
      const err = new Error("techStack.label must be a string");
      err.statusCode = 400;
      throw err;
    }

    const label = item.label.trim();
    if (!label) continue;
    if (label.length > 40) {
      const err = new Error("techStack.label cannot exceed 40 characters");
      err.statusCode = 400;
      throw err;
    }

    const key = getTechAliasKey(label);
    if (seen.has(key)) continue;

    let icon = null;
    if (item.icon !== undefined && item.icon !== null) {
      if (typeof item.icon !== "string") {
        const err = new Error("techStack.icon must be a string or null");
        err.statusCode = 400;
        throw err;
      }

      icon = item.icon.trim() || null;
      if (icon && !ICONIFY_ICON_ID_PATTERN.test(icon)) {
        const err = new Error("techStack.icon must be a valid Iconify icon id");
        err.statusCode = 400;
        throw err;
      }
    }

    seen.add(key);
    cleaned.push({ label, icon });
    if (cleaned.length >= 20) break;
  }

  return cleaned;
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const joinedClubs = await getJoinedClubs(userId);
  return { user: { ...user.toJSON(), joinedClubs } };
};

export const updateProfile = async (userId, body) => {
  const { name, bio, phone, interests, techStack, avatar, socialLinks } = body;
  const updateFields = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      const err = new Error("Name must be at least 2 characters");
      err.statusCode = 400; throw err;
    }
    updateFields.name = name.trim();
  }
  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.length > 500) {
      const err = new Error("Bio cannot exceed 500 characters");
      err.statusCode = 400; throw err;
    }
    updateFields.bio = bio.trim();
  }
  if (phone !== undefined) {
    if (phone !== null && typeof phone !== "string") {
      const err = new Error("Invalid phone value");
      err.statusCode = 400; throw err;
    }
    updateFields.phone = phone;
  }
  if (interests !== undefined) {
    if (!Array.isArray(interests)) {
      const err = new Error("Interests must be an array");
      err.statusCode = 400; throw err;
    }
    updateFields.interests = [...new Set(interests.map((i) => String(i).trim().toLowerCase()))].slice(0, 15);
  }
  if (techStack !== undefined) {
    updateFields.techStack = normalizeTechStack(techStack);
  }
  if (avatar !== undefined) {
    const validAvatars = Array.from({ length: 12 }, (_, i) => `avatar_${i + 1}`);
    if (!validAvatars.includes(avatar)) {
      const err = new Error("Invalid avatar selection");
      err.statusCode = 400; throw err;
    }
    updateFields.profilePicture = avatar;
  }
  // ── Social links — validate each field is a string or null ──
  if (socialLinks !== undefined) {
    if (typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
      const err = new Error("socialLinks must be an object");
      err.statusCode = 400; throw err;
    }

    // Platform-specific URL patterns (mirrors client-side SOCIAL_VALIDATORS)
    const SOCIAL_PATTERNS = {
      github:    /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-][A-Za-z0-9_.-]*/i,
      instagram: /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+/i,
      linkedin:  /^https?:\/\/(www\.)?linkedin\.com\/(in|company|school|pub)\/[A-Za-z0-9_.-]+/i,
      website:   /^https?:\/\/[^\s.]+\.[^\s]{2,}/i,
    };

    const allowed = ["github", "instagram", "linkedin", "website"];
    for (const key of allowed) {
      const val = socialLinks[key];
      if (val !== undefined) {
        if (val !== null && (typeof val !== "string" || val.length > 200)) {
          const err = new Error(`socialLinks.${key} must be a string (max 200 chars) or null`);
          err.statusCode = 400; throw err;
        }
        // Validate URL belongs to the correct platform
        if (val && val.trim() && SOCIAL_PATTERNS[key] && !SOCIAL_PATTERNS[key].test(val.trim())) {
          const hints = {
            github:    "Must be a github.com URL (e.g. https://github.com/username)",
            instagram: "Must be an instagram.com URL (e.g. https://instagram.com/username)",
            linkedin:  "Must be a linkedin.com/in/ or /company/ URL",
            website:   "Must be a valid URL starting with http:// or https://",
          };
          const err = new Error(`Invalid ${key} URL: ${hints[key]}`);
          err.statusCode = 400; throw err;
        }
        updateFields[`socialLinks.${key}`] = val ? val.trim() : null;
      }
    }
  }

  if (Object.keys(updateFields).length === 0) {
    const err = new Error("No valid fields provided for update");
    err.statusCode = 400; throw err;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true, runValidators: true });
  if (!updatedUser) {
    const err = new Error("User not found"); err.statusCode = 404; throw err;
  }
  const joinedClubs = await getJoinedClubs(userId);
  return { user: { ...updatedUser.toJSON(), joinedClubs } };
};

export const updateRoles = async (targetId, roles) => {
  const VALID_ROLES = ["member", "clubAdmin", "editor", "orgAdmin"];
  if (!Array.isArray(roles) || roles.length === 0) {
    const err = new Error("roles must be a non-empty array"); err.statusCode = 400; throw err;
  }
  const invalid = roles.filter((r) => !VALID_ROLES.includes(r));
  if (invalid.length > 0) {
    const err = new Error(`Invalid role(s): ${invalid.join(", ")}`); err.statusCode = 400; throw err;
  }
  const user = await User.findByIdAndUpdate(targetId, { $set: { roles } }, { new: true, runValidators: true });
  if (!user) {
    const err = new Error("User not found"); err.statusCode = 404; throw err;
  }
  // Invalidate all active sessions — force re-auth with new role payload
  await RefreshToken.deleteMany({ userId: targetId });
  return { user: user.toJSON() };
};

export const getPublicProfile = async (userId) => {
  const user = await User.findById(userId)
    .select("name email phone bio roles interests techStack profilePicture createdAt socialLinks")
    .lean();
  if (!user) {
    const err = new Error("User not found"); err.statusCode = 404; throw err;
  }
  const joinedClubs = await getJoinedClubs(userId);
  return { ...user, joinedClubs };
};
