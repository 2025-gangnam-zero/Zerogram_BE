import { Types } from "mongoose";

export interface MeetingDateType {
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
}

export interface MeetingState {
  _id: Types.ObjectId;
  writer: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  workout_type: string;
  participant_number: number;
  meeting_date: MeetingDateType;
  participants: Types.ObjectId[];
  replies: ReplyState[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingUpdateDto {
  title?: string;
  description?: string;
  location?: string;
  workout_type?: string;
  participant_number?: number;
  meeting_date?: MeetingDateType;
}

export interface ReplyState {
  _id: Types.ObjectId;
  meetingId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}
