import { Types } from "mongoose";
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
  async createFood(food: FoodCreateDto) {
    try {
      const newFood = await dietRepository.createFood(food);

      if (!newFood) {
        throw new InternalServerError("음식 생성 실패");
      }

      return newFood;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 식단 생성
  async createMeal(meal: MealCreateDto): Promise<MealState> {
    try {
      const newMeal = await dietRepository.createMeal(meal);

      if (!newMeal) {
        throw new InternalServerError("식단 생성 실패");
      }

      return newMeal;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 일일 식단 생성
  async createDiet(diet: DietCreateDto): Promise<DietState> {
    try {
      const newDiet = await dietRepository.createDiet(diet);

      if (!newDiet) {
        throw new InternalServerError("일일 식단 생성 실패");
      }

      return newDiet;
    } catch (error) {
      throw error;
    }
  }

  // 식단 상세에 음식 추가
  async addFoodToMeal(mealId: Types.ObjectId, foodId: Types.ObjectId) {
    try {
      const meal = await dietRepository.addFoodToMeal(mealId, foodId);

      if (!meal) {
        throw new InternalServerError("식단 상세 추가 실패");
      }

      return meal;
    } catch (error) {
      throw error;
    }
  }

  // 식단에 식단 상세 추가
  async addMealToDiet(dietId: Types.ObjectId, mealId: Types.ObjectId) {
    try {
      const diet = await dietRepository.addMealToDiet(dietId, mealId);

      if (!diet) {
        throw new InternalServerError("식단 상세 추가 실패");
      }

      return diet;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 식단 상세 생성 및 음식 추가
  async createMealAndFood(meal: MealCreateRequestDto) {
    try {
      const { foods, ...rest } = meal;
      // 사용자 식단 상세 생성
      const newMeal = await this.createMeal(rest as MealCreateDto);

      // 음식 생성
      const newFoods = await Promise.all(
        foods.map((food) => this.createFood({ ...food, mealId: newMeal._id }))
      );

      // 음식 아이디 추출
      const foodIds = newFoods.map((f) => f._id);

      await Promise.all(
        foodIds.map((foodId) => this.addFoodToMeal(newMeal._id, foodId))
      );

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
    try {
      const { meals, ...rest } = diet;
      // 사용자 식단 생성
      const newDiet = await this.createDiet({
        ...rest,
        userId,
      });

      // 사용자 식단 상세 생성
      const newMeals = await Promise.all(
        meals.map((meal) =>
          this.createMealAndFood({ ...meal, dietId: newDiet._id })
        )
      );

      // 사용자 식단 상세 아이디가 추가 안되는 문제 확인할 것 
      // 사용자 식단 상세 아이디
      const mealIds = newMeals.map((m) => m._id);
      console.log(mealIds);

      // mealId를 식단의 meals에 삽입
      await Promise.all(
        mealIds.map((mealId) => this.addMealToDiet(newDiet._id, mealId))
      );

      return {
        ...newDiet,
        meals: newMeals,
      };
    } catch (error) {
      throw error;
    }
  }

  // 식단에 meal 추가
  async createMealAndAddToDiet(
    dietId: Types.ObjectId,
    meal: MealCreateRequestDto
  ) {
    try {
      // Meal과 food 생성
      const newMeal = await this.createMealAndFood(meal);

      // meal을 diet에 추가
      await this.addMealToDiet(dietId, newMeal._id);

      return newMeal;
    } catch (error) {
      throw error;
    }
  }

  // food 생성 및 meal에 추가
  async createFoodsAndAddToMeal(
    mealId: Types.ObjectId,
    foods: FoodCreateDto[]
  ) {
    try {
      // 음식 생성
      const newFoods = await Promise.all(
        foods.map((food) => this.createFood(food))
      );

      const foodIds = newFoods.map((food) => food._id);

      // 생성된 음식 추가
      await Promise.all(
        foodIds.map((foodId) => this.addFoodToMeal(mealId, foodId))
      );

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
