import mongoose, { Schema } from "mongoose";
import { RoomMembershipState } from "../types";

const RoomMembershipSchema = new Schema<RoomMembershipState>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      required: true,
      default: "member",
    },
    lastReadSeq: { type: Number, required: true, default: 0 },
    joinedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    versionKey: false,
    timestamps: true, // createdAt, updatedAt 자동 관리(Date)
  }
);

// 한 유저는 한 방에 하나의 멤버십만
RoomMembershipSchema.index({ roomId: 1, userId: 1 }, { unique: true });

// 조회/통계용(선택)
// RoomMembershipSchema.index({ userId: 1 });
RoomMembershipSchema.index({ roomId: 1, joinedAt: -1 });

export const RoomMembership = mongoose.model(
  "RoomMembership",
  RoomMembershipSchema
);
