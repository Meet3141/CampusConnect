import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    
    name: {
      type: String,
      required: [true, "Club name is required"],
      unique: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Club description is required"],
      maxlength: 1000,
    },

    category: {
      type: String,
      enum: ["technical", "cultural", "sports", "academic", "arts", "other"],
      required: true,
    },

 
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Club Image
    coverImage: {
      type: String,
      default: null,
    },

    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "active", "rejected"],
          default: "pending",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        approvedBy: mongoose.Schema.Types.ObjectId, 
        approvedAt: Date,
      },
    ],

    memberCount: {
      type: Number,
      default: 0,
    },


    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create indexes for performance
clubSchema.index({ name: 1 }, { unique: true });
clubSchema.index({ adminId: 1 });
clubSchema.index({ category: 1 });
clubSchema.index({ createdAt: -1 });
clubSchema.index({ "members.userId": 1 });

export default mongoose.model("Club", clubSchema);
