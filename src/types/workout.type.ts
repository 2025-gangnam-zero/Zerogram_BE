import { Types } from "mongoose";

export type WorkoutType = "running" | "fitness";

export interface WorkoutState {
  // 공통
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  workout_name: WorkoutType; // 운동 종류 : 러닝, 피트니스
  duration: number; // 운동 시간
  calories: number; // 소모 칼로리
  feedback: string; // 소감, 감상
  createdAt: Date; // 생성 시각
  updatedAt: Date; // 수정 시각

  // 러닝
  running?: RunningType;

  // 피트니스
  fitness?: FitnessType[];
}

export interface FitnessType {
  workoutId: Types.ObjectId; // 운동일지 아이디
  body_part: string; // 부위
  fitness_type: string; // 종목
  sets: number; // 세트 수
  reps: number; // 횟수
  weight: number; // 무게
}

export interface RunningType {
  workoutId: Types.ObjectId; // 운동일지 아이디
  avg_pace: number; // 평균 페이스
  distance: number; // 거리
}

export interface WorkoutCreateDto {
  userId: Types.ObjectId; // 사용자 아이디
  workout_name: WorkoutType; // 운동 종류 : 러닝, 피트니스
  duration: number; // 운동 시간
  calories: number; // 소모 칼로리
  feedback: string; // 소감, 감상
  running?: RunningType;
  fitness?: FitnessType;
}
