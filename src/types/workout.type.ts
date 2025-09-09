import { Types } from "mongoose";

export type WorkoutType = "running" | "fitness";

export interface WorkoutState {
  // 공통
  _id: Types.ObjectId;
  date: string;
  userId: Types.ObjectId;
  createdAt: Date; // 생성 시각
  updatedAt: Date; // 수정 시각
  details: Types.ObjectId[];
}

export interface WorkoutDetailState {
  _id: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface FitnessDetailState {
  _id: Types.ObjectId;
  // workoutDetailId: Types.ObjectId;
  body_part?: string; // 부위
  fitness_type?: string; // 종목
  sets?: number; // 세트 수
  reps?: number; // 횟수
  weight?: number; // 무게
  createdAt: Date;
  updatedAt: Date;
}

// export interface WorkoutDetailUpdateDto {
//   workoutId: Types.ObjectId;
//   workout_name: WorkoutType;
//   duration: number; // 운동 시간
//   calories: number; // 소모 칼로리
//   feedback?: string; // 소감, 감상
//   // 피트니스
//   body_part?: string; // 부위
//   fitness_type?: string; // 종목
//   sets?: number; // 세트 수
//   reps?: number; // 횟수
//   weight?: number; // 무게
//   // 러닝
//   avg_pace?: number; // 평균 페이스
//   distance?: number; // 거리
// }
