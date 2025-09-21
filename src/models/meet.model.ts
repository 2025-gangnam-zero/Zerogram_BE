import mongoose, { Schema, Types } from "mongoose";
import { CommentState, MeetState } from "types/meet.type";

const CommentSchema = new mongoose.Schema<CommentState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Comment = mongoose.model("Comment", CommentSchema);

const MeetSchema = new mongoose.Schema<MeetState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
    },
    workout_type: {
      type: String,
      required: true,
      enum: ["running", "fitness"],
    },
    location: {
      type: String,
      required: true,
      enum: ["강남구", "서초구"],
    },
    // ✅ 채팅방과 1:1 링크
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      index: true,
      unique: true,
      sparse: true, // 기존 데이터 이행 중 null 허용
    },

    // ✅ 모집글 참여자 유지
    crews: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: function (this: any) {
        return this.userId ? [this.userId] : [];
      },
      validate: {
        validator: (arr: Types.ObjectId[]) =>
          Array.isArray(arr) && new Set(arr.map(String)).size === arr.length,
        message: "crews 배열에 중복 userId가 있습니다.",
      },
    },

    comments: {
      type: [Schema.Types.ObjectId],
      ref: "Comment",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Meet = mongoose.model("Meet", MeetSchema);
