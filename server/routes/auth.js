import express from "express";
import {
  register,
  login,
  refreshToken,
  verify,
} from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/verify", auth, verify);

export default router;
