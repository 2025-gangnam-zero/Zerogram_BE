import { Document } from "mongoose";

export interface DietState extends Document {
  meal_type: string;
  food_name: string;
  food_amount: number;
  calories: number;
  feedback?: string;
}
