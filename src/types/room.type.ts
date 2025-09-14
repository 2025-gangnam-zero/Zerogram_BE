import { Types } from "mongoose";
import { WorkoutType } from "../types";

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
