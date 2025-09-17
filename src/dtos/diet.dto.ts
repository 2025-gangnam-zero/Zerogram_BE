import { Types } from "mongoose";
import { FoodState } from "types";

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

export interface MealResponseDto {
  _id: Types.ObjectId;
  dietId: Types.ObjectId;
  meal_type?: string;
  foods: FoodState[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DietCreateResponseDto {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  meals: MealResponseDto[];
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

export interface DietUpdateDto {
  feedback?: string;
  total_calories?: number;
}

export interface MealUpdateRequestDto {
  _id: Types.ObjectId;
  meal_type?: string;
  foods?: FoodUpdateRequestDto[];
}

export interface MealUpdateDto {
  meal_type?: string;
}

export interface FoodUpdateRequestDto {
  _id: Types.ObjectId;
  food_name?: string;
  food_amount?: number;
}
export interface FoodUpdateDto {
  food_name?: string;
  food_amount?: number;
}
