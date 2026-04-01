import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/User.js";

// @desc    Get current user's profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("joinedClubs", "name category coverImage");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    user,
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
  ).populate("joinedClubs", "name category coverImage");

  if (!updatedUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});
