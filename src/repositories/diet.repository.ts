import { ClientSession, DeleteResult, Types, UpdateResult } from "mongoose";
import { Diet, Food, Meal } from "../models";
import { DietState, FoodState, MealState } from "../types";
import { mongoDBErrorHandler } from "../utils";
import {
  DietCreateDto,
  FoodCreateDto,
  MealCreateDto,
  MealCreateRequestDto,
} from "../dtos";

class DietRepository {
  // 식단 일지 목록 조회
  async getDietListByUserId(userId: Types.ObjectId): Promise<DietState[]> {
    try {
      const diets = await Diet.find({ userId });

      return diets;
    } catch (error) {
      throw mongoDBErrorHandler("getDieteListById", error);
    }
  }

  // 식단 일지 조회
  async getDietById(_id: Types.ObjectId): Promise<DietState | null> {
    try {
      const diet = await Diet.findById({ _id });

      return diet;
    } catch (error) {
      throw mongoDBErrorHandler("getDietById", error);
    }
  }

  // 음식 생성
  async createFood(
    food: FoodCreateDto,
    session?: ClientSession
  ): Promise<FoodState> {
    try {
      const newFood = await Food.create([food], { session });

      return newFood[0];
    } catch (error) {
      throw mongoDBErrorHandler("createDto", error);
    }
  }

  // 식단 생성
  async createMeal(
    meal: MealCreateDto,
    session?: ClientSession
  ): Promise<MealState> {
    try {
      const newMeal = await Meal.create([meal], { session });

      return newMeal[0];
    } catch (error) {
      throw mongoDBErrorHandler("createMeal", error);
    }
  }

  // 식단 일지 생성
  async createDiet(
    diet: DietCreateDto,
    session?: ClientSession
  ): Promise<DietState> {
    try {
      const newDiet = await Diet.create([diet], { session });

      return newDiet[0];
    } catch (error) {
      throw mongoDBErrorHandler("createDiet", error);
    }
  }

  // 음식 추가
  async addFoodsToMeal(
    mealId: Types.ObjectId,
    foodIds: Types.ObjectId[],
    session?: ClientSession
  ): Promise<MealState | null> {
    try {
      console.log(mealId);
      console.log(foodIds);
      const food = await Meal.findOneAndUpdate(
        { _id: mealId },
        {
          $addToSet: {
            foods: { $each: foodIds },
          },
        },
        {
          new: true,
          lean: true,
          session,
        }
      );

      return food;
    } catch (error) {
      throw mongoDBErrorHandler("addFoodToMeal", error);
    }
  }

  // Meal 추가
  async addMealToDiet(
    dietId: Types.ObjectId,
    mealIds: Types.ObjectId[],
    session?: ClientSession
  ): Promise<DietState | null> {
    try {
      const diet = await Diet.findOneAndUpdate(
        { _id: dietId },
        {
          $addToSet: {
            meals: { $each: mealIds },
          },
        },
        {
          new: true,
          upsert: false,
          lean: true,
          omitUndefined: true,
          session,
        }
      );

      return diet;
    } catch (error) {
      throw mongoDBErrorHandler("addMealToDiet", error);
    }
  }

  // 식단 추가
  async addMeal(
    dietId: Types.ObjectId,
    meal: MealState,
    session?: ClientSession
  ): Promise<UpdateResult> {
    try {
      const result = await Diet.updateOne(
        { _id: dietId },
        {
          $addToSet: {
            meals: meal,
          },
        },
        {
          session, // 세션 전달
        }
      );

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("addMeal", error);
    }
  }

  // feedback 작성
  async updateDietFeedback(
    _id: Types.ObjectId,
    feedback: string
  ): Promise<UpdateResult> {
    try {
      const result = await Diet.updateOne({ _id }, { feedback });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateFeedback", error);
    }
  }

  // 식단 삭제
  async deleteMeal(_id: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await Meal.deleteOne({ _id });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteMeal", error);
    }
  }

  // 식단 수정하기
  async updateMeal(
    _id: Types.ObjectId,
    updatedMeal: MealCreateRequestDto
  ): Promise<UpdateResult> {
    try {
      const result = await Meal.updateOne({ _id }, updatedMeal);

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateMeal", error);
    }
  }

  // 식단 일지 삭제
  async deleteDiet(_id: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await Diet.deleteOne({ _id });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteDiet", error);
    }
  }
}

export default new DietRepository();
