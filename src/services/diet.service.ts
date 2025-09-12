import mongoose, { ClientSession, Types } from "mongoose";
import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";
import { dietRepository } from "../repositories";
import { DietState, MealState } from "../types";
import {
  DietCreateRequestDto,
  DietCreateDto,
  FoodCreateDto,
  MealCreateRequestDto,
  MealCreateDto,
} from "dtos";

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

  // 음식 생성
  async createFood(food: FoodCreateDto, session?: ClientSession) {
    try {
      const newFood = await dietRepository.createFood(food, session);

      if (!newFood) {
        throw new InternalServerError("음식 생성 실패");
      }

      return newFood;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 식단 생성
  async createMeal(
    meal: MealCreateDto,
    session?: ClientSession
  ): Promise<MealState> {
    try {
      const newMeal = await dietRepository.createMeal(meal, session);

      if (!newMeal) {
        throw new InternalServerError("식단 생성 실패");
      }

      return newMeal;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 일일 식단 생성
  async createDiet(
    diet: DietCreateDto,
    session?: ClientSession
  ): Promise<DietState> {
    try {
      const newDiet = await dietRepository.createDiet(diet, session);

      if (!newDiet) {
        throw new InternalServerError("일일 식단 생성 실패");
      }

      return newDiet;
    } catch (error) {
      throw error;
    }
  }

  // 식단 상세에 음식 추가
  async addFoodsToMeal(
    mealId: Types.ObjectId,
    foodIds: Types.ObjectId[],
    session?: ClientSession
  ) {
    try {
      const meal = await dietRepository.addFoodsToMeal(
        mealId,
        foodIds,
        session
      );

      console.log("식단 상세", meal);

      if (!meal) {
        throw new InternalServerError("식단 상세 추가 실패");
      }

      return meal;
    } catch (error) {
      throw error;
    }
  }

  // 식단에 식단 상세 추가
  async addMealsToDiet(
    dietId: Types.ObjectId,
    mealIds: Types.ObjectId[],
    session?: ClientSession
  ) {
    try {
      const diet = await dietRepository.addMealToDiet(dietId, mealIds, session);

      if (!diet) {
        throw new InternalServerError("식단 상세 추가 실패");
      }

      return diet;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 식단 상세 생성 및 음식 추가
  async createMealAndFood(meal: MealCreateRequestDto, session?: ClientSession) {
    try {
      const { foods, ...rest } = meal;
      // 사용자 식단 상세 생성
      const newMeal = await this.createMeal(rest as MealCreateDto, session);

      // 음식 생성
      const newFoods = await Promise.all(
        foods.map((food) =>
          this.createFood({ ...food, mealId: newMeal._id }, session)
        )
      );

      console.log(newFoods);

      // 음식 아이디 추출
      const foodIds = newFoods.map((f) => f._id);

      console.log(foodIds);

      await this.addFoodsToMeal(newMeal._id, foodIds, session);

      return {
        ...newMeal,
        foods: newFoods,
      };
    } catch (error) {
      throw error;
    }
  }

  // 사용자 식단 생성 및 상세 추가
  async createTotalDiet(userId: Types.ObjectId, diet: DietCreateRequestDto) {
    const session = await mongoose.startSession();

    session.startTransaction();
    try {
      const { meals, ...rest } = diet;
      // 사용자 식단 생성
      const newDiet = await this.createDiet(
        {
          ...rest,
          userId,
        },
        session
      );

      // 사용자 식단 상세 생성
      const newMeals = await Promise.all(
        meals.map((meal) =>
          this.createMealAndFood({ ...meal, dietId: newDiet._id }, session)
        )
      );

      console.log(newMeals);
      // 사용자 식단 상세 아이디가 추가 안되는 문제 확인할 것
      // 사용자 식단 상세 아이디
      const mealIds = newMeals.map((m) => m._id);
      console.log("식단 상세 ids", mealIds);

      // mealId를 식단의 meals에 삽입
      await this.addMealsToDiet(newDiet._id, mealIds, session);

      await session.commitTransaction();

      return {
        ...newDiet,
        meals: newMeals,
      };
    } catch (error) {
      session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // 식단에 meal 추가
  async createMealAndAddToDiet(
    dietId: Types.ObjectId,
    meal: MealCreateRequestDto,
    session?: ClientSession
  ) {
    try {
      // Meal과 food 생성
      const newMeal = await this.createMealAndFood(meal, session);

      // meal을 diet에 추가
      await this.addMealsToDiet(dietId, [newMeal._id], session);

      return newMeal;
    } catch (error) {
      throw error;
    }
  }

  // food 생성 및 meal에 추가
  async createFoodsAndAddToMeal(
    mealId: Types.ObjectId,
    foods: FoodCreateDto[],
    session?: ClientSession
  ) {
    try {
      // 음식 생성
      const newFoods = await Promise.all(
        foods.map((food) => this.createFood(food, session))
      );

      const foodIds = newFoods.map((food) => food._id);

      // 생성된 음식 추가
      await this.addFoodsToMeal(mealId, foodIds, session);

      return newFoods;
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
