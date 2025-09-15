import { ClientSession, DeleteResult, Types, UpdateResult } from "mongoose";
import { Diet, Food, Meal } from "../models";
import { DietState, FoodState, MealState } from "../types";
import {
  aggregateGetDietById,
  aggregateGetDietListByUserIdForMonth,
  aggregateGetMealById,
  mongoDBErrorHandler,
} from "../utils";
import {
  DietCreateDto,
  DietCreateResponseDto,
  DietUpdateRequestDto,
  FoodCreateDto,
  FoodUpdateDto,
  MealCreateDto,
  MealResponseDto,
  MealUpdateDto,
} from "../dtos";

class DietRepository {
  // 식단 일지 목록 조회
  async getDietListByUserId(
    userId: Types.ObjectId,
    year: number,
    month: number
  ): Promise<DietCreateResponseDto[]> {
    try {
      const diets = await aggregateGetDietListByUserIdForMonth(
        userId,
        year,
        month
      );

      return diets;
    } catch (error) {
      throw mongoDBErrorHandler("getDieteListById", error);
    }
  }

  // 식단 일지 조회
  async getDietById(
    _id: Types.ObjectId,
    session?: ClientSession
  ): Promise<DietCreateResponseDto | null> {
    try {
      const diet = await aggregateGetDietById(_id, session);

      return diet;
    } catch (error) {
      throw mongoDBErrorHandler("getDietById", error);
    }
  }

  // 식단 일지 document 조회
  async getDietDocumentById(
    dietId: Types.ObjectId,
    session?: ClientSession
  ): Promise<DietState | null> {
    try {
      return await Diet.findById({ _id: dietId }, { session }).lean();
    } catch (error) {
      throw mongoDBErrorHandler("getDietDocumentById", error);
    }
  }

  // Meal 조회
  async getMealById(mealId: Types.ObjectId): Promise<MealResponseDto | null> {
    try {
      const meal = await aggregateGetMealById(mealId);

      return meal;
    } catch (error) {
      throw error;
    }
  }

  // 음식 조회
  async getFoodById(foodId: Types.ObjectId): Promise<FoodState | null> {
    try {
      const food = await Food.findById({ _id: foodId }).lean();

      return food;
    } catch (error) {
      throw mongoDBErrorHandler("getFoodById", error);
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
      const [doc] = await Meal.create([meal], { session });

      const mealObj = doc.toObject({ versionKey: false });

      return mealObj;
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
      const [newDiet] = await Diet.create([diet], { session });

      const dietObject = newDiet.toObject();

      return dietObject;
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
      const meal = await Meal.findOneAndUpdate(
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

      console.log("meal", meal);

      return meal;
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

  // 음식 일괄 삭제
  async deleteFoods(foodIds: Types.ObjectId[], session?: ClientSession) {
    try {
      const result = await Food.deleteMany(
        {
          _id: { $in: foodIds },
        },
        { session }
      );

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteFoods", error);
    }
  }

  // Meal 일괄 삭제
  async deleteMeals(mealIds: Types.ObjectId[], session?: ClientSession) {
    try {
      const result = await Meal.deleteMany(
        {
          _id: { $in: mealIds },
        },
        { session }
      );

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteMeals", error);
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

  // 식단 meal 삭제
  async deleteMeal(_id: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await Meal.deleteOne({ _id });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteMeal", error);
    }
  }

  // 음식 삭제
  async deleteFood(foodId: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await Food.deleteOne({ _id: foodId });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteMeal", error);
    }
  }

  // 식단 수정
  async updateDiet(
    _id: Types.ObjectId,
    updatedDiet: DietUpdateRequestDto,
    session?: ClientSession
  ): Promise<DietState | null> {
    try {
      const diet = await Diet.findOneAndUpdate(
        { _id },
        { $set: updatedDiet },
        {
          new: true,
          lean: true,
          session,
        }
      );

      return diet;
    } catch (error) {
      throw mongoDBErrorHandler("updateFeedback", error);
    }
  }

  // Meal 수정하기
  async updateMeal(
    mealId: Types.ObjectId,
    updatedMeal: MealUpdateDto,
    session?: ClientSession
  ): Promise<MealState | null> {
    try {
      console.log("updatedMeal", updatedMeal);

      const meal = await Meal.findOneAndUpdate(
        { _id: mealId },
        { $set: updatedMeal },
        {
          new: true,
          lean: true,
          session,
        }
      );

      return meal;
    } catch (error) {
      throw mongoDBErrorHandler("updateMeal", error);
    }
  }

  // 음식 수정
  async updateFood(
    foodId: Types.ObjectId,
    updateFood: FoodUpdateDto,
    session?: ClientSession
  ): Promise<FoodState | null> {
    try {
      const food = await Food.findOneAndUpdate(
        { _id: foodId },
        { $set: updateFood },
        {
          new: true,
          lean: true,
          session,
        }
      );

      return food;
    } catch (error) {
      throw mongoDBErrorHandler("updateFood", error);
    }
  }
}

export default new DietRepository();
