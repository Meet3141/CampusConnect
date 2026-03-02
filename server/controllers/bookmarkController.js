import Bookmark from "../models/Bookmark.js";
import Event from "../models/Event.js";
import ExternalEvent from "../models/ExternalEvent.js";
import { createHttpError } from "../utils/httpError.js";
import {
  ensureInEnum,
  ensureValidObjectId,
  requireFields,
} from "../utils/validation.js";

const ensureEventExists = async (eventId, eventType) => {
  if (eventType === "internal") {
    const event = await Event.findById(eventId).select("_id").lean();
    if (!event) throw createHttpError(404, "Internal event not found");
    return;
  }

  const externalEvent = await ExternalEvent.findById(eventId).select("_id").lean();
  if (!externalEvent) throw createHttpError(404, "External event not found");
};

export const addBookmark = async (req, res) => {
  const { eventId, eventType } = req.body || {};

  requireFields(req.body, ["eventId", "eventType"]);
  ensureValidObjectId(eventId, "eventId");
  ensureInEnum(eventType, ["internal", "external"], "eventType");

  await ensureEventExists(eventId, eventType);

  const bookmark = await Bookmark.findOneAndUpdate(
    { userId: req.user.id, eventId, eventType },
    { userId: req.user.id, eventId, eventType },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, data: bookmark });
};

export const listBookmarks = async (req, res) => {
  const bookmarks = await Bookmark.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const hydrated = await Promise.all(
    bookmarks.map(async (bookmark) => {
      const model = bookmark.eventType === "internal" ? Event : ExternalEvent;
      const event = await model.findById(bookmark.eventId).lean();
      return { ...bookmark, event };
    })
  );

  res.json({ success: true, data: hydrated });
};

export const removeBookmark = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);

  const bookmark = await Bookmark.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!bookmark) {
    throw createHttpError(404, "Bookmark not found");
  }

  res.json({ success: true, message: "Bookmark removed" });
};
