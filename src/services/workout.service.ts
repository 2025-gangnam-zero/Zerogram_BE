import mongoose, { Types } from "mongoose";
import { workoutRepository } from "../repositories";
import { FitnessType, RunningType, WorkoutCreateDto } from "../types";
import { InternalServerError } from "../errors";

class WorkoutService {
  async creatRunning(running: RunningType) {
    try {
      const newRunning = await workoutRepository.createRunning(running);

      if (!newRunning) throw new InternalServerError("러닝 운동일지 생성 실패");

      return newRunning;
    } catch (error) {
      throw error;
    }
  }

  async createFitness(fitness: FitnessType) {
    try {
      const newFitness = await workoutRepository.createFitness(fitness);

      if (!newFitness) throw new InternalServerError("피트니스 생성 실패");

      return newFitness;
    } catch (error) {
      throw error;
    }
  }

  async createWorkout(workout: WorkoutCreateDto) {
    const { running, fitness, ...rest } = workout;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 운동일지 생성
      let newWorkout = await workoutRepository.createWorkout(rest);

      // 운동 일지 상세 생성
      if (workout.workout_name === "running" && running) {
        const newRuning = await this.creatRunning({
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
}

export default new WorkoutService();
