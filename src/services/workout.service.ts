import mongoose, { Types } from "mongoose";
import { workoutRepository } from "../repositories";
import {
  WorkoutCreateDto,
  WorkoutDetailCreateDto,
  WorkoutDetailState,
  WorkoutDetailUpdateDto,
  WorkoutState,
} from "../types";
import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";

class WorkoutService {
  // workoutId를 이용한 운동일지 조회
  async getWorkoutById(workoutId: Types.ObjectId) {
    try {
      const workout = await workoutRepository.getWorkoutById(workoutId);

      if (!workout) {
        throw new NotFoundError("운동일지 조회 실패");
      }

      const detailIds: Types.ObjectId[] = workout.details;

      const details =
        detailIds.length > 0
          ? await Promise.all(
              detailIds.map((detailId) => this.getWorkoutDetailById(detailId))
            )
          : [];

      return {
        ...workout,
        details,
      };
    } catch (error) {
      throw error;
    }
  }

  // 사용자 아이디를 이용한 운동일지 목록 조회
  async getWoroutListByUserId(userId: Types.ObjectId) {
    try {
      const workouts = await workoutRepository.getWoroutListByUserId(userId);

      return workouts;
    } catch (error) {
      throw error;
    }
  }

  // 운동일지 상세 생성
  async createWorkoutDetail(workoutDetail: WorkoutDetailCreateDto) {
    try {
      const newDetail = await workoutRepository.createWorkoutDetail(
        workoutDetail
      );

      if (!newDetail) {
        throw new InternalServerError("운동일지 상세 생성 실패");
      }

      return newDetail;
    } catch (error) {
      throw error;
    }
  }

  // 운동 일지 생성
  async createWorkout(userId: Types.ObjectId): Promise<WorkoutState> {
    try {
      const newWorkout = await workoutRepository.createWorkout(userId);

      if (!newWorkout) throw new InternalServerError("운동일지 생성 실패");

      return newWorkout;
    } catch (error) {
      throw error;
    }
  }

  // 운동 일지 상세 추가
  async addNewWorkoutDetails(
    workoutId: Types.ObjectId,
    details: WorkoutDetailState[]
  ) {
    try {
      const workout = await workoutRepository.addWorkoutDetail(
        workoutId,
        details
      );

      if (!workout) {
        throw new InternalServerError("운동 일지 상세 추가 실패");
      }

      return workout;
    } catch (error) {
      throw error;
    }
  }

  // 운동 일지 상세 생성 및 운동일지에 운동일지 상세 추가
  async createNewWorkoutDetailsAndAddToWorkout(
    workoutId: Types.ObjectId,
    details: WorkoutDetailCreateDto[]
  ) {
    try {
      const newDetails = await Promise.all(
        details.map((detail) => this.createWorkoutDetail(detail))
      );

      // 운동일지에 운동일지 상세 추가
      const workout = await this.addNewWorkoutDetails(workoutId, newDetails);

      return workout;
    } catch (error) {
      throw error;
    }
  }

  // 운동일지 및 운동 상세 생성
  async createWorkoutAndDetail(workout: WorkoutCreateDto) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { userId, details } = workout;

      // 운동일지 생성
      const newWorkout = await this.createWorkout(userId);

      const modifiedDetails: WorkoutDetailCreateDto[] = details.map(
        (detail) => ({
          ...detail,
          workoutId: newWorkout._id,
        })
      );

      // 운동일지 상세 생성 및 운동일지에 운동일지 상세 추가
      const updatedWorkout = this.createNewWorkoutDetailsAndAddToWorkout(
        newWorkout._id,
        modifiedDetails
      );

      await session.commitTransaction();

      return updatedWorkout;
    } catch (error) {
      session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // 운동일지 상세 조회
  async getWorkoutDetailById(workoutDetailId: Types.ObjectId) {
    try {
      const workoutDetail = await workoutRepository.getWorkoutDetailById(
        workoutDetailId
      );

      if (!workoutDetail) {
        throw new InternalServerError("운동일지 상세 조회 실패");
      }

      return workoutDetail;
    } catch (error) {
      throw error;
    }
  }

  // 운동일지 상세 수정
  async updateWorkoutDetailById(
    userId: Types.ObjectId,
    workoutId: Types.ObjectId,
    workoutDetailId: Types.ObjectId,
    workoutDetail: WorkoutDetailUpdateDto
  ) {}

  // 운동일지 삭제
  async deleteWorkoutById(workoutId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const workout = await this.getWorkoutById(workoutId);

      if (workout.userId !== userId) {
        throw new UnauthorizedError("운동일지 삭제 권한 없음");
      }

      const result = await workoutRepository.deleteWorkout(workoutId);

      if (!result.acknowledged || result.deletedCount === 0) {
        throw new InternalServerError("운동일지 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new WorkoutService();
