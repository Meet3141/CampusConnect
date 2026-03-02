import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import auth from "../middleware/auth.js";
import {
  createChat,
  getChatById,
  getMyChats,
  joinChat,
  leaveChat,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/", auth, asyncHandler(createChat));
router.get("/", auth, asyncHandler(getMyChats));
router.get("/:id", auth, asyncHandler(getChatById));
router.post("/:id/join", auth, asyncHandler(joinChat));
router.post("/:id/leave", auth, asyncHandler(leaveChat));

export default router;
