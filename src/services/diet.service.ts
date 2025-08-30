import { InternalServerError, NotFoundError, UnauthorizedError } from "errors";
import { Types } from "mongoose";
import { dietRepository } from "repositories";
import { DietState, MealState } from "types";

class DietService {
  // 사용자 일일 식단 목록 조회
  async getDietListByUserId(userId: Types.ObjectId): Promise<DietState[]> {
    try {
      const diets = await dietRepository.getDietListByUserId(userId);

      return diets;
    } catch (error) {
      throw error;
    }
  }

  // 식단 추가
  async addMeal(dietId: Types.ObjectId, meal: MealState) {
    try {
      const result = await dietRepository.addMeal(dietId, meal);

      if (result.matchedCount === 0) {
        throw new NotFoundError("일일 식단 조회 실패");
      }

      if (result.modifiedCount === 0) {
        throw new InternalServerError("식단 추가 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 사용자 일일 식단 생성
  async createDiet(
    userId: Types.ObjectId,
    mealDto: MealState
  ): Promise<DietState> {
    try {
      const diet = await dietRepository.createDiet(userId);
      const meal = await this.createMeal(userId, mealDto);

      await this.addMeal(diet._id, meal);

      diet.meals.push(meal);

      return diet;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 식단 생성
  async createMeal(
    userId: Types.ObjectId,
    mealDto: MealState
  ): Promise<MealState> {
    try {
      const meal = await dietRepository.createMeal(userId, mealDto);

      if (!meal) {
        throw new InternalServerError("식단 생성 실패");
      }

      return meal;
    } catch (error) {
      throw error;
    }
  }

  // 일일 식단 조회
  async getDietById(
    dietId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<DietState> {
    try {
      const diet = await dietRepository.getDietById(dietId);

      if (!diet) {
        throw new NotFoundError("일일 식단 조회 실패");
      }

      if (diet.userId !== userId) {
        throw new UnauthorizedError("권한 없음");
      }

      return diet;
    } catch (error) {
      throw error;
    }
  }

  // 식단 수정
  async updateFeedback(
    dietId: Types.ObjectId,
    feedback: string,
    userId: Types.ObjectId
  ): Promise<void> {
    try {
      // 식단 조회 및 권한 확인
      await this.getDietById(dietId, userId);

      const result = await dietRepository.updateDietFeedback(dietId, feedback);

      if (result.matchedCount === 0) {
        throw new NotFoundError("일일 식단 조회 실패");
      }

      if (result.modifiedCount === 0) {
        throw new InternalServerError("일일 식단 피드백 수정 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 식단 삭제
  async deleteDietById(
    dietId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<void> {
    try {
      await this.getDietById(dietId, userId);

      const result = await dietRepository.deleteDiet(dietId);

      if (!result.acknowledged) {
        throw new InternalServerError("식단 삭제 승인 실패");
      }

      if (result.deletedCount === 0) {
        throw new InternalServerError("식단 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new DietService();
