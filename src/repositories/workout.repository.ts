import {
  aggregateGetWorkoutById,
  aggregateGetWorkoutsByUserIdForMonth,
  mongoDBErrorHandler,
} from "../utils";
import { WorkoutDetailState, WorkoutState } from "../types";
import { FitnessDetail, Workout, WorkoutDetail } from "../models";
import { DeleteResult, Types } from "mongoose";
import {
  FitnessDetailCreateDto,
  FitnessDetailUpdateRequestDto,
  WorkoutDetailCreateDto,
  WorkoutDetailUpdateRequestDto,
  WorkoutResponseDto,
  WorkoutUpdateRequestDto,
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
      const newFitness = await FitnessDetail.create(fitness);

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
      const workout = await Workout.findOneAndUpdate(
        { _id: workoutId },
        {
          $addToSet: {
            details: detailIds,
          },
        },
        {
          new: true,
        }
      ).lean();

      return workout;
    } catch (error) {
      throw mongoDBErrorHandler("", error);
    }
  }

  // 피트니스 상세 아이디 추가
  async addFitnessDetails(
    workoutDetailId: Types.ObjectId,
    fitnessDetailIds: Types.ObjectId[]
  ) {
    try {
      const workoutDetail = await WorkoutDetail.findOneAndUpdate(
        { _id: workoutDetailId },

        { $addToSet: { fitnessDetails: { $each: fitnessDetailIds } } },

        { new: true }
      ).lean();

      return workoutDetail;
    } catch (error) {
      throw mongoDBErrorHandler("", error);
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

  // 운동일지 상세 삭제
  async deleteWorkoutDetail(
    workoutDetailId: Types.ObjectId
  ): Promise<DeleteResult> {
    try {
      const result = await WorkoutDetail.deleteOne({ _id: workoutDetailId });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteWorkoutDetail", error);
    }
  }

  // 피트니스 상세 삭제
  async deleteFitnessDetail(
    fitnessDetailId: Types.ObjectId
  ): Promise<DeleteResult> {
    try {
      const result = await FitnessDetail.deleteOne({ _id: fitnessDetailId });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteFitnessDetail", error);
    }
  }

  // 운동 일지 수정
  async updateWorkout(
    workoutId: Types.ObjectId,
    updatedWorkout: WorkoutUpdateRequestDto
  ) {
    try {
      const workout = await Workout.findOneAndUpdate(
        { _id: workoutId },
        {
          $set: updatedWorkout,
        },
        {
          new: true,
          upsert: false,
          lean: true,
          omitUndefined: true,
        }
      );

      return workout;
    } catch (error) {
      throw mongoDBErrorHandler("updateWorkout", error);
    }
  }

  // 운동일지 상세 수정
  async updateWorkoutDetail(
    workoutDetailId: Types.ObjectId,
    workoutDetail: WorkoutDetailUpdateRequestDto
  ) {
    try {
      const detail = await WorkoutDetail.findOneAndUpdate(
        {
          _id: workoutDetailId,
        },
        {
          $set: workoutDetail,
        },
        {
          new: true,
          upsert: false,
          lean: true,
          omitUndefined: true,
        }
      );

      return detail;
    } catch (error) {
      throw mongoDBErrorHandler("updateWorkoutDetail", error);
    }
  }

  // 피트니스 상세 수정
  async updateFitnessDetail(
    fitnessDetailId: Types.ObjectId,
    updatedFitness: FitnessDetailUpdateRequestDto
  ) {
    try {
      const fitnessDetail = await FitnessDetail.findOneAndUpdate(
        {
          _id: fitnessDetailId,
        },
        {
          $set: updatedFitness,
        },
        {
          new: true,
          upsert: false,
          lean: true,
          omitUndefined: true,
        }
      );

      return fitnessDetail;
    } catch (error) {
      throw mongoDBErrorHandler("updateFitnessDetail", error);
    }
  }
}

export default new WorkoutRepository();
