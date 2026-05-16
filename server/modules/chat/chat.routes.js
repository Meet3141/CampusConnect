import express from "express";
import asyncHandler from "../../middleware/asyncHandler.js";
import auth from "../../middleware/auth.js";
import {
  createChat, getChatById, getMyChats, joinChat, leaveChat,
  getMessagesByChat, sendMessage, editMessage, deleteMessage, reactToMessage,
} from "./chat.controller.js";

// ── Chat routes: /api/chats ────────────────────────────────────────────────────
export const chatRouter = express.Router();

chatRouter.post("/",           auth, asyncHandler(createChat));
chatRouter.get("/",            auth, asyncHandler(getMyChats));
chatRouter.get("/:id",         auth, asyncHandler(getChatById));
chatRouter.post("/:id/join",   auth, asyncHandler(joinChat));
chatRouter.post("/:id/leave",  auth, asyncHandler(leaveChat));

// ── Message routes: /api/messages ─────────────────────────────────────────────
export const messageRouter = express.Router();

messageRouter.get("/chat/:chatId",        auth, asyncHandler(getMessagesByChat));
messageRouter.post("/chat/:chatId",       auth, asyncHandler(sendMessage));
messageRouter.put("/:id",                 auth, asyncHandler(editMessage));
messageRouter.delete("/:id",              auth, asyncHandler(deleteMessage));
messageRouter.post("/:id/reactions",      auth, asyncHandler(reactToMessage));
