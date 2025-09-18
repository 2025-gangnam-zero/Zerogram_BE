import { Types } from "mongoose";
import { WorkoutType } from "./workout.type";

export interface MeetState {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description: string;
  images?: string[];
  workout_type: WorkoutType;
  location: string;
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
  userId: string;
  nickname: string;
}
