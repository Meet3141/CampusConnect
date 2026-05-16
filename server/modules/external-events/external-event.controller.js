import ExternalEvent from "./external-event.model.js";
import OCRCache from "./ocr-cache.model.js";
import { createHttpError } from "../../utils/httpError.js";
import { ensureInEnum, ensureValidObjectId, requireFields } from "../../utils/validation.js";

const EXTERNAL_CATEGORIES = ["hackathon", "workshop", "webinar", "cultural", "sports", "conference", "competition"];

const inferCategory = (text) => {
  const n = (text || "").toLowerCase();
  if (n.includes("hackathon"))  return "hackathon";
  if (n.includes("workshop"))   return "workshop";
  if (n.includes("webinar"))    return "webinar";
  if (n.includes("sport"))      return "sports";
  if (n.includes("conference")) return "conference";
  if (n.includes("competition"))return "competition";
  return "cultural";
};

export const extractFromPoster = async (req, res) => {
  const { imageUrl, imageHash, rawText, title, date, venue, description, category } = req.body || {};
  requireFields(req.body, ["imageUrl"]);
  const existing = await OCRCache.findOne(imageHash ? { $or: [{ imageUrl }, { imageHash }] } : { imageUrl }).lean();
  if (existing) return res.json({ success: true, cached: true, data: existing });
  const extractedData = {
    title: title || "Untitled Event", date: date || "TBD", venue: venue || "TBD",
    description: description || rawText || "", category: category || inferCategory(rawText || title || ""), rawText: rawText || "",
  };
  const cacheDoc = await OCRCache.create({ imageUrl, imageHash: imageHash || undefined, extractedData, confidence: 0.75, processingTime: 0 });
  res.status(201).json({ success: true, cached: false, data: cacheDoc });
};

export const createExternalEvent = async (req, res) => {
  const { title, description, universityName, venue, category, date, registrationLink, registrationDeadline, image } = req.body || {};
  requireFields(req.body, ["title", "universityName", "category", "date", "registrationLink"]);
  ensureInEnum(category, EXTERNAL_CATEGORIES, "category");
  const externalEvent = await ExternalEvent.create({
    title, description, universityName, venue, category, date, registrationLink,
    registrationDeadline: registrationDeadline || null, image: image || null, createdBy: req.user.id,
  });
  res.status(201).json({ success: true, data: externalEvent });
};

export const getExternalEvents = async (req, res) => {
  const { category, universityName, verified, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (universityName) filter.universityName = { $regex: universityName, $options: "i" };
  filter.isVerified = verified !== undefined ? verified === "true" : true;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const items = await ExternalEvent.find(filter).sort({ date: 1 }).skip(skip).limit(limitNumber).lean();
  const total = await ExternalEvent.countDocuments(filter);
  res.json({ success: true, data: items, meta: { total, page: pageNumber, limit: limitNumber } });
};

export const getExternalEventById = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);
  const item = await ExternalEvent.findById(id).lean();
  if (!item) throw createHttpError(404, "External event not found");
  const userRoles = req.user?.roles || [];
  const canSeeUnverified = userRoles.includes("orgAdmin") || userRoles.includes("editor");
  const isUploader = req.user && item.createdBy?.toString() === req.user.id;
  if (!item.isVerified && !canSeeUnverified && !isUploader) throw createHttpError(404, "External event not found");
  res.json({ success: true, data: item });
};

export const updateExternalEvent = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);
  const item = await ExternalEvent.findById(id);
  if (!item) throw createHttpError(404, "External event not found");
  const userRoles = req.user.roles || [];
  const isUploader = item.createdBy.toString() === req.user.id;
  const isEditor   = userRoles.includes("editor") || userRoles.includes("orgAdmin");
  if (!isUploader && !isEditor) throw createHttpError(403, "Forbidden");
  if (isUploader && !isEditor && item.isVerified) throw createHttpError(403, "Cannot edit an already-verified event");
  const editableFields = ["title", "description", "universityName", "venue", "category", "date", "registrationLink", "registrationDeadline", "image"];
  editableFields.forEach((f) => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
  await item.save();
  res.json({ success: true, data: item });
};

export const verifyExternalEvent = async (req, res) => {
  const { id } = req.params;
  ensureValidObjectId(id);
  const item = await ExternalEvent.findById(id);
  if (!item) throw createHttpError(404, "External event not found");
  item.isVerified = true;
  item.verifiedBy = req.user.id;
  item.verificationDate = new Date();
  await item.save();
  res.json({ success: true, data: item });
};
