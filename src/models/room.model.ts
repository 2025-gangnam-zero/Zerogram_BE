import { Schema, model, Types } from "mongoose";

export type WorkoutType = "running" | "fitness";

export interface RoomState {
  _id: Types.ObjectId;

  roomName: string;
  roomImageUrl?: string | null;
  roomDescription?: string | null;
  workoutType: WorkoutType;

  /** 참여자 ObjectId 목록 (빠른 권한/소속 필터용) */
  memberIds: Types.ObjectId[];
  /** 최대 인원 */
  memberCapacity: number;
  /** 캐시: memberIds.length 와 일치 유지 */
  memberCount: number;

  /** 최근 메시지 메타 */
  lastMessage?: string | null;
  lastMessageAt?: Date | null;

  /** 메시지 시퀀스(읽음 O(1) 계산용) */
  lastMessageSeq: number;

  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<RoomState>(
  {
    roomName: { type: String, required: true, index: true },
    roomImageUrl: { type: String },
    roomDescription: { type: String },
    workoutType: { type: String, enum: ["running", "fitness"], index: true },

    memberIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      index: true, // 멀티키 인덱스
      default: [],
    },
    memberCapacity: { type: Number, required: true, min: 1 },
    memberCount: { type: Number, default: 0 },

    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },

    lastMessageSeq: { type: Number, default: 0 }, // 메시지 생성 시 +1
  },
  { timestamps: true, versionKey: false }
);

/** 내가 속한 방 최신순 정렬 최적화 */
RoomSchema.index({ memberIds: 1, lastMessageAt: -1, _id: -1 });
/** 검색(roomName) + 최신순 (옵션: 필요한 경우) */
RoomSchema.index({ roomName: 1, lastMessageAt: -1 });

export const Room = model<RoomState>("Room", RoomSchema);
