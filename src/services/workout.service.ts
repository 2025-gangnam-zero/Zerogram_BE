import mongoose, { Types } from "mongoose";
import { workoutRepository } from "../repositories";
import {
  FitnessType,
  RunningType,
  WorkoutCreateDto,
  WorkoutType,
  WorkoutUpdateDto,
} from "../types";
import { InternalServerError, UnauthorizedError } from "../errors";

class WorkoutService {
  // workoutId를 이용한 운동일지 조회
  async getWorkoutById(workoutId: Types.ObjectId) {
    try {
      const workout = await workoutRepository.getWorkoutById(workoutId);

      if (!workout) {
        throw new InternalServerError("운동일지 조회 실패");
      }

      return workout;
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

  // 러닝 운동일지 생성
  async createRunning(running: RunningType) {
    try {
      const newRunning = await workoutRepository.createRunning(running);

      if (!newRunning) throw new InternalServerError("러닝 운동일지 생성 실패");

      return newRunning;
    } catch (error) {
      throw error;
    }
  }

  // 피트니스 운동일지 생성
  async createFitness(fitness: FitnessType) {
    try {
      const newFitness = await workoutRepository.createFitness(fitness);

      if (!newFitness) throw new InternalServerError("피트니스 생성 실패");

      return newFitness;
    } catch (error) {
      throw error;
    }
  }

  // 운동일지 생성
  async createWorkout(workout: WorkoutCreateDto) {
    const { running, fitness, ...rest } = workout;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 운동일지 생성
      let newWorkout = await workoutRepository.createWorkout(rest);

      // 운동 일지 상세 생성
      if (workout.workout_name === "running" && running) {
        const newRuning = await this.createRunning({
          ...running,
          workoutId: newWorkout._id,
        });

        newWorkout = await this.updateWorkoutRunning(newWorkout._id, newRuning);
      } else if (workout.workout_name === "fitness" && fitness) {
        const newFitness = await this.createFitness({
          ...fitness,
          workoutId: newWorkout._id,
        });

        newWorkout = await this.updateWorkoutFitness(
          newWorkout._id,
          newFitness
        );
      }

      if (!newWorkout) {
        throw new InternalServerError("운동 일지 생성 실패");
      }

      await session.commitTransaction();
      return newWorkout;
    } catch (error) {
      session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // 운동 일지 상세 생성
  async createWorkoutDetail(
    workoutId: Types.ObjectId,
    workout_name: WorkoutType,
    detail: RunningType | FitnessType,
    userId: Types.ObjectId
  ) {
    try {
      let workout = await this.getWorkoutById(workoutId);

      if (workout.userId !== userId) {
        throw new UnauthorizedError("운동일지 상세 생성 권한 없음");
      }

      if (workout_name === "running") {
        const running = await this.createRunning(detail as RunningType);

        workout = await this.updateWorkoutRunning(workoutId, running);
      } else if (workout_name === "fitness") {
        const fitness = await this.createFitness(detail as FitnessType);

        workout = await this.updateWorkoutFitness(workoutId, fitness);
      }

      return workout;
    } catch (error) {
      throw error;
    }
  }

  // 러닝 업데이트
  async updateWorkoutRunning(workoutId: Types.ObjectId, running: RunningType) {
    try {
      const newWorkout = await workoutRepository.updateWorkoutRunning(
        workoutId,
        running
      );

      if (!newWorkout) throw new InternalServerError("러닝 일지 추가 실패");

      return newWorkout;
    } catch (error) {
      throw error;
    }
  }

  // 피트니스 업데이트
  async updateWorkoutFitness(workoutId: Types.ObjectId, fitness: FitnessType) {
    try {
      const newWorkout = await workoutRepository.updateWorkoutFitness(
        workoutId,
        fitness
      );

      if (!newWorkout) throw new InternalServerError("피트니스 추가 실패");

      return newWorkout;
    } catch (error) {
      throw error;
    }
  }

  // 운동일지 전체 업데이트
  async updateWorkout(
    workoutId: Types.ObjectId,
    updatedWorkout: WorkoutUpdateDto,
    userId: Types.ObjectId
  ) {
    try {
      const workout = await this.getWorkoutById(workoutId);

      if (workout.userId !== userId) {
        throw new UnauthorizedError("운동일지 수정 권한 없음");
      }

      const result = await workoutRepository.updateWorkout(
        workoutId,
        updatedWorkout
      );

      if (!result) {
        throw new InternalServerError("운동일지 수정 실패");
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}

export default new WorkoutService();
