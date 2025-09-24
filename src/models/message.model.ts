import mongoose, { Schema } from "mongoose";
import { ChatUser, MessageState } from "../types";
import { AttachmentSchema } from "../models";

const AuthorSnapshotSchema = new Schema<ChatUser>(
  {
    userId: { type: String, required: true },
    nickname: { type: String, required: true },
    profile_image: { type: String },
  },
  { _id: false }
);

const MessageSchema = new Schema<MessageState>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    author: { type: AuthorSnapshotSchema, required: true },
    serverId: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, index: true },
    text: { type: String },
    attachments: { type: [AttachmentSchema], default: [] },
    createdAtIso: { type: String, required: true },
    meta: {
      readCount: { type: Number },
    },
  },
  { versionKey: false, timestamps: true }
);

// 페이징/정렬 최적화
MessageSchema.index({ roomId: 1, seq: 1 }, { unique: true });
MessageSchema.index({ roomId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", MessageSchema);
