import { Types } from "mongoose";
import { AttachmentState, IncomingAttachment } from "../types";

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

export type SendPayload = {
  roomId: string;
  text?: string; // 텍스트만/파일만/둘 다 허용
  attachments?: IncomingAttachment[]; // 없으면 텍스트-only
  serverId?: string; // (옵션) 클라 생성 시 전달, 아니면 서버가 생성
};

export type SendAck = {
  ok: boolean;
  id?: string; // ← messageId (_id)
  serverId?: string; // ← 멱등키
  createdAt?: string; // ← ISO (필드명 createdAt로 통일)
  seq?: number; // 포함 (예)
  attachments?: AttachmentState[];
  error?: string;
};
