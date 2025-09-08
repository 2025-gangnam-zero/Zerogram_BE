import mongoose, { Schema } from "mongoose";
import { WorkoutDetailState, WorkoutState } from "../types";

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
    body_part: {
      type: String,
      required: function () {
        return this.workout_name === "fitness";
      },
    },
    fitness_type: {
      type: String,
      required: function () {
        return this.workout_name === "fitness";
      },
    },
    sets: {
      type: Number,
      required: function () {
        return this.workout_name === "fitness";
      },
    },
    reps: {
      type: Number,
      required: function () {
        return this.workout_name === "fitness";
      },
    },
    weight: {
      type: Number,
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
