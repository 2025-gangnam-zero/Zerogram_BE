import { Types } from "mongoose";

export type ChatNotificationStatus =
  | "queued" // 새 알림이 큐에 쌓임 (미전달/미확인)
  | "delivered" // 디바이스/채널로 전달됨
  | "read" // 사용자가 읽음 처리함
  | "cleared"; // 서버 측 정리(초대취소/강퇴/방나감 등)

export interface ChatNotificationState {
  _id: Types.ObjectId;

  userId: Types.ObjectId; // 알림 대상 사용자
  roomId: Types.ObjectId; // 알림 발생 방

  lastMessageId: Types.ObjectId; // 마지막 트리거 메시지
  lastPreview?: string | null; // 미리보기(텍스트/캡션 앞부분)

  count: number; // 누적 미확인 개수(해당 방 기준)
  status: ChatNotificationStatus; // 상태

  mutedAt?: Date | null; // (선택) 알림 음소거 시각

  createdAt: Date;
  updatedAt: Date;
}
