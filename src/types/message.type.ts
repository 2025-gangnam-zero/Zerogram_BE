import { Types } from "mongoose";
import { AttachmentState } from "./attachment.type";

export type ChatUser = {
  userId: string;
  nickname: string;
  profile_image?: string;
};

export type MessageState = {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  authorId: Types.ObjectId; // 🔸 정규화 참조 (User._id)
  author: ChatUser; // 🔸 표시용 스냅샷 (비정규화)
  serverId: string; // 예: "svr-..."; 소켓 ACK와 매핑(고유)
  seq: number; // 방 내 단조 증가 시퀀스
  text?: string;
  attachments?: AttachmentState[];
  createdAtIso: string; // ISO 문자열 (소켓과 정합)
  meta?: { readCount?: number };
  createdAt: Date;
  updatedAt: Date;
};
