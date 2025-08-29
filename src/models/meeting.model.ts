import mongoose from "mongoose";
import { MeetingState } from "types/meeting.type";

const MeetingSchema = new mongoose.Schema<MeetingState>(
  {
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
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Meeting = mongoose.model("Meeting", MeetingSchema);
