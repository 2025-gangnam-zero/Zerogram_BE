import { Types } from "mongoose";
import {
  FitnessDetailState,
  WorkoutDetailState,
  WorkoutState,
  WorkoutType,
} from "types";

export interface FitnessDetailCreateDto {
  body_part: string;
  fitness_type: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutDetailCreateDto {
  workoutId: Types.ObjectId;
  workout_name: WorkoutType;
  duration: number; // 운동 시간
  calories: number; // 소모 칼로리
  feedback?: string; // 소감, 감상

  // 피트니스
  fitnessDetails: Types.ObjectId[];

  // 러닝
  avg_pace?: number; // 평균 페이스
  distance?: number; // 거리
}

export interface WorkoutDetailAndFitnessDetailCreateDto {
  workoutId: Types.ObjectId;
  workout_name: WorkoutType;
  duration: number; // 운동 시간
  calories: number; // 소모 칼로리
  feedback?: string; // 소감, 감상

  // 피트니스
  fitnessDetails: FitnessDetailCreateDto[];

  // 러닝
  avg_pace?: number; // 평균 페이스
  distance?: number; // 거리
}

export interface WorkoutCreateDto {
  userId: Types.ObjectId;
  date: string;
  details: WorkoutDetailAndFitnessDetailCreateDto[];
}

/** FitnessDetail 응답 DTO (State와 동일 구조) */
export interface FitnessDetailDto extends FitnessDetailState {}

/** WorkoutDetail 응답 DTO: fitnessDetails를 문서 배열로 확장 */
export interface WorkoutDetailDto
  extends Omit<WorkoutDetailState, "fitnessDetails"> {
  fitnessDetails: FitnessDetailDto[];
}

/** 최종 응답 DTO: details를 ObjectId[] → WorkoutDetailDto[] 로 확장 */
export interface WorkoutResponseDto extends Omit<WorkoutState, "details"> {
  details: WorkoutDetailDto[];
}
