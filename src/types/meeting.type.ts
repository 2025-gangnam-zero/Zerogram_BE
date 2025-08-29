import { Document, Types } from "mongoose";

export interface MeetingDateType {
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
}

export interface MeetingState extends Document {
  title: string;
  description: string;
  location: string;
  workout_type: string;
  participant_number: number;
  meeting_date: MeetingDateType;
  participants: Types.ObjectId[];
  replies: ReplyState[];
}

export interface MeetingUpdateDto {
  title?: string;
  description?: string;
  location?: string;
  workout_type?: string;
  participant_number?: number;
  meeting_date?: MeetingDateType;
}

export interface ReplyState extends Document {
  meetingId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
}
