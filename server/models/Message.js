import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {

    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: [true, "Message cannot be empty"],
      trim: true,
      maxlength: 5000,
    },

    mediaUrl: {
      type: String,
      default: null,
    },

    mediaType: {
      type: String,
      enum: ["image", "video", "file", null],
      default: null,
    },

 
    edited: {
      type: Boolean,
      default: false,
    },

    editedAt: Date,

    deleted: {
      type: Boolean,
      default: false,
    },

    
    reactions: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        emoji: String,
      },
    ],

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  }
);

messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ timestamp: -1 });
messageSchema.index({ chatId: 1 });

export default mongoose.model("Message", messageSchema);
