import mongoose from "mongoose";
import { WorkoutState } from "../types";

const WorkoutSchema = new mongoose.Schema<WorkoutState>(
  {
    
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Workout = mongoose.model("Workout", WorkoutSchema);
