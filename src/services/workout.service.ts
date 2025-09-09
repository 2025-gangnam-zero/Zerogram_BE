import mongoose, { Types } from "mongoose";
import { workoutRepository } from "../repositories";

import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";
import {
  FitnessDetailCreateDto,
  WorkoutCreateDto,
  WorkoutDetailAndFitnessDetailCreateDto,
  WorkoutDetailCreateDto,
} from "../dtos";
import { FitnessDetailState } from "types";

class WorkoutService {
  // workoutId를 이용한 운동일지 조회
  async getWorkoutById(workoutId: Types.ObjectId) {
    try {
      const workout = await workoutRepository.getWorkoutById(workoutId);

      if (!workout) {
        throw new NotFoundError("운동일지 조회 실패");
      }

      return workout;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 아이디를 이용한 운동일지 목록 조회
  async getWoroutListByUserId(
    userId: Types.ObjectId,
    year: number,
    month: number
  ) {
    try {
      const workouts = await workoutRepository.getWoroutListByUserId(
        userId,
        year,
        month
      );

      return workouts;
    } catch (error) {
      throw error;
    }
  }

  // 피트니스 상세 생성
  async createFitnessDetail(fitness: FitnessDetailCreateDto) {
    const newFitness = await workoutRepository.createFitnessDetail(fitness);

    if (!newFitness) {
      throw new InternalServerError("피트니스 상세 생성 실패");
    }

    return newFitness;
  }

  // 운동일지 상세 생성
  async createWorkoutDetail(workoutDetail: WorkoutDetailCreateDto) {
    try {
      const newWorkoutDetail = await workoutRepository.createWorkoutDetail(
        workoutDetail
      );

      if (!newWorkoutDetail) {
        throw new InternalServerError("운동일지 상세 생성 실패");
      }

      return newWorkoutDetail;
    } catch (error) {
      throw error;
    }
  }

  // 운동일지 생성
  async createWorkout(userId: Types.ObjectId, date: string) {
    try {
      const workout = await workoutRepository.createWorkout(userId, date);

      if (!workout) {
        throw new InternalServerError("운동일지 생성 실패");
      }

      return workout;
    } catch (error) {
      throw error;
    }
  }

  // 피트니스 상세를 운동 상세에 추가
  async addFitnessDetails(
    workoutDetailId: Types.ObjectId,
    fitnessDetailIds: Types.ObjectId[]
  ) {
    try {
      const workoutDetail = await workoutRepository.addFitnessDetails(
        workoutDetailId,
        fitnessDetailIds
      );

      if (!workoutDetail) {
        throw new InternalServerError("피트니스 상세 추가 실패");
      }

      return workoutDetail;
    } catch (error) {
      throw error;
    }
  }

  // 피트니스 상세 생성 및 운동일지 상세 추가
  async createFitnessDetailAndAddToWorkoutDetail(
    workoutDetailId: Types.ObjectId,
    fitnessDetails: FitnessDetailCreateDto[]
  ) {
    try {
      // 피트니스 상세 생성
      const newFitnessDetails: FitnessDetailState[] = await Promise.all(
        fitnessDetails.map((d) => this.createFitnessDetail(d))
      );

      console.log("추가된 피트니스 배열", newFitnessDetails);

      const fitnessDetailIds = newFitnessDetails.map((d) => d._id);

      console.log("피트니스 아이디 배열", fitnessDetailIds);

      // 운동 상세에 피트니스 상세 추가
      const workoutDetail = await this.addFitnessDetails(
        workoutDetailId,
        fitnessDetailIds
      );

      return {
        ...workoutDetail,
        fitnessDetails: newFitnessDetails,
      };
    } catch (error) {
      throw error;
    }
  }

  // 피트니스 상세 및 운동 일지 상세 생성
  async createFitnessDetailAndWorkoutDetail(
    workoutDetail: WorkoutDetailAndFitnessDetailCreateDto
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { fitnessDetails, ...rest } = workoutDetail;

      let details = undefined;
      if (fitnessDetails) {
        // 피트니스 상세 저장
        details = await Promise.all(
          fitnessDetails.map((fitness) => this.createFitnessDetail(fitness))
        );
      }

      const newWorkoutDetail = {
        ...rest,
        fitnessDetails: details ? details.map((d) => d._id) : undefined,
      } as WorkoutDetailCreateDto;

      // 운동 상세 저장
      const updatedWorkoutDetail = await workoutRepository.createWorkoutDetail(
        newWorkoutDetail
      );

      await session.commitTransaction();
      return updatedWorkoutDetail;
    } catch (error) {
      session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // 운동일지에 운동 상세 추가
  async addWorkoutDetails(
    workoutId: Types.ObjectId,
    workoutDetailIds: Types.ObjectId[]
  ) {
    try {
      const workout = await workoutRepository.addWorkoutDetails(
        workoutId,
        workoutDetailIds
      );

      if (!workout) {
        throw new InternalServerError("운동일지 상세 추가 실패");
      }

      return workout;
    } catch (error) {
      throw error;
    }
  }

  // 운동일지 상세 생성 및 운동일지에 상세 추가
  async creatWorkoutDetailsAndAddToWorkout(
    workoutId: Types.ObjectId,
    workoutDetails: WorkoutDetailAndFitnessDetailCreateDto[]
  ) {
    try {
      // 운동일지 상세 생성
      const newDetails = (await Promise.all(
        workoutDetails.map((detail) =>
          this.createFitnessDetailAndWorkoutDetail({
            ...detail,
            workoutId,
          })
        )
      )) as any[];

      const detailIds = newDetails.map((d) => d._id);

      const updatedWorkout = await this.addWorkoutDetails(workoutId, detailIds);

      return updatedWorkout;
    } catch (error) {
      throw error;
    }
  }

  // 운동일지 및 운동일지 상세 생성
  async createWorkoutAndDetail(workout: WorkoutCreateDto) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { userId, date, details } = workout;
      // 운동일지 생성
      const newWorkout = await this.createWorkout(userId, date);

      // 운동일지 상세 생성
      const updatedWorkout = await this.creatWorkoutDetailsAndAddToWorkout(
        newWorkout._id,
        details
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
    workoutDetailId: Types.ObjectId
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

  // 운동일지 상세 삭제
  async deleteWorkoutDetailById(workoutDetailId: Types.ObjectId) {
    try {
      const result = await workoutRepository.deleteWorkoutDetail(
        workoutDetailId
      );

      if (!result.acknowledged || result.deletedCount === 0) {
        throw new InternalServerError("운동일지 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 피트니스 상세 삭제
  async deleteFitnessDetailById(fitnessDetailId: Types.ObjectId) {
    try {
      const result = await workoutRepository.deleteFitnessDetail(
        fitnessDetailId
      );

      if (!result.acknowledged || result.deletedCount === 0) {
        throw new InternalServerError("운동일지 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new WorkoutService();
