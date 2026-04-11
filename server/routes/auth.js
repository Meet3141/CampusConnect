import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  refreshToken,
  verify,
} from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ── Rate limiter: max 10 requests per 15 min per IP ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts from this IP, please try again in 15 minutes.",
  },
});

router.post("/register",      authLimiter, register);
router.post("/login",         authLimiter, login);
router.post("/logout",        logout);
router.post("/refresh-token", refreshToken);
router.get("/verify",         auth, verify);

export default router;
