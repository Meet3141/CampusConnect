import Chat from "../models/Chat.js";
import { createHttpError } from "../utils/httpError.js";
import {
  ensureInEnum,
  ensureValidObjectId,
  requireFields,
} from "../utils/validation.js";

export const createChat = async (req, res) => {
  const { type, referenceId, name, description } = req.body || {};

  requireFields(req.body, ["type", "referenceId", "name"]);
  ensureInEnum(type, ["club", "event"], "type");
  ensureValidObjectId(referenceId, "referenceId");

  const existing = await Chat.findOne({ type, referenceId });
  if (existing) {
    return res.status(200).json({ success: true, data: existing });
  }

  const chat = await Chat.create({
    type,
    referenceId,
    name: String(name).trim(),
    description: description?.trim() || "",
    participants: [req.user.id],
  });

  res.status(201).json({ success: true, data: chat });
};

export const getMyChats = async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id })
    .sort({ lastMessageTime: -1, updatedAt: -1 })
    .lean();

  res.json({ success: true, data: chats });
};

export const getChatById = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);

  const chat = await Chat.findById(id).lean();
  if (!chat) {
    throw createHttpError(404, "Chat not found");
  }

  const isParticipant = chat.participants.some(
    (participantId) => participantId.toString() === req.user.id
  );

  if (!isParticipant) {
    throw createHttpError(403, "Forbidden");
  }

  res.json({ success: true, data: chat });
};

export const joinChat = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);

  const chat = await Chat.findById(id);
  if (!chat) {
    throw createHttpError(404, "Chat not found");
  }

  const exists = chat.participants.some(
    (participantId) => participantId.toString() === req.user.id
  );

  if (!exists) {
    chat.participants.push(req.user.id);
    await chat.save();
  }

  res.json({ success: true, message: "Joined chat", data: chat });
};

export const leaveChat = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);

  const chat = await Chat.findById(id);
  if (!chat) {
    throw createHttpError(404, "Chat not found");
  }

  chat.participants = chat.participants.filter(
    (participantId) => participantId.toString() !== req.user.id
  );
  await chat.save();

  res.json({ success: true, message: "Left chat" });
};
