import { mongoDBErrorHandler } from "../utils";
import {
  FitnessType,
  RunningType,
  WorkoutCreateDto,
  WorkoutState,
} from "../types";
import { Fitness, Running, Workout } from "../models";
import { Types } from "mongoose";

class WorkoutRepository {
  async getWorkoutById(workoutId: Types.ObjectId) {
    try {
      const workout = await Workout.findById({ _id: workoutId }).lean();

      return workout;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutById", error);
    }
  }
  async createWorkout(workout: WorkoutCreateDto): Promise<WorkoutState> {
    try {
      const newWorkout = await Workout.create(workout);

      return newWorkout;
    } catch (error) {
      throw mongoDBErrorHandler("createWorkout", error);
    }
  }

  async createRunning(running: RunningType) {
    try {
      const newRunning = await Running.create(running);

      return newRunning;
    } catch (error) {
      throw mongoDBErrorHandler("createRunning", error);
    }
  }

  async createFitness(fitness: FitnessType) {
    try {
      const newFitness = await Fitness.create(fitness);

      return newFitness;
    } catch (error) {
      throw mongoDBErrorHandler("createFitness", error);
    }
  }

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
}

export default new WorkoutRepository();
