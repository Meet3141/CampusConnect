import express from "express";
import auth from "../../middleware/auth.js";
import asyncHandler from "../../middleware/asyncHandler.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.controller.js";

const router = express.Router();

router.use(auth);

router.get("/", asyncHandler(getNotifications));
router.patch("/read-all", asyncHandler(markAllNotificationsRead));
router.patch("/:id/read", asyncHandler(markNotificationRead));

export default router;