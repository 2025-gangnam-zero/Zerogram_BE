import mongoose, { Schema } from "mongoose";
import { FitnessDetailState, WorkoutDetailState, WorkoutState } from "../types";

const FitnessDetailSchema = new mongoose.Schema<FitnessDetailState>(
  {
    body_part: {
      type: String,
    },
    fitness_type: {
      type: String,
    },
    sets: {
      type: Number,
    },
    reps: {
      type: Number,
    },
    weight: {
      type: Number,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const FitnessDetail = mongoose.model(
  "FitnessDetail",
  FitnessDetailSchema
);

const WorkoutDetailSchema = new mongoose.Schema<WorkoutDetailState>(
  {
    workout_name: {
      type: String,
      enum: ["running", "fitness"],
      required: true,
    },
    workoutId: {
      type: Schema.Types.ObjectId,
      ref: "Workout",
      required: true,
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
    fitnessDetails: {
      type: [Schema.Types.ObjectId],
      ref: "FitnessDetail",
    },
    avg_pace: {
      type: Number,
      required: function () {
        return this.workout_name === "running";
      },
    },
    distance: {
      type: Number,
      required: function () {
        return this.workout_name === "running";
      },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const WorkoutDetail = mongoose.model(
  "WorkoutDetail",
  WorkoutDetailSchema
);

const WorkoutSchema = new mongoose.Schema<WorkoutState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v),
        message: "date는 YYYY-MM-DD 형식이어야 합니다.",
      },
    },
    details: {
      type: [Schema.Types.ObjectId],
      ref: "WorkoutDetail",
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Workout = mongoose.model("Workout", WorkoutSchema);
