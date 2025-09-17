import { model, Schema } from "mongoose";
import { RoomMembershipState } from "types";

const RoomMembershipSchema = new Schema<RoomMembershipState>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },

    joinedAt: { type: Date, default: () => new Date() },
    leftAt: { type: Date, default: null },

    lastReadSeq: {
      type: Number,
      default: 0,
      min: 0,
      set: (v: number) => Math.floor(v ?? 0),
    },
    lastReadAt: { type: Date, default: null },

    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    nicknameInRoom: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

/** 한 방에 한 사용자 1개만 존재 */
RoomMembershipSchema.index({ roomId: 1, userId: 1 }, { unique: true });

/** 내 활성 방 목록: 고정핀 우선 + 최근 입장 우선 */
RoomMembershipSchema.index(
  { userId: 1, isPinned: -1, joinedAt: -1 },
  { partialFilterExpression: { leftAt: null } }
);

/** 방 내 읽음/알림 집계 최적화 */
RoomMembershipSchema.index({ roomId: 1, lastReadSeq: 1 });

/** 방 관리자/운영자 빠른 조회 */
RoomMembershipSchema.index({ roomId: 1, role: 1 });

/** 간단한 정합성 가드: leftAt >= joinedAt */
RoomMembershipSchema.path("leftAt").validate(function (
  this: RoomMembershipState,
  v: Date | null
) {
  if (!v) return true;
  return v >= this.joinedAt;
},
"leftAt must be after joinedAt");

export const RoomMembership = model<RoomMembershipState>(
  "RoomMembership",
  RoomMembershipSchema
);
