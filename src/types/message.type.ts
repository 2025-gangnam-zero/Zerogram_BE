import { Types } from "mongoose";

export type MessageType = "text" | "image" | "file" | "system.notice";

export interface Attachment {
  kind: "image" | "file"; // 미디어/파일 구분
  url: string; // 접근 가능한 절대 URL
  mimeType?: string | null;
  size?: number | null; // bytes
  width?: number | null; // image 용
  height?: number | null; // image 용
  duration?: number | null; // 영상/오디오라면 초 단위
  originalName?: string | null; // 원본 파일명
  thumbUrl?: string | null; // 썸네일(이미지/영상)
}

export interface MessageState {
  _id: Types.ObjectId;

  clientMessageId: string; // 멱등키(전역 Unique)
  roomId: Types.ObjectId; // FK(Room)
  seq: number; // 방 내 시퀀스(1부터 증가, (roomId, seq) Unique)

  authorId: Types.ObjectId; // FK(User)
  type: MessageType;

  content?: string | null; // text/system.notice에서 필수
  attachments?: Attachment[] | null; // image/file에서 필수

  createdAt: Date; // 서버 권위 시각
  editedAt?: Date | null;
  deletedAt?: Date | null;
}

export type MessageDto = {
  id: string;
  clientMessageId?: string;
  roomId: string;
  seq: number;
  author: { id: string; name: string; avatarUrl?: string };
  type: "text" | "system.notice" | "image" | "file";
  content?: string | null;
  attachments?: Attachment[] | null;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
};
