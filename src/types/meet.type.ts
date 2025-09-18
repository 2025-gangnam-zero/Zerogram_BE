import { Types } from "mongoose";
import { WorkoutType } from "../types";

export interface MeetState {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description: string;
  images?: string[];
  workout_type: WorkoutType;
  location: LocationType;
  crews: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentState {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: String;
  createdAt: Date;
  updatedAt: Date;
}

// 지역
export type LocationType = "강남구" | "서초구";

// 작성자
export interface CrewType {
  userId: Types.ObjectId;
  nickname: string;
}
