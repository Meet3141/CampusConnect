/**
 * modules/bookmarks/bookmark.controller.js
 * Handles HTTP layer for bookmark operations.
 * Business logic delegated to bookmark.service.js
 */
import * as BookmarkService from "./bookmark.service.js";
import { ensureInEnum, ensureValidObjectId, requireFields } from "../../utils/validation.js";

export const addBookmark = async (req, res) => {
  const { eventId, eventType } = req.body || {};
  requireFields(req.body, ["eventId", "eventType"]);
  ensureValidObjectId(eventId, "eventId");
  ensureInEnum(eventType, ["internal", "external"], "eventType");

  const bookmark = await BookmarkService.addBookmark(req.user.id, eventId, eventType);
  res.status(201).json({ success: true, data: bookmark });
};

export const listBookmarks = async (req, res) => {
  const result = await BookmarkService.listBookmarks(req.user.id, req.query);
  res.json(result);
};

export const removeBookmark = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);
  await BookmarkService.removeBookmark(id, req.user.id);
  res.json({ success: true, message: "Bookmark removed" });
};
