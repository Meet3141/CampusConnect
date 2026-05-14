import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import RefreshToken from "../models/RefreshToken.js";

// @desc    Get current user's profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const memberships = await Membership.find({ userId: req.user.id, status: "approved" })
    .populate("clubId", "name category coverImage")
    .lean();

  const joinedClubs = memberships
    .map((membership) => membership.clubId)
    .filter(Boolean);

  res.status(200).json({
    success: true,
    user: {
      ...user.toJSON(),
      joinedClubs,
    },
  });
});

// @desc    Update current user's profile
// @route   PATCH /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, phone, interests, avatar } = req.body;

  // Build update object — only include fields that were actually sent
  const updateFields = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      const error = new Error("Name must be at least 2 characters");
      error.statusCode = 400;
      throw error;
    }
    updateFields.name = name.trim();
  }

  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.length > 500) {
      const error = new Error("Bio cannot exceed 500 characters");
      error.statusCode = 400;
      throw error;
    }
    updateFields.bio = bio.trim();
  }

  if (phone !== undefined) {
    if (phone !== null && typeof phone !== "string") {
      const error = new Error("Invalid phone value");
      error.statusCode = 400;
      throw error;
    }
    updateFields.phone = phone;
  }

  if (interests !== undefined) {
    if (!Array.isArray(interests)) {
      const error = new Error("Interests must be an array");
      error.statusCode = 400;
      throw error;
    }
    // Sanitize — trim, lowercase, deduplicate, max 15
    const cleaned = [...new Set(interests.map((i) => String(i).trim().toLowerCase()))].slice(0, 15);
    updateFields.interests = cleaned;
  }

  if (avatar !== undefined) {
    // Avatar is stored as a key string like "avatar_1" … "avatar_12"
    const validAvatars = Array.from({ length: 12 }, (_, i) => `avatar_${i + 1}`);
    if (!validAvatars.includes(avatar)) {
      const error = new Error("Invalid avatar selection");
      error.statusCode = 400;
      throw error;
    }
    updateFields.profilePicture = avatar;
  }

  if (Object.keys(updateFields).length === 0) {
    const error = new Error("No valid fields provided for update");
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      ...updatedUser.toJSON(),
      joinedClubs: await Membership.find({ userId: req.user.id, status: "approved" })
        .populate("clubId", "name category coverImage")
        .then((rows) => rows.map((membership) => membership.clubId).filter(Boolean)),
    },
  });
});

// @desc    Update a user's roles  (orgAdmin only)
// @route   PATCH /api/users/:id/roles
// @access  Private — orgAdmin
export const updateRoles = asyncHandler(async (req, res) => {
  const VALID_ROLES = ["member", "clubAdmin", "editor", "orgAdmin"];
  const { roles } = req.body;

  if (!Array.isArray(roles) || roles.length === 0) {
    const error = new Error("roles must be a non-empty array");
    error.statusCode = 400;
    throw error;
  }

  const invalid = roles.filter((r) => !VALID_ROLES.includes(r));
  if (invalid.length > 0) {
    const error = new Error(`Invalid role(s): ${invalid.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { roles } },
    { new: true, runValidators: true }
  );

  if (!targetUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // S5.C4 — Invalidate all active sessions for this user so the next
  // request forces re-authentication with the updated role payload.
  await RefreshToken.deleteMany({ userId: req.params.id });

  res.status(200).json({
    success: true,
    message: "Roles updated. User sessions have been invalidated.",
    user: targetUser.toJSON(),
  });
});

// @desc    Get any user's public profile (read-only, safe subset of fields)
// @route   GET /api/users/:id
// @access  Private (requires auth — club admin use case)
export const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("name bio roles interests profilePicture createdAt")
    .lean();

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({ success: true, user });
});
