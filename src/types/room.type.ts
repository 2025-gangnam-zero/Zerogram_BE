import { Types } from "mongoose";

export type RoomNoticeInline = {
  text?: string;
  enabled?: boolean;
  authorId?: Types.ObjectId; // 공지 마지막 수정자
  updatedAt?: Date; // 서버에서 new Date()로 세팅
};

export type RoomState = {
  _id: Types.ObjectId;
  meetId: Types.ObjectId;
  roomName: string;
  imageUrl?: string;
  description?: string;
  memberCapacity?: number; // 선택
  lastMessage?: string;
  lastMessageAt?: Date;
  seqCounter: number; // 메시지 시퀀스 누적 (unread 계산용)
  notice?: RoomNoticeInline;
  createdAt?: Date;
  updatedAt?: Date;
};
