import mongoose from "mongoose";
import { WorkoutState } from "types/workout.type";

const WorkoutSchema = new mongoose.Schema<WorkoutState>(
  {},
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Workout = mongoose.model("Workout", WorkoutSchema);
