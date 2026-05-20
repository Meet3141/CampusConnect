import mongoose from "mongoose";

const reviewHistorySchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["GRACE_APPROVED", "GRACE_REJECTED", "WARNING_REDUCED", "STUDENT_BLOCKED"],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, default: "orgAdmin" },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

reviewHistorySchema.index({ eventId: 1, userId: 1, createdAt: -1 });

export default mongoose.model("ReviewHistory", reviewHistorySchema);