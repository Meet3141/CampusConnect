/**
 * modules/chat/chat.controller.js + message.controller.js combined.
 * Exports both chat and message handlers from this file.
 */
import Chat from "./chat.model.js";
import Message from "./message.model.js";
import { createHttpError } from "../../utils/httpError.js";
import { ensureInEnum, ensureValidObjectId, requireFields } from "../../utils/validation.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

const parsePagination = (query, defaultLimit = 10, maxLimit = 50) => {
  const hasPage = query.page !== undefined;
  const hasLimit = query.limit !== undefined;
  if (!hasPage && !hasLimit) return null;
  const pageRaw = Number(query.page);
  const limitRaw = Number(query.limit);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limitBase = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : defaultLimit;
  const limit = Math.min(limitBase, maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

const ensureParticipant = (chat, userId) => {
  if (!chat.participants.some((pid) => pid.toString() === userId)) {
    throw createHttpError(403, "Forbidden");
  }
};

const emitToChatRoom = (req, chatId, eventName, payload) => {
  const io = req.app.get("io");
  if (io) io.to(`chat:${chatId}`).emit(eventName, payload);
};

// ── Chat handlers ──────────────────────────────────────────────────────────────

export const createChat = async (req, res) => {
  const { type, referenceId, name, description } = req.body || {};
  requireFields(req.body, ["type", "referenceId", "name"]);
  ensureInEnum(type, ["club", "event"], "type");
  ensureValidObjectId(referenceId, "referenceId");

  const existing = await Chat.findOne({ type, referenceId });
  if (existing) return res.status(200).json({ success: true, data: existing });

  const chat = await Chat.create({
    type, referenceId, name: String(name).trim(),
    description: description?.trim() || "", participants: [req.user.id],
  });
  res.status(201).json({ success: true, data: chat });
};

export const getMyChats = async (req, res) => {
  const pagination = parsePagination(req.query);
  const query = Chat.find({ participants: req.user.id }).sort({ lastMessageTime: -1, updatedAt: -1 });
  if (pagination) query.skip(pagination.skip).limit(pagination.limit);
  const chats = await query.lean();
  const response = { success: true, data: chats };
  if (pagination) {
    const total = await Chat.countDocuments({ participants: req.user.id });
    response.meta = { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / pagination.limit) };
  }
  res.json(response);
};

export const getChatById = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);
  const chat = await Chat.findById(id).lean();
  if (!chat) throw createHttpError(404, "Chat not found");
  ensureParticipant(chat, req.user.id);
  res.json({ success: true, data: chat });
};

export const joinChat = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);
  const chat = await Chat.findById(id);
  if (!chat) throw createHttpError(404, "Chat not found");
  if (!chat.participants.some((pid) => pid.toString() === req.user.id)) {
    chat.participants.push(req.user.id);
    await chat.save();
  }
  res.json({ success: true, message: "Joined chat", data: chat });
};

export const leaveChat = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);
  const chat = await Chat.findById(id);
  if (!chat) throw createHttpError(404, "Chat not found");
  chat.participants = chat.participants.filter((pid) => pid.toString() !== req.user.id);
  await chat.save();
  res.json({ success: true, message: "Left chat" });
};

// ── Message handlers ───────────────────────────────────────────────────────────

export const getMessagesByChat = async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  ensureValidObjectId(chatId, "chatId");
  const chat = await Chat.findById(chatId).lean();
  if (!chat) throw createHttpError(404, "Chat not found");
  ensureParticipant(chat, req.user.id);

  const pageNumber = Number(page);
  const limitNumber = Math.min(Number(limit), 100);
  const messages = await Message.find({ chatId })
    .sort({ timestamp: -1 }).skip((pageNumber - 1) * limitNumber).limit(limitNumber)
    .populate("senderId", "name email profilePicture").lean();
  const total = await Message.countDocuments({ chatId });
  res.json({ success: true, data: messages.reverse(), meta: { total, page: pageNumber, limit: limitNumber } });
};

export const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const { message, mediaUrl, mediaType } = req.body || {};
  ensureValidObjectId(chatId, "chatId");
  requireFields(req.body, ["message"]);
  const sanitizedMessage = String(message).trim();
  if (!sanitizedMessage) throw createHttpError(400, "Message cannot be empty");

  const chat = await Chat.findById(chatId);
  if (!chat) throw createHttpError(404, "Chat not found");
  ensureParticipant(chat, req.user.id);

  const created = await Message.create({
    chatId, senderId: req.user.id, message: sanitizedMessage,
    mediaUrl: mediaUrl || null, mediaType: mediaType || null,
  });
  chat.lastMessage = created.message;
  chat.lastMessageTime = created.timestamp;
  chat.lastMessageSenderId = req.user.id;
  await chat.save();

  const populated = await Message.findById(created._id).populate("senderId", "name email profilePicture").lean();
  emitToChatRoom(req, chatId, "message:new", populated);
  res.status(201).json({ success: true, data: populated });
};

export const editMessage = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body || {};
  ensureValidObjectId(id);
  requireFields(req.body, ["message"]);
  const sanitizedMessage = String(message).trim();
  if (!sanitizedMessage) throw createHttpError(400, "Message cannot be empty");

  const existing = await Message.findById(id);
  if (!existing) throw createHttpError(404, "Message not found");
  if (existing.senderId.toString() !== req.user.id) throw createHttpError(403, "Forbidden");

  existing.message = sanitizedMessage;
  existing.edited = true;
  existing.editedAt = new Date();
  await existing.save();

  const populated = await Message.findById(existing._id).populate("senderId", "name email profilePicture").lean();
  emitToChatRoom(req, existing.chatId, "message:updated", populated);
  res.json({ success: true, data: populated });
};

export const deleteMessage = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);
  const existing = await Message.findById(id);
  if (!existing) throw createHttpError(404, "Message not found");
  if (existing.senderId.toString() !== req.user.id) throw createHttpError(403, "Forbidden");
  existing.deleted = true;
  existing.message = "This message was deleted";
  await existing.save();
  emitToChatRoom(req, existing.chatId, "message:deleted", { _id: existing._id, chatId: existing.chatId });
  res.json({ success: true, message: "Message deleted" });
};

export const reactToMessage = async (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body || {};
  ensureValidObjectId(id);
  requireFields(req.body, ["emoji"]);

  const existing = await Message.findById(id);
  if (!existing) throw createHttpError(404, "Message not found");
  const chat = await Chat.findById(existing.chatId).lean();
  if (!chat) throw createHttpError(404, "Chat not found");
  ensureParticipant(chat, req.user.id);

  const idx = existing.reactions.findIndex((r) => r.userId?.toString() === req.user.id && r.emoji === emoji);
  if (idx >= 0) existing.reactions.splice(idx, 1);
  else existing.reactions.push({ userId: req.user.id, emoji });
  await existing.save();

  const populated = await Message.findById(existing._id).populate("senderId", "name email profilePicture").lean();
  emitToChatRoom(req, existing.chatId, "message:reacted", populated);
  res.json({ success: true, data: populated });
};
