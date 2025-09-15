import { model, Schema } from "mongoose";
import { Attachment, MessageState } from "../types";

const AttachmentSchema = new Schema<Attachment>(
  {
    kind: { type: String, enum: ["image", "file"], required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: null },
    size: { type: Number, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null },
    originalName: { type: String, default: null },
    thumbUrl: { type: String, default: null },
  },
  { _id: false }
);

const MessageSchema = new Schema<MessageState>(
  {
    clientMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    seq: { type: Number, required: true, min: 1 }, // (roomId, seq)로 유니크 보장

    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "system.notice"],
      required: true,
    },

    content: { type: String, default: null },
    attachments: { type: [AttachmentSchema], default: [] },

    createdAt: { type: Date, required: true, default: () => new Date() },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: false, // createdAt을 서버 권위로 직접 세팅하므로 별도 timestamps 사용 안 함
  }
);

/** --- 인덱스 & 제약 --- */
// 방 내 시퀀스 유니크
MessageSchema.index({ roomId: 1, seq: 1 }, { unique: true });

// 룸 타임라인 페이지네이션 최적화
MessageSchema.index({ roomId: 1, createdAt: -1 });

// 작성자별 히스토리(선택)
MessageSchema.index({ authorId: 1, createdAt: -1 });

/** --- 조건부 필수 검증 --- */
MessageSchema.pre("validate", function (next) {
  const doc = this as unknown as MessageState;

  // content 필수: text/system.notice
  if (doc.type === "text" || doc.type === "system.notice") {
    if (!doc.content || doc.content.trim().length === 0) {
      return next(new Error("content is required for type=text/system.notice"));
    }
  }

  // attachments 필수: image/file
  if (doc.type === "image" || doc.type === "file") {
    if (!doc.attachments || doc.attachments.length === 0) {
      return next(new Error("attachments are required for type=image/file"));
    }
  }

  // seq 정수화 가드
  if (typeof doc.seq === "number") {
    (this as any).seq = Math.floor(doc.seq);
  }

  next();
});

/** toJSON 정리 */
MessageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    // 필요하다면 내부 필드 정리
    return ret;
  },
});

export const Message = model<MessageState>("Message", MessageSchema);
