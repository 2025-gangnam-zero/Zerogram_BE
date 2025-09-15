import { Types } from "mongoose";
import { MealState } from "types";

export interface FoodCreateDto {
  mealId: Types.ObjectId;
  food_name: string;
  food_amount?: number;
}

export interface FoodCreateRequestDto {
  food_name: string;
  food_amount?: number;
}

export interface MealCreateDto {
  dietId: Types.ObjectId;
  meal_type?: string;
}

export interface MealCreateRequestDto {
  dietId: Types.ObjectId;
  meal_type?: string;
  foods: FoodCreateRequestDto[];
}

export interface DietCreateDto {
  userId: Types.ObjectId;
  total_calories: number;
  feedback?: string;
}

export interface DietCreateRequestDto {
  meals: MealCreateRequestDto[];
  total_calories: number;
  feedback?: string;
  date: string;
}

export interface DietCreateResponseDto {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  meals: MealState[];
  total_calories: number;
  feedback?: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DietUpdateRequestDto {
  feedback?: string;
  total_calories?: number;
  meals?: MealUpdateRequestDto[];
}

export interface MealUpdateRequestDto {
  meal_type?: string;
  foods?: FoodUpdateRequestDto[];
}

export interface FoodUpdateRequestDto {
  food_name?: string;
  food_amount?: number;
}
