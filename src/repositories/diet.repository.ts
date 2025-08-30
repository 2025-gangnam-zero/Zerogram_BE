import { DeleteResult, Types, UpdateResult } from "mongoose";
import { Diet, Meal } from "../models";
import { DietState, MealState, MealUpdateDto } from "../types";
import { mongoDBErrorHandler } from "../utils";

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

  // 식단 일지 생성
  async createDiet(userId: Types.ObjectId) {
    try {
      const diet = await Diet.create({ userId });

      return diet;
    } catch (error) {
      throw mongoDBErrorHandler("createDiet", error);
    }
  }

  // 식단 일지 - 식단 생성
  async createMeal(_id: Types.ObjectId, meal: MealState): Promise<MealState> {
    try {
      const newMeal = await Meal.create(meal);

      return newMeal;
    } catch (error) {
      throw mongoDBErrorHandler("createMeal", error);
    }
  }

  // 식단 추가
  async addMeal(
    dietId: Types.ObjectId,
    meal: MealState
  ): Promise<UpdateResult> {
    try {
      const result = await Diet.updateOne(
        { _id: dietId },
        {
          $addToSet: {
            meals: meal,
          },
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
    updatedMeal: MealUpdateDto
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
