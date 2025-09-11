import { Types } from "mongoose";

export interface FoodState {
  _id: Types.ObjectId;
  mealId: Types.ObjectId;
  food_name: string;
  food_amount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealState {
  _id: Types.ObjectId;
  dietId: Types.ObjectId;
  meal_type?: string;
  foods: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DietState {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  meals: Types.ObjectId[];
  total_calories: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}
