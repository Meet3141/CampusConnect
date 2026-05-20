import mongoose from "mongoose";

const graceRequestSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    facultyRemark: { type: String, default: "" },
  },
  { timestamps: true }
);

graceRequestSchema.index({ eventId: 1, userId: 1, status: 1 });

export default mongoose.model("GraceRequest", graceRequestSchema);