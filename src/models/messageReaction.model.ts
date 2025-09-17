import { model, Schema } from "mongoose";
import { MessageReactionState } from "../types";

const MessageReactionSchema = new Schema<MessageReactionState>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    emoji: {
      type: String,
      required: true,
      trim: true,
      // 커스텀 이모지 키를 고려해 넉넉히 제한
      minlength: 1,
      maxlength: 64,
    },

    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    versionKey: false,
    timestamps: false, // createdAt을 명시적으로 관리
  }
);

/** 같은 사용자가 같은 메시지에 같은 이모지를 중복으로 달지 못하도록 제약 */
MessageReactionSchema.index(
  { messageId: 1, userId: 1, emoji: 1 },
  { unique: true }
);

/** 메시지 단위 반응 목록/카운트 조회 최적화 */
MessageReactionSchema.index({ messageId: 1, createdAt: -1 });

/** 방 단위 집계/모더레이션 로그 조회 최적화 */
MessageReactionSchema.index({ roomId: 1, createdAt: -1 });

export const MessageReaction = model<MessageReactionState>(
  "MessageReaction",
  MessageReactionSchema
);
