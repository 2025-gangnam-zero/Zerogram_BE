import { Types } from "mongoose";

export type RoomRole = "owner" | "admin" | "member";

export interface RoomMembershipState {
  _id: Types.ObjectId;

  roomId: Types.ObjectId;
  userId: Types.ObjectId;

  role: RoomRole;

  joinedAt: Date;
  leftAt?: Date | null;

  /** 핵심 읽음 포인터: O(1) 미읽음 계산용 */
  lastReadSeq: number;
  /** 편의 캐시(선택): 읽음 처리 시각 */
  lastReadAt?: Date | null;

  /** 사용자별 개인 설정 */
  isPinned: boolean;
  isMuted: boolean;
  nicknameInRoom?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
