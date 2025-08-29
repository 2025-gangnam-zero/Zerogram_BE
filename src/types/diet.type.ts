import { Document, Types } from "mongoose";

export interface MealState extends Document {
  dietId: Types.ObjectId;
  meal_type: string;
  food_name: string;
  food_amount: number;
  calories: number;
}

export interface MealUpdateDto extends Document {
  meal_type?: string;
  food_name?: string;
  food_amount?: number;
  calories?: number;
}

export interface DietState extends Document {
  userId: Types.ObjectId;
  meals: MealState[];
  feedback?: string;
}
