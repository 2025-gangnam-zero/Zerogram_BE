import mongoose from "mongoose";
import { MeetingState } from "types/meeting.type";

const MeetingSchema = new mongoose.Schema<MeetingState>(
  {},
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Meeting = mongoose.model("Meeting", MeetingSchema);
