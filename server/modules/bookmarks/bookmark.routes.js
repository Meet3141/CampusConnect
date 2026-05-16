import express from "express";
import asyncHandler from "../../middleware/asyncHandler.js";
import auth from "../../middleware/auth.js";
import { addBookmark, listBookmarks, removeBookmark } from "./bookmark.controller.js";

const router = express.Router();

router.post("/",    auth, asyncHandler(addBookmark));
router.get("/",     auth, asyncHandler(listBookmarks));
router.delete("/:id", auth, asyncHandler(removeBookmark));

export default router;
