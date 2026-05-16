/**
 * modules/auth/auth.service.js
 * Business logic for authentication: register, login, logout, token rotation.
 */
import jwt from "jsonwebtoken";
import User from "../users/user.model.js";
import RefreshToken from "./refresh-token.model.js";
import generateToken from "../../utils/generateToken.js";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

export const setCookies = (res, accessToken, refreshTokenString) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", accessToken, {
    httpOnly: true, secure: isProd, sameSite: isProd ? "Strict" : "Lax", maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshTokenString, {
    httpOnly: true, secure: isProd, sameSite: isProd ? "Strict" : "Lax",
    maxAge: REFRESH_TTL_MS, path: "/api/auth/refresh-token",
  });
};

export const clearCookies = (res) => {
  res.clearCookie("token");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh-token" });
};

export const issueRefreshToken = async (userId) => {
  const tokenString = RefreshToken.generateTokenString();
  await RefreshToken.create({ token: tokenString, userId, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });
  return tokenString;
};

export const register = async (body) => {
  const { name, email, password } = body || {};
  if (!name || !email || !password) {
    const err = new Error("Name, email, and password are required"); err.statusCode = 400; throw err;
  }
  if (!PWD_REGEX.test(password)) {
    const err = new Error("Password must be 8+ characters with uppercase, lowercase, and number");
    err.statusCode = 400; throw err;
  }
  const exists = await User.findOne({ email });
  if (exists) { const err = new Error("User already exists"); err.statusCode = 409; throw err; }

  const user = await User.create({ name, email, password, roles: ["member"] });
  const accessToken = generateToken(user);
  const refreshTokenString = await issueRefreshToken(user._id);
  return { user, accessToken, refreshTokenString };
};

export const login = async (body) => {
  const { email, password } = body || {};
  if (!email || !password) {
    const err = new Error("Email and password are required"); err.statusCode = 400; throw err;
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error("Invalid credentials"); err.statusCode = 401; throw err;
  }
  const accessToken = generateToken(user);
  const refreshTokenString = await issueRefreshToken(user._id);
  return { user, accessToken, refreshTokenString };
};

export const logout = async (incomingRefreshToken) => {
  if (incomingRefreshToken) {
    await RefreshToken.findOneAndDelete({ token: incomingRefreshToken });
  }
};

export const verifyUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) { const err = new Error("User not found"); err.statusCode = 404; throw err; }
  return user;
};

export const rotateRefreshToken = async (incomingToken, res) => {
  if (!incomingToken) {
    const err = new Error("No refresh token provided"); err.statusCode = 401; throw err;
  }
  const storedToken = await RefreshToken.findOne({ token: incomingToken });
  if (!storedToken) {
    clearCookies(res);
    const err = new Error("Invalid or expired refresh token"); err.statusCode = 401; throw err;
  }
  if (storedToken.used) {
    await RefreshToken.deleteMany({ userId: storedToken.userId });
    clearCookies(res);
    const err = new Error("Refresh token reuse detected — all sessions invalidated"); err.statusCode = 401; throw err;
  }
  if (storedToken.expiresAt < new Date()) {
    await storedToken.deleteOne();
    clearCookies(res);
    const err = new Error("Refresh token expired"); err.statusCode = 401; throw err;
  }
  const user = await User.findById(storedToken.userId);
  if (!user) {
    await storedToken.deleteOne(); clearCookies(res);
    const err = new Error("User no longer exists"); err.statusCode = 401; throw err;
  }
  storedToken.used = true;
  await storedToken.save();
  const newAccessToken = generateToken(user);
  const newRefreshString = await issueRefreshToken(user._id);
  return { user, newAccessToken, newRefreshString };
};
