import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
     
    },

    eventType: {
      type: String,
      enum: ["internal", "external"],
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  }
);

// Unique constraint: user can bookmark same event only once
bookmarkSchema.index({ userId: 1, eventId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Bookmark", bookmarkSchema);
