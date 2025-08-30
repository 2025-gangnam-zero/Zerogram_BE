import mongoose, { Schema } from "mongoose";
import { MeetingState, ReplyState } from "../types";

const ReplySchema = new mongoose.Schema<ReplyState>({
  meetingId: {
    type: Schema.Types.ObjectId,
    ref: "Meeting",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

export const Reply = mongoose.model("Reply", ReplySchema);

const MeetingSchema = new mongoose.Schema<MeetingState>(
  {
    writer: {
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
    location: {
      type: String,
      required: true,
    },
    workout_type: {
      type: String,
      required: true,
    },
    participant_number: {
      type: Number,
      required: true,
    },
    meeting_date: {
      type: {
        year: Number,
        month: Number,
        date: Number,
        hour: Number,
        minute: Number,
      },
      required: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    replies: {
      type: [ReplySchema],
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Meeting = mongoose.model("Meeting", MeetingSchema);
