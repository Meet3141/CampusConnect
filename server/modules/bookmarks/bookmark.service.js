/**
 * modules/bookmarks/bookmark.service.js
 * Business logic for bookmarks — querying, hydrating events, pagination.
 */
import Bookmark from "./bookmark.model.js";
import Event from "../events/event.model.js";
import ExternalEvent from "../external-events/external-event.model.js";
import { createHttpError } from "../../utils/httpError.js";

const parsePagination = (query, defaultLimit = 10, maxLimit = 50) => {
  const hasPage = query.page !== undefined;
  const hasLimit = query.limit !== undefined;
  if (!hasPage && !hasLimit) return null;

  const pageRaw = Number(query.page);
  const limitRaw = Number(query.limit);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limitBase = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : defaultLimit;
  const limit = Math.min(limitBase, maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const ensureEventExists = async (eventId, eventType) => {
  if (eventType === "internal") {
    const event = await Event.findById(eventId).select("_id").lean();
    if (!event) throw createHttpError(404, "Internal event not found");
    return;
  }
  const externalEvent = await ExternalEvent.findById(eventId).select("_id").lean();
  if (!externalEvent) throw createHttpError(404, "External event not found");
};

export const addBookmark = async (userId, eventId, eventType) => {
  await ensureEventExists(eventId, eventType);
  return Bookmark.findOneAndUpdate(
    { userId, eventId, eventType },
    { userId, eventId, eventType },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const listBookmarks = async (userId, query) => {
  const pagination = parsePagination(query);
  const dbQuery = Bookmark.find({ userId }).sort({ createdAt: -1 });

  if (pagination) dbQuery.skip(pagination.skip).limit(pagination.limit);
  const bookmarks = await dbQuery.lean();

  const internalIds = bookmarks.filter((b) => b.eventType === "internal").map((b) => b.eventId);
  const externalIds = bookmarks.filter((b) => b.eventType === "external").map((b) => b.eventId);

  const [internalEvents, externalEvents] = await Promise.all([
    internalIds.length ? Event.find({ _id: { $in: internalIds } }).lean() : [],
    externalIds.length ? ExternalEvent.find({ _id: { $in: externalIds } }).lean() : [],
  ]);

  const internalById = new Map(internalEvents.map((e) => [String(e._id), e]));
  const externalById = new Map(externalEvents.map((e) => [String(e._id), e]));

  const hydrated = bookmarks.map((b) => ({
    ...b,
    event: b.eventType === "internal" ? internalById.get(String(b.eventId)) || null
                                      : externalById.get(String(b.eventId)) || null,
  }));

  const response = { success: true, data: hydrated };
  if (pagination) {
    const total = await Bookmark.countDocuments({ userId });
    response.meta = { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / pagination.limit) };
  }
  return response;
};

export const removeBookmark = async (id, userId) => {
  const bookmark = await Bookmark.findOneAndDelete({ _id: id, userId });
  if (!bookmark) throw createHttpError(404, "Bookmark not found");
  return bookmark;
};
