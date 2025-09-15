import { model, Schema } from "mongoose";
import { ChatNotificationState } from "types";

const ChatNotificationSchema = new Schema<ChatNotificationState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    lastPreview: {
      type: String,
      default: null,
      // 너무 긴 프리뷰 방지(필요 시 길이 조절)
      maxlength: 512,
      trim: true,
    },

    count: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
      set: (v: number) => Math.max(0, Math.floor(v ?? 0)),
    },

    status: {
      type: String,
      enum: ["queued", "delivered", "read", "cleared"],
      required: true,
      default: "queued",
    },

    mutedAt: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: true, // createdAt, updatedAt 자동 관리
  }
);

/** 사용자-방 조합당 한 문서만 존재 (누적 카운터/미리보기 갱신) */
ChatNotificationSchema.index({ userId: 1, roomId: 1 }, { unique: true });

/** 사용자 알림함 정렬/페이징 최적화 */
ChatNotificationSchema.index({ userId: 1, updatedAt: -1 });

/** 상태별 필터링(예: 미확인/대기중만) */
ChatNotificationSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const ChatNotification = model<ChatNotificationState>(
  "ChatNotification",
  ChatNotificationSchema
);
