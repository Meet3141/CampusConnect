import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ["club", "event"], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name:        { type: String, required: true },
    description: String,
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: String,
    lastMessageTime: Date,
    lastMessageSenderId: mongoose.Schema.Types.ObjectId,
    isActive:    { type: Boolean, default: true },
    createdAt:   { type: Date, default: Date.now },
    updatedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatSchema.index({ type: 1, referenceId: 1 }, { unique: true });
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

export default mongoose.model("Chat", chatSchema);
