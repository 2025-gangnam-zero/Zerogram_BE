import { Types } from "mongoose";

export interface MealState {
  _id: Types.ObjectId;
  dietId: Types.ObjectId;
  meal_type: string;
  food_name: string;
  food_amount: number;
  calories: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealUpdateDto {
  meal_type?: string;
  food_name?: string;
  food_amount?: number;
  calories?: number;
}

export interface DietState {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  meals: MealState[];
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}
