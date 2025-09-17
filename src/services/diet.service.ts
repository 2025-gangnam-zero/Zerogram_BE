import mongoose, { ClientSession, Types } from "mongoose";
import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";
import { dietRepository } from "../repositories";
import { DietState, FoodState, MealState } from "../types";
import {
  DietCreateRequestDto,
  DietCreateDto,
  FoodCreateDto,
  MealCreateRequestDto,
  MealCreateDto,
  DietCreateResponseDto,
  MealUpdateRequestDto,
  DietUpdateRequestDto,
  MealResponseDto,
  FoodUpdateDto,
} from "../dtos";

class DietService {
  // 사용자 일일 식단 목록 조회
  async getDietListByUserId(
    userId: Types.ObjectId,
    year: number,
    month: number
  ): Promise<DietCreateResponseDto[]> {
    try {
      const diets = await dietRepository.getDietListByUserId(
        userId,
        year,
        month
      );

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
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<DietCreateResponseDto> {
    try {
      const diet = await dietRepository.getDietById(dietId, session);

      if (!diet) {
        throw new NotFoundError("일일 식단 조회 실패");
      }

      if (String(diet.userId) !== String(userId)) {
        throw new UnauthorizedError("권한 없음");
      }

      return diet;
    } catch (error) {
      throw error;
    }
  }

  // 일일 식단 doc 조회
  async getDietDocById(
    dietId: Types.ObjectId,
    session?: ClientSession
  ): Promise<DietState> {
    try {
      const dietDoc = await dietRepository.getDietDocumentById(dietId, session);

      if (!dietDoc) {
        throw new NotFoundError("식단 doc 조회 실패");
      }

      return dietDoc;
    } catch (error) {
      throw error;
    }
  }

  // Meal 조회
  async getMealById(
    mealId: Types.ObjectId,
    session?: ClientSession
  ): Promise<MealResponseDto> {
    try {
      const meal = await dietRepository.getMealById(mealId);

      if (!meal) {
        throw new InternalServerError("Meal 조회 실패");
      }

      return meal;
    } catch (error) {
      throw error;
    }
  }

  // 음식 조회
  async getFoodById(foodId: Types.ObjectId): Promise<FoodState> {
    try {
      const food = await dietRepository.getFoodById(foodId);

      if (!food) {
        throw new InternalServerError("음식 조회 실패");
      }

      return food;
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
      const session = await mongoose.startSession();

      session.startTransaction();

      const { meals } = await this.getDietById(dietId, userId, session);

      const mealIds = meals.map((m) => m._id);

      await Promise.all(
        mealIds.map((mealId) =>
          this.deleteMealById(dietId, mealId, userId, session)
        )
      );

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

  // Meal 삭제
  async deleteMealById(
    dietId: Types.ObjectId,
    mealId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      // diet 조회
      const { foods } = await this.getMealById(mealId, session);

      const foodIds = foods.map((f) => f._id);

      await Promise.all(
        foodIds.map((fId) => this.deleteFoodById(dietId, fId, userId, session))
      );

      const result = await dietRepository.deleteMeal(mealId);

      if (!result.acknowledged) {
        throw new InternalServerError("Meal 삭제 승인 실패");
      }

      if (result.deletedCount === 0) {
        throw new InternalServerError("Meal 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 음식 삭제
  async deleteFoodById(
    dietId: Types.ObjectId,
    foodId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      await this.getDietById(dietId, userId, session);

      const result = await dietRepository.deleteFood(foodId, session);

      if (!result.acknowledged) {
        throw new InternalServerError("음식 삭제 승인 실패");
      }

      if (result.deletedCount === 0) {
        throw new InternalServerError("음식 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 식단 수정
  async updateDiet(
    dietId: Types.ObjectId,
    updateDiet: DietUpdateRequestDto,
    userId: Types.ObjectId
  ): Promise<DietCreateResponseDto> {
    try {
      // 식단 조회 및 권한 확인
      await this.getDietById(dietId, userId);

      const { meals, ...rest } = updateDiet;

      // 식단 수정
      const diet = await dietRepository.updateDiet(dietId, rest);

      if (!diet) {
        throw new InternalServerError("식단 수정 실패");
      }

      if (meals) {
        // meal 수정
        const updatedMeals = await Promise.all(
          meals.map((meal) => this.updateMeal(meal))
        );

        // 수정된 meals 포함 응답
        return {
          ...diet,
          meals: updatedMeals,
        };
      }

      // 수정된 diet 응답
      return await this.getDietById(dietId, userId);
    } catch (error) {
      throw error;
    }
  }

  // meal 수정
  async updateMeal(updateMeal: MealUpdateRequestDto): Promise<MealResponseDto> {
    try {
      const { foods, _id: mealId, ...rest } = updateMeal;

      const meal = await dietRepository.updateMeal(mealId, rest);

      console.log(meal);
      if (!meal) {
        throw new InternalServerError("Meal 수정 실패");
      }

      if (foods) {
        // 음식 수정
        const updatedFoods = await Promise.all(
          foods.map((food) => {
            const { _id, ...rest } = food;
            return this.updateFood(_id, rest);
          })
        );

        return {
          ...meal,
          foods: updatedFoods,
        };
      }

      return await this.getMealById(mealId);
    } catch (error) {
      throw error;
    }
  }

  // 음식 수정
  async updateFood(
    foodId: Types.ObjectId,
    updatedFood: FoodUpdateDto
  ): Promise<FoodState> {
    try {
      const food = await dietRepository.updateFood(foodId, updatedFood);

      if (!food) {
        throw new InternalServerError("음식 수정 실패");
      }

      return food;
    } catch (error) {
      throw error;
    }
  }
}

export default new DietService();
