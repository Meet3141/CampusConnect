import mongoose from "mongoose";

const ocrCacheSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      unique: true,
    },

    imageHash: {
      type: String,
      unique: true,
    },

    extractedData: {
      title: String,
      date: String,
      venue: String,
      description: String,
      category: String,
      rawText: String,
    },

    confidence: {
      type: Number, 
      default: 0,
    },

    processingTime: Number,

    createdAt: {
      type: Date,
      default: Date.now,
     
      index: { expires: 86400 },
    },
  }
);

ocrCacheSchema.index({ imageUrl: 1 }, { unique: true });
ocrCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model("OCRCache", ocrCacheSchema);
