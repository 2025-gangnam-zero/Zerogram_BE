import {
  aggregateGetWorkoutById,
  aggregateGetWorkoutsByUserIdForMonth,
  mongoDBErrorHandler,
} from "../utils";
import { WorkoutDetailState, WorkoutState } from "../types";
import { FitnessDetail, Workout, WorkoutDetail } from "../models";
import { Types } from "mongoose";
import {
  FitnessDetailCreateDto,
  WorkoutDetailCreateDto,
  WorkoutResponseDto,
} from "../dtos";

class WorkoutRepository {
  // 운동일지 아이디를 이용한 운동일지 조회
  async getWorkoutById(
    workoutId: Types.ObjectId
  ): Promise<WorkoutResponseDto | null> {
    try {
      const workout = await aggregateGetWorkoutById(workoutId);

      return workout;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutById", error);
    }
  }

  // 사용자 운동일지 조회
  async getWoroutListByUserId(
    userId: Types.ObjectId,
    year: number,
    month: number
  ) {
    try {
      const workouts = await aggregateGetWorkoutsByUserIdForMonth(
        userId,
        year,
        month
      );

      return workouts;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutListByUserId", error);
    }
  }

  // 피트니스 상세 생성
  async createFitnessDetail(fitness: FitnessDetailCreateDto) {
    try {
      const newFitness = FitnessDetail.create(fitness);

      return newFitness;
    } catch (error) {
      throw mongoDBErrorHandler("createFitnessDetail", error);
    }
  }

  // 운동일지 생성
  async createWorkout(
    userId: Types.ObjectId,
    date: string
  ): Promise<WorkoutState> {
    try {
      const newWorkout = await Workout.create({ userId, date });

      return newWorkout;
    } catch (error) {
      throw mongoDBErrorHandler("createWorkout", error);
    }
  }

  // 운동 일지 상세 생성
  async createWorkoutDetail(workoutDetail: WorkoutDetailCreateDto) {
    try {
      const newDetail = await WorkoutDetail.create(workoutDetail);

      return newDetail;
    } catch (error) {
      throw mongoDBErrorHandler("createWorkoutDetail", error);
    }
  }

  // 운동 일지 상세 추가
  async addWorkoutDetail(
    workoutId: Types.ObjectId,
    details: WorkoutDetailState[]
  ) {
    try {
      const workoutDetail = await Workout.findOneAndUpdate(
        { _id: workoutId },
        {
          $addToSet: {
            details,
          },
        },
        {
          new: true,
        }
      );

      return workoutDetail;
    } catch (error) {
      throw mongoDBErrorHandler("addWorkoutDetail", error);
    }
  }

  // 운동일지 상세 조회
  async getWorkoutDetailById(workoutDetailId: Types.ObjectId) {
    try {
      const workoutDetail = await WorkoutDetail.findById({
        _id: workoutDetailId,
      }).lean();

      return workoutDetail;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutDetailById", error);
    }
  }

  // 운동일지에 운동일지 상세 추가
  async addWorkoutDetails(
    workoutId: Types.ObjectId,
    detailIds: Types.ObjectId[]
  ) {
    try {
      const workout = Workout.findOneAndUpdate(
        { _id: workoutId },
        {
          $addToSet: {
            details: detailIds,
          },
        },
        {
          new: true,
        }
      );

      return workout;
    } catch (error) {
      throw mongoDBErrorHandler("", error);
    }
  }

  // 운동일지 상셍 수정
  async updateWorkoutDetail(workoutDetail: WorkoutDetailState) {
    try {
      const detail = await Workout.findOneAndUpdate(
        {
          _id: workoutDetail._id,
        },
        {
          $set: {
            ...workoutDetail,
          },
        },
        {
          new: true,
        }
      );

      return detail;
    } catch (error) {
      throw mongoDBErrorHandler("updateWorkoutDetail", error);
    }
  }

  // 운동일지 삭제
  async deleteWorkout(workoutId: Types.ObjectId) {
    try {
      const result = await Workout.deleteOne({ _id: workoutId });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteWorkout", error);
    }
  }
}

export default new WorkoutRepository();
