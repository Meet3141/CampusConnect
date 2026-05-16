import express from "express";
import asyncHandler from "../../middleware/asyncHandler.js";
import auth from "../../middleware/auth.js";
import authorize from "../../middleware/roleCheck.js";
import {
  getPostings, getPostingById, createPosting, updatePosting, deletePosting,
  applyToPosting, withdrawApplication, reviewApplication, getMyPostings, getMyApplications,
} from "./volunteer.controller.js";

const router = express.Router();

router.get("/",    asyncHandler(getPostings));
router.get("/:id", asyncHandler(getPostingById));

router.use(auth);

router.get("/user/my-postings",     asyncHandler(getMyPostings));
router.get("/user/my-applications", asyncHandler(getMyApplications));

router.post("/", authorize("clubAdmin", "orgAdmin"), asyncHandler(createPosting));
router.put("/:id",    asyncHandler(updatePosting));
router.delete("/:id", asyncHandler(deletePosting));

router.post("/:id/apply",    asyncHandler(applyToPosting));
router.post("/:id/withdraw", asyncHandler(withdrawApplication));
router.patch("/:id/review",  asyncHandler(reviewApplication));

export default router;
