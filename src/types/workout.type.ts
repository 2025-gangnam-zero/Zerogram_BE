import { Types } from "mongoose";

export type WorkoutType = "running" | "fitness";

export interface WorkoutState {
  // 공통
  _id: Types.ObjectId;
  workout_name: WorkoutType; // 운동 종류 : 러닝, 피트니스
  duration: string; // 운동 시간
  calories: string; // 소모 칼로리
  feedback: string; // 소감, 감상
  createdAt: Date; // 생성 시각
  updatedAt: Date; // 수정 시각

  // 러닝
  running?: RunningType;

  // 피트니스
  fitness?: FitnessType[];
}

export interface FitnessType {
  body_part: string; // 부위
  fitness_type: string; // 종목
  sets: number; // 세트 수
  reps: number; // 횟수
  weight: number; // 무게
}

export interface RunningType {
  avg_pace: string; // 평균 페이스
  distance: string; // 거리
}
