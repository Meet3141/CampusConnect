import mongoose from "mongoose";

const correctionRequestSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "amended"],
      default: "pending",
    },
    correctionType: {
      type: String,
      enum: ["normal", "late_correction"],
      default: "normal",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    facultyRemark: {
      type: String,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

correctionRequestSchema.index({ eventId: 1, requestedBy: 1 });
correctionRequestSchema.index({ status: 1 });

export default mongoose.model("CorrectionRequest", correctionRequestSchema);
