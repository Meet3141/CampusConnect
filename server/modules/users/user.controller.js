/**
 * modules/users/user.controller.js
 * HTTP layer for user profile and role management.
 */
import * as UserService from "./user.service.js";

export const getProfile = async (req, res) => {
  const result = await UserService.getProfile(req.user.id);
  res.status(200).json({ success: true, ...result });
};

export const updateProfile = async (req, res) => {
  const result = await UserService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, message: "Profile updated successfully", ...result });
};

export const updateRoles = async (req, res) => {
  const result = await UserService.updateRoles(req.params.id, req.body.roles);
  res.status(200).json({ success: true, message: "Roles updated. User sessions have been invalidated.", ...result });
};

export const getPublicProfile = async (req, res) => {
  const user = await UserService.getPublicProfile(req.params.id);
  res.status(200).json({ success: true, user });
};
