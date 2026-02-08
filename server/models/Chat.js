import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    // Chat Type & Reference
    type: {
      type: String,
      enum: ["club", "event"],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // ref: Club if type = "club"
      // ref: Event if type = "event"
    },

    // Chat Info
    name: {
      type: String,
      required: true,
    },

    description: String,

    // Participants
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Last Message Tracking
    lastMessage: String,

    lastMessageTime: Date,

    lastMessageSenderId: mongoose.Schema.Types.ObjectId,

    // Chat Settings
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
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
chatSchema.index({ type: 1, referenceId: 1 }, { unique: true });
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

export default mongoose.model("Chat", chatSchema);
