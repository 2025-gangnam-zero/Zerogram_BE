import { Schema, model, Types } from "mongoose";

export type RoomRole = "owner" | "admin" | "member";

export interface RoomMembershipState {
  _id: Types.ObjectId;

  roomId: Types.ObjectId;
  userId: Types.ObjectId;

  role: RoomRole;

  joinedAt: Date;
  leftAt?: Date | null;

  /** 읽음 포인터(시각/메시지Id/시퀀스 중 선택/병행 가능) */
  lastReadAt?: Date | null;
  lastReadMessageId?: Types.ObjectId | null;
  lastReadSeq?: number | null;

  /** 사용자별 개인 설정 */
  isPinned: boolean;
  isMuted: boolean;
  nicknameInRoom?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

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

    lastReadAt: { type: Date, default: null },
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastReadSeq: { type: Number, default: null },

    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    nicknameInRoom: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

/** 한 방에 한 사용자 1개만 존재 */
RoomMembershipSchema.index({ roomId: 1, userId: 1 }, { unique: true });
/** 사용자별 내 방 목록 빠른 조회 */
RoomMembershipSchema.index({ userId: 1, isPinned: 1 });
/** 읽음 집계/조회 최적화 (옵션) */
RoomMembershipSchema.index({ roomId: 1, lastReadSeq: 1 });

export const RoomMembership = model<RoomMembershipState>(
  "RoomMembership",
  RoomMembershipSchema
);
