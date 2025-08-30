import mongoose, { Schema } from "mongoose";
import { DietState, MealState } from "../types";

const MealSchema = new mongoose.Schema<MealState>(
  {
    dietId: {
      type: Schema.Types.ObjectId,
      ref: "Diet",
      required: true,
    },
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
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Meal = mongoose.model("Meal", MealSchema);

const DietSchema = new mongoose.Schema<DietState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    meals: {
      type: [MealSchema],
      default: [],
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
