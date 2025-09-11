import mongoose, { Schema } from "mongoose";
import { DietState, FoodState, MealState } from "../types";

const FoodSchema = new mongoose.Schema<FoodState>({
  mealId: {
    type: Schema.Types.ObjectId,
    ref: "Meal",
  },
  food_name: {
    type: String,
    required: true,
  },
  food_amount: {
    type: Number,
  },
});

export const Food = mongoose.model("Food", FoodSchema);

const MealSchema = new mongoose.Schema<MealState>(
  {
    dietId: {
      type: Schema.Types.ObjectId,
      ref: "Diet",
      required: true,
    },
    meal_type: {
      type: String,
    },
    foods: {
      type: [Schema.Types.ObjectId],
      ref: "Food",
      default: [],
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
      type: [Schema.Types.ObjectId],
      ref: "Meal",
      default: [],
    },

    date: {
      type: String,
    },
    total_calories: {
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
