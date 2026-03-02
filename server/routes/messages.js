import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import auth from "../middleware/auth.js";
import {
  deleteMessage,
  editMessage,
  getMessagesByChat,
  reactToMessage,
  sendMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/chat/:chatId", auth, asyncHandler(getMessagesByChat));
router.post("/chat/:chatId", auth, asyncHandler(sendMessage));
router.put("/:id", auth, asyncHandler(editMessage));
router.delete("/:id", auth, asyncHandler(deleteMessage));
router.post("/:id/reactions", auth, asyncHandler(reactToMessage));

export default router;
