import mongoose, { Schema } from "mongoose";
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
    crews: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: function (this: any) {
        return this.userId ? [this.userId] : [];
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
