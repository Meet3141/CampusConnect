import mongoose from "mongoose";

const reviewHistorySchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["GRACE_APPROVED", "GRACE_REJECTED", "WARNING_REDUCED", "STUDENT_BLOCKED", "ATTENDANCE_CORRECTION", "BLOCK_EXPIRED_PROBATION_STARTED", "PROBATION_EXPIRED"],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, default: "orgAdmin" },
    reason: { type: String, default: "" },
    
    // Late correction tracking
    correctionType: { type: String, enum: ["normal", "late_correction"], default: "normal" },
    justification: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

reviewHistorySchema.index({ eventId: 1, userId: 1, createdAt: -1 });

export default mongoose.model("ReviewHistory", reviewHistorySchema);