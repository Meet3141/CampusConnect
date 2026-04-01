import express from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import auth from "../middleware/auth.js"; // default export — NOT named { auth }

const router = express.Router();

// All /api/users routes require authentication
router.use(auth);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

export default router;
