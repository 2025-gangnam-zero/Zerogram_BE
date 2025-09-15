import { Types } from "mongoose";
import { WorkoutType } from "../types";

export interface RoomState {
  _id: Types.ObjectId;

  roomName: string;
  createdBy: Types.ObjectId;
  notice?: string | null;

  roomImageUrl?: string | null;
  roomDescription?: string | null;
  workoutType?: "running" | "fitness";

  /** 멤버 캐시 (쓰기-스루 동기화 필요) */
  memberIds: Types.ObjectId[];
  memberCapacity?: number;
  memberCount: number;

  /** 최근 메시지 캐시 */
  lastMessage?: string | null;
  lastMessageAt?: Date | null;

  /** 메시지 시퀀스 카운터 (읽음 계산용) */
  seqCounter: number;

  createdAt: Date;
  updatedAt: Date;
}

export type RoomsListQuery = {
  userId: Types.ObjectId;
  limit: number; // 1~100
  q?: string;
  workoutType?: WorkoutType;
  cursor?: string;
};

export type RoomsListItem = {
  id: string;
  roomName: string;
  roomImageUrl: string | null;
  roomDescription: string | null;
  memberCount: number;
  memberCapacity: number;
  workoutType: WorkoutType;
  isPinned: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null; // ISO or null
  unreadCount: number;
};

export type RoomsListResult = {
  items: RoomsListItem[];
  nextCursor?: string;
};
