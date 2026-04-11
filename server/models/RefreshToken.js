import mongoose from "mongoose";
import crypto from "crypto";

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    // One-time-use flag — set to true once rotated or revoked
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB will auto-delete expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1 });

// Static: generate a cryptographically random token string
refreshTokenSchema.statics.generateTokenString = function () {
  return crypto.randomBytes(64).toString("hex");
};

export default mongoose.model("RefreshToken", refreshTokenSchema);
