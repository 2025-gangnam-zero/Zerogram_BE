import { LocationType } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { CrewType, WorkoutType } from "types";

// 클라이언트측에서 전달해야 하는 타입
export interface MeetCreateRequestDto {
  userId: Types.ObjectId; // 서버 전용
  title: string;
  description: string;
  images?: string[];
  workout_type: WorkoutType;
  location: LocationType;
}

export interface MeetingResponseDto {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  nickname: string;
  title: string;
  description: string;
  workout_type: WorkoutType;
  location: LocationType;
  crews: CrewType[];
  comments: CommentResponseDto[];
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
  userId: Types.ObjectId; // 서버 전용
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
export interface CommentUpdateRequesetDto {
  userId: Types.ObjectId; // 서버 전용
  content: string;
}

export interface CommentUpdateDto {
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
