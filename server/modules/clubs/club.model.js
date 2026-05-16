import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, "Club name is required"], unique: true, trim: true, maxlength: 100 },
    description: { type: String, required: [true, "Club description is required"], maxlength: 1000 },
    category:    { type: String, enum: ["technical", "cultural", "sports", "academic", "arts", "other"], required: true },
    adminId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coverImage:  { type: String, default: null },
    memberCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

clubSchema.index({ adminId: 1 });
clubSchema.index({ category: 1 });
clubSchema.index({ createdAt: -1 });

export default mongoose.model("Club", clubSchema);
