import mongoose from "mongoose";

/**
 * Announcement — club-level broadcast messages posted by coordinators or admins.
 * All approved members of the club can read them.
 */
const announcementSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 120,
    },

    body: {
      type: String,
      required: [true, "Body is required"],
      maxlength: 2000,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Tag for filtering (optional)
    tag: {
      type: String,
      enum: ["general", "event", "reminder", "urgent"],
      default: "general",
    },

    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ clubId: 1, createdAt: -1 });
announcementSchema.index({ postedBy: 1 });

export default mongoose.model("Announcement", announcementSchema);
