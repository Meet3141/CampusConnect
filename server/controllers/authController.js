import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../middleware/asyncHandler.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const setCookies = (res, accessToken, refreshTokenString) => {
  const isProd = process.env.NODE_ENV === "production";

  // Access token cookie — 15 min
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "Strict" : "Lax",
    maxAge: 15 * 60 * 1000,
  });

  // Refresh token cookie — 30 days
  res.cookie("refreshToken", refreshTokenString, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "Strict" : "Lax",
    maxAge: REFRESH_TTL_MS,
    path: "/api/auth/refresh-token",   // only sent to the refresh endpoint
  });
};

const clearCookies = (res) => {
  res.clearCookie("token");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh-token" });
};

const issueRefreshToken = async (userId) => {
  const tokenString = RefreshToken.generateTokenString();
  await RefreshToken.create({
    token: tokenString,
    userId,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return tokenString;
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    const error = new Error("Name, email, and password are required");
    error.statusCode = 400;
    throw error;
  }

  const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!pwdRegex.test(password)) {
    const error = new Error(
      "Password must be 8+ characters with uppercase, lowercase, and number"
    );
    error.statusCode = 400;
    throw error;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    const error = new Error("User already exists");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
    roles: ["member"],     // S1.C1 — hardcoded, never from req.body
  });

  const accessToken = generateToken(user);
  const refreshTokenString = await issueRefreshToken(user._id);
  setCookies(res, accessToken, refreshTokenString);

  res.status(201).json({
    success: true,
    user: user.toJSON(),
  });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  // +password needed only here for bcrypt comparison
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateToken(user);
  const refreshTokenString = await issueRefreshToken(user._id);
  setCookies(res, accessToken, refreshTokenString);

  res.json({
    success: true,
    user: user.toJSON(),    // password is stripped by toJSON()
  });
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (incomingRefreshToken) {
    // Invalidate the refresh token in DB
    await RefreshToken.findOneAndDelete({ token: incomingRefreshToken });
  }

  clearCookies(res);

  res.json({ success: true, message: "Logged out" });
});

// ─── VERIFY TOKEN ────────────────────────────────────────────────────────────
export const verify = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    user: user.toJSON(),
  });
});

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  // Read refresh token from HttpOnly cookie
  const incomingToken = req.cookies?.refreshToken;

  if (!incomingToken) {
    const error = new Error("No refresh token provided");
    error.statusCode = 401;
    throw error;
  }

  // Validate against the database
  const storedToken = await RefreshToken.findOne({ token: incomingToken });

  if (!storedToken) {
    clearCookies(res);
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }

  // Check if already used (potential token theft — revoke all user tokens)
  if (storedToken.used) {
    await RefreshToken.deleteMany({ userId: storedToken.userId });
    clearCookies(res);
    const error = new Error("Refresh token reuse detected — all sessions invalidated");
    error.statusCode = 401;
    throw error;
  }

  // Check TTL (belt-and-suspenders; TTL index handles DB cleanup)
  if (storedToken.expiresAt < new Date()) {
    await storedToken.deleteOne();
    clearCookies(res);
    const error = new Error("Refresh token expired");
    error.statusCode = 401;
    throw error;
  }

  // Verify the user still exists
  const user = await User.findById(storedToken.userId);
  if (!user) {
    await storedToken.deleteOne();
    clearCookies(res);
    const error = new Error("User no longer exists");
    error.statusCode = 401;
    throw error;
  }

  // ── ROTATION: mark old token used, issue new pair ──
  storedToken.used = true;
  await storedToken.save();

  const newAccessToken = generateToken(user);
  const newRefreshString = await issueRefreshToken(user._id);
  setCookies(res, newAccessToken, newRefreshString);

  res.json({ success: true, user: user.toJSON() });
});
