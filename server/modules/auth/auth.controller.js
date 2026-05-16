/**
 * modules/auth/auth.controller.js
 * HTTP handlers for auth — thin layer, delegates to auth.service.js
 */
import * as AuthService from "./auth.service.js";

export const register = async (req, res) => {
  const { user, accessToken, refreshTokenString } = await AuthService.register(req.body);
  AuthService.setCookies(res, accessToken, refreshTokenString);
  res.status(201).json({ success: true, user: user.toJSON() });
};

export const login = async (req, res) => {
  const { user, accessToken, refreshTokenString } = await AuthService.login(req.body);
  AuthService.setCookies(res, accessToken, refreshTokenString);
  res.json({ success: true, user: user.toJSON() });
};

export const logout = async (req, res) => {
  await AuthService.logout(req.cookies?.refreshToken);
  AuthService.clearCookies(res);
  res.json({ success: true, message: "Logged out" });
};

export const verify = async (req, res) => {
  const user = await AuthService.verifyUser(req.user.id);
  res.json({ success: true, user: user.toJSON() });
};

export const refreshToken = async (req, res) => {
  const { user, newAccessToken, newRefreshString } = await AuthService.rotateRefreshToken(req.cookies?.refreshToken, res);
  AuthService.setCookies(res, newAccessToken, newRefreshString);
  res.json({ success: true, user: user.toJSON() });
};
