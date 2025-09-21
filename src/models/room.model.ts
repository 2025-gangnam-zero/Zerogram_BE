import mongoose, { Schema } from "mongoose";
import { RoomState } from "../types";

const RoomSchema = new Schema<RoomState>(
  {
    meetId: {
      type: Schema.Types.ObjectId,
      ref: "Meet",
      required: true,
      unique: true,
    },
    roomName: { type: String, required: true },
    imageUrl: { type: String },
    description: { type: String },
    memberCapacity: { type: Number },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    seqCounter: { type: Number, required: true, default: 0 },

    notice: {
      text: { type: String },
      enabled: { type: Boolean, default: false },
      authorId: { type: Schema.Types.ObjectId, ref: "User" },
      updatedAt: { type: Date }, // 설정/수정 시 서버에서 new Date()
    },
  },
  { versionKey: false, timestamps: true }
);

// 인덱스는 기존과 동일
RoomSchema.index({ updatedAt: -1 });
RoomSchema.index({ lastMessageAt: -1 });

// 인덱스
RoomSchema.index({ updatedAt: -1 });
RoomSchema.index({ lastMessageAt: -1 });

export const Room = mongoose.model("Room", RoomSchema);
