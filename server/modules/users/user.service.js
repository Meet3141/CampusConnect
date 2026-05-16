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
  const { name, bio, phone, interests, avatar } = body;
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
  if (avatar !== undefined) {
    const validAvatars = Array.from({ length: 12 }, (_, i) => `avatar_${i + 1}`);
    if (!validAvatars.includes(avatar)) {
      const err = new Error("Invalid avatar selection");
      err.statusCode = 400; throw err;
    }
    updateFields.profilePicture = avatar;
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
    .select("name bio roles interests profilePicture createdAt")
    .lean();
  if (!user) {
    const err = new Error("User not found"); err.statusCode = 404; throw err;
  }
  return user;
};
