import { Schema, model } from "mongoose";
import { RoomState } from "types";

const RoomSchema = new Schema<RoomState>(
  {
    roomName: { type: String, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notice: { type: String, default: null },

    roomImageUrl: { type: String },
    roomDescription: { type: String },
    workoutType: { type: String, enum: ["running", "fitness"] },

    memberIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    memberCapacity: { type: Number, min: 1 },
    memberCount: { type: Number, default: 0 },

    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },

    seqCounter: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

// 방 목록 최신순 정렬 최적화
RoomSchema.index({ memberIds: 1, lastMessageAt: -1, _id: -1 });
RoomSchema.index({ roomName: 1, lastMessageAt: -1 });

export const Room = model<RoomState>("Room", RoomSchema);
