import express from "express";
import { getProfile, updateProfile, updateRoles, getPublicProfile } from "../controllers/userController.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/roleCheck.js";

const router = express.Router();

// All /api/users routes require authentication
router.use(auth);

router.get("/profile",  getProfile);
router.patch("/profile", updateProfile);

// S5.C4 — orgAdmin can update any user's roles; triggers session invalidation
router.patch("/:id/roles", authorize("orgAdmin"), updateRoles);

// Public profile view by ID — safe fields only, requires auth
router.get("/:id", getPublicProfile);

export default router;
