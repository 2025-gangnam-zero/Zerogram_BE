import { mongoDBErrorHandler } from "../utils";
import {
  FitnessType,
  RunningType,
  WorkoutCreateDto,
  WorkoutState,
  WorkoutUpdateDto,
} from "../types";
import { Fitness, Running, Workout } from "../models";
import { Types } from "mongoose";

class WorkoutRepository {
  // 운동일지 아이디를 이용한 운동일지 조회
  async getWorkoutById(workoutId: Types.ObjectId) {
    try {
      const workout = await Workout.findById({ _id: workoutId }).lean();

      return workout;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutById", error);
    }
  }

  // 사용자 운동일지 조회
  async getWoroutListByUserId(userId: Types.ObjectId) {
    try {
      const workouts = await Workout.find({ userId }).lean();

      return workouts;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutListByUserId", error);
    }
  }

  // 운동일지 생성
  async createWorkout(workout: WorkoutCreateDto): Promise<WorkoutState> {
    try {
      const newWorkout = await Workout.create(workout);

      return newWorkout;
    } catch (error) {
      throw mongoDBErrorHandler("createWorkout", error);
    }
  }

  // 러닝 생성
  async createRunning(running: RunningType) {
    try {
      const newRunning = await Running.create(running);

      return newRunning;
    } catch (error) {
      throw mongoDBErrorHandler("createRunning", error);
    }
  }

  // 피트니스 생성
  async createFitness(fitness: FitnessType) {
    try {
      const newFitness = await Fitness.create(fitness);

      return newFitness;
    } catch (error) {
      throw mongoDBErrorHandler("createFitness", error);
    }
  }

  // 운동일지 러닝 업데이트
  async updateWorkoutRunning(workoutId: Types.ObjectId, running: RunningType) {
    try {
      const result = await Workout.findOneAndUpdate(
        { _id: workoutId },
        {
          $set: {
            running,
          },
        },
        {
          new: true,
        }
      ).lean();

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateFitness", error);
    }
  }

  // 운동일지 피트니스 업데이트
  async updateWorkoutFitness(workoutId: Types.ObjectId, fitness: FitnessType) {
    try {
      const newFitness = await Workout.findOneAndUpdate(
        {
          _id: workoutId,
        },
        {
          fitness: {
            $addToSet: {
              fitness,
            },
          },
        },
        {
          new: true,
        }
      );

      return newFitness;
    } catch (error) {
      throw mongoDBErrorHandler("updateWorkoutFitness", error);
    }
  }

  // 운동일지 수정
  async updateWorkout(
    workoutId: Types.ObjectId,
    updatedWorkout: WorkoutUpdateDto
  ) {
    try {
      const result = await Workout.findOneAndUpdate(
        { _id: workoutId },
        { ...updatedWorkout },
        { new: true }
      );

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateWorkout", error);
    }
  }
}

export default new WorkoutRepository();
