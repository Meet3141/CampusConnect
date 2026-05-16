import express from "express";
import auth from "../../middleware/auth.js";
import authorize from "../../middleware/roleCheck.js";
import { getProfile, updateProfile, updateRoles, getPublicProfile } from "./user.controller.js";

const router = express.Router();

router.use(auth);

router.get("/profile",  getProfile);
router.patch("/profile", updateProfile);
router.patch("/:id/roles", authorize("orgAdmin"), updateRoles);
router.get("/:id", getPublicProfile);

export default router;
