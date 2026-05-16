import express from "express";
import auth from "../../middleware/auth.js";
import asyncHandler from "../../middleware/asyncHandler.js";
import { register, login, logout, refreshToken, verify } from "./auth.controller.js";

// Note: rate limiting for /api/auth is applied at the index.js level.
// Do NOT add a second limiter here — it would double-stack the restrictions.
const router = express.Router();

router.post("/register",      asyncHandler(register));
router.post("/login",         asyncHandler(login));
router.post("/logout",        asyncHandler(logout));
router.post("/refresh-token", asyncHandler(refreshToken));
router.get("/verify",         auth, asyncHandler(verify));

export default router;
