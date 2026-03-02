import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { createHttpError } from "../utils/httpError.js";
import { ensureValidObjectId, requireFields } from "../utils/validation.js";

const ensureParticipant = (chat, userId) => {
  const isParticipant = chat.participants.some(
    (participantId) => participantId.toString() === userId
  );

  if (!isParticipant) {
    throw createHttpError(403, "Forbidden");
  }
};

const emitToChatRoom = (req, chatId, eventName, payload) => {
  const io = req.app.get("io");
  if (io) {
    io.to(`chat:${chatId}`).emit(eventName, payload);
  }
};

export const getMessagesByChat = async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  ensureValidObjectId(chatId, "chatId");

  const chat = await Chat.findById(chatId).lean();
  if (!chat) {
    throw createHttpError(404, "Chat not found");
  }

  ensureParticipant(chat, req.user.id);

  const pageNumber = Number(page);
  const limitNumber = Math.min(Number(limit), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const messages = await Message.find({ chatId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limitNumber)
    .populate("senderId", "name email profilePicture")
    .lean();

  const total = await Message.countDocuments({ chatId });

  res.json({
    success: true,
    data: messages.reverse(),
    meta: { total, page: pageNumber, limit: limitNumber },
  });
};

export const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const { message, mediaUrl, mediaType } = req.body || {};

  ensureValidObjectId(chatId, "chatId");
  requireFields(req.body, ["message"]);

  const sanitizedMessage = String(message).trim();
  if (!sanitizedMessage) {
    throw createHttpError(400, "Message cannot be empty");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw createHttpError(404, "Chat not found");
  }

  ensureParticipant(chat, req.user.id);

  const created = await Message.create({
    chatId,
    senderId: req.user.id,
    message: sanitizedMessage,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
  });

  chat.lastMessage = created.message;
  chat.lastMessageTime = created.timestamp;
  chat.lastMessageSenderId = req.user.id;
  await chat.save();

  const populated = await Message.findById(created._id)
    .populate("senderId", "name email profilePicture")
    .lean();

  emitToChatRoom(req, chatId, "message:new", populated);
  res.status(201).json({ success: true, data: populated });
};

export const editMessage = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body || {};

  ensureValidObjectId(id);
  requireFields(req.body, ["message"]);

  const sanitizedMessage = String(message).trim();
  if (!sanitizedMessage) {
    throw createHttpError(400, "Message cannot be empty");
  }

  const existing = await Message.findById(id);
  if (!existing) {
    throw createHttpError(404, "Message not found");
  }

  if (existing.senderId.toString() !== req.user.id) {
    throw createHttpError(403, "Forbidden");
  }

  existing.message = sanitizedMessage;
  existing.edited = true;
  existing.editedAt = new Date();
  await existing.save();

  const populated = await Message.findById(existing._id)
    .populate("senderId", "name email profilePicture")
    .lean();

  emitToChatRoom(req, existing.chatId, "message:updated", populated);
  res.json({ success: true, data: populated });
};

export const deleteMessage = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);

  const existing = await Message.findById(id);
  if (!existing) {
    throw createHttpError(404, "Message not found");
  }

  if (existing.senderId.toString() !== req.user.id) {
    throw createHttpError(403, "Forbidden");
  }

  existing.deleted = true;
  existing.message = "This message was deleted";
  await existing.save();

  emitToChatRoom(req, existing.chatId, "message:deleted", {
    _id: existing._id,
    chatId: existing.chatId,
  });

  res.json({ success: true, message: "Message deleted" });
};

export const reactToMessage = async (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body || {};

  ensureValidObjectId(id);
  requireFields(req.body, ["emoji"]);

  const existing = await Message.findById(id);
  if (!existing) {
    throw createHttpError(404, "Message not found");
  }

  const chat = await Chat.findById(existing.chatId).lean();
  if (!chat) {
    throw createHttpError(404, "Chat not found");
  }

  ensureParticipant(chat, req.user.id);

  const reactionIndex = existing.reactions.findIndex(
    (reaction) =>
      reaction.userId?.toString() === req.user.id && reaction.emoji === emoji
  );

  if (reactionIndex >= 0) {
    existing.reactions.splice(reactionIndex, 1);
  } else {
    existing.reactions.push({ userId: req.user.id, emoji });
  }

  await existing.save();

  const populated = await Message.findById(existing._id)
    .populate("senderId", "name email profilePicture")
    .lean();

  emitToChatRoom(req, existing.chatId, "message:reacted", populated);
  res.json({ success: true, data: populated });
};
