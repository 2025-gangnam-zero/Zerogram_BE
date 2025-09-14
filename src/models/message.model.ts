import { Schema, model, Types } from "mongoose";

export interface MessageAttachment {
  url: string;
  mime: string;
  width?: number;
  height?: number;
  size?: number; // bytes
}

export interface MessageState {
  _id: Types.ObjectId;

  roomId: Types.ObjectId;
  authorId: Types.ObjectId;

  /** 시퀀스: 방 단위 단조 증가 */
  seq: number;

  content: string; // 텍스트(최대 250자)
  attachments: MessageAttachment[];

  editedAt?: Date | null;
  deleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<MessageAttachment>(
  {
    url: { type: String, required: true },
    mime: { type: String, required: true },
    width: Number,
    height: Number,
    size: Number,
  },
  { _id: false }
);

const MessageSchema = new Schema<MessageState>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    seq: { type: Number, required: true, index: true },

    content: { type: String, required: true, maxlength: 250 },
    attachments: { type: [AttachmentSchema], default: [] },

    editedAt: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

/** 방 내 시퀀스 정렬/페이지네이션 */
MessageSchema.index({ roomId: 1, seq: -1 });
/** 방 내 시간 정렬(대체/보조 인덱스) */
MessageSchema.index({ roomId: 1, createdAt: -1 });

export const Message = model<MessageState>("Message", MessageSchema);
