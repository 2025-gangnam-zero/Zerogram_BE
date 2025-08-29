import mongoose from "mongoose";
import { DietState } from "types/diet.type";

const DietSchema = new mongoose.Schema<DietState>(
  {
    meal_type: {
      type: String,
      required: true,
    },
    food_name: {
      type: String,
      required: true,
    },
    food_amount: {
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

export const Diet = mongoose.model("Diet", DietSchema);
