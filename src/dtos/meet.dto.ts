import { Types } from "mongoose";
import { CrewType, WorkoutType, LocationType } from "../types";

// 클라이언트측에서 전달해야 하는 타입
export interface MeetCreateRequestDto {
  userId: Types.ObjectId; // 서버 전용
  title: string;
  description: string;
  images?: string[];
  workout_type: WorkoutType;
  location: LocationType;
}

export interface MeetResponseDto {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  nickname: string;
  title: string;
  description: string;
  images?: string[];
  workout_type: WorkoutType;
  location: LocationType;
  crews: CrewType[];
  comments: CommentResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

// 클라이언트측에서 전달해야 하는 타입
export interface CommentCreateRequestDto {
  userId: Types.ObjectId; // 서버 전용
  content: string;
}

export interface CommentResponseDto {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  nickname: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// 클라에서 받아야 하는 정보
export interface MeetUpdateRequestDto {
  title?: string;
  description?: string;
  images?: string[];
  workout_type?: WorkoutType;
  location?: LocationType;
}

// 실제 수정 정보
export interface MeetUpdateDto {
  title?: string;
  description?: string;
  images?: string[];
  workout_type?: WorkoutType;
  location?: LocationType;
}

// 클라에서 받아야 하는 정보
export interface CommentUpdateRequestDto {
  content: string;
}

export interface MeetDeleteRequestDto {
  meetId: Types.ObjectId;
}

export interface MeetDeleteDto {
  meetId: Types.ObjectId;
}

export interface CommentDeleteRequestDto {
  commentId: Types.ObjectId;
}

export interface CommentDeleteDto {
  meetId: Types.ObjectId;
}

export interface MeetListOpts {
  match?: Record<string, any>; // 예: { location: "강남구", workout_type: "running" }
  skip?: number; // 기본 0
  limit?: number; // 기본 20
  sort?: Record<string, 1 | -1>; // 기본 { createdAt: -1, _id: -1 }
}
