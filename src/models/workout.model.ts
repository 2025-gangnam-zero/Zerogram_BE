import mongoose, { Schema } from "mongoose";
import { FitnessType, RunningType, WorkoutState } from "../types";

const RunningSchema = new mongoose.Schema<RunningType>(
  {
    workoutId: {
      type: Schema.Types.ObjectId,
      ref: "Workout",
      requierd: true,
    },
    avg_pace: {
      type: Number,
      default: 0,
    },
    distance: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    calories: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Running = mongoose.model("Running", RunningSchema);

const FitnessSchema = new mongoose.Schema<FitnessType>(
  {
    workoutId: {
      type: Schema.Types.ObjectId,
      ref: "Workout",
      requierd: true,
    },
    body_part: {
      type: String,
      required: true,
    },
    fitness_type: {
      type: String,
      required: true,
    },
    sets: {
      type: Number,
      default: 0,
    },
    reps: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    calories: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Fitness = mongoose.model("Fitness", FitnessSchema);

const WorkoutSchema = new mongoose.Schema<WorkoutState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workout_name: {
      type: String,
      enum: ["running", "fitness"],
      required: true,
    },
    feedback: {
      type: String,
    },
    running: {
      type: RunningSchema,
    },
    fitness: {
      type: [FitnessSchema],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Workout = mongoose.model("Workout", WorkoutSchema);
