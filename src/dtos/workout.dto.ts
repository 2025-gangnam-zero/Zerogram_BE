import { Types } from "mongoose";
import { WorkoutType } from "types";

export interface FitnessDetailCreateDto {
  workoutDetail: Types.ObjectId;
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
  details: WorkoutDetailAndFitnessDetailCreateDto[];
}
