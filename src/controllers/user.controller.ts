import { Request, Response } from "express";
import mongoose from "mongoose";
import { BadRequestError, UnauthorizedError } from "../errors";
import {
  dietService,
  meetingService,
  userService,
  userSessionService,
  workoutService,
} from "../services";
import { UserUpdateDto, UserUpdateResponseDto } from "../types";
import { deleteImage } from "../utils";
import {
  DietCreateRequestDto,
  WorkoutCreateDto,
  WorkoutDetailAndFitnessDetailCreateDto,
} from "../dtos";

// 사용자 조회
export const getUserInfo = async (req: Request, res: Response) => {
  const user = req.user;
  const sessionId = req.sessionId;

  const { password, ...rest } = user;

  // 사용자 세션 조회
  const userSession = await userSessionService.getUserSessionById(sessionId);

  console.log(rest);

  try {
    res.status(200).json({
      success: true,
      message: "사용자 조회 성공",
      code: "GET_USER_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        user: {
          ...rest,
          login_type: userSession.login_type,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

// 사용자 수정
export const updateMe = async (req: Request, res: Response) => {
  const user = req.user;
  const { nickname, password } = req.body;
  const profile_image = req.file as Express.MulterS3.File;

  console.log(user);

  const oldImage = user.profile_image
    ? user.profile_image.split(".com/")[1]
    : undefined;

  console.log(nickname, password, profile_image);

  try {
    const updateDto = {
      nickname: nickname ? nickname : undefined,
      password: password ? password : undefined,
      profile_image: profile_image ? profile_image.location : undefined,
    } as UserUpdateDto;

    await userService.updateMe(user._id, updateDto);

    // 기존 이미지가 있는 경우 삭제
    if (profile_image && oldImage) {
      await deleteImage(oldImage);
    }

    const responseDto: UserUpdateResponseDto = {
      nickname,
      profile_image: profile_image?.location,
    };

    res.status(200).json({
      success: true,
      message: "사용자 정보 수정",
      code: "USER_UPDATE_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        user: responseDto,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 사용자 삭제
export const deleteMe = async (req: Request, res: Response) => {
  const user = req.user;

  try {
    await userService.deleteUserById(user._id);

    res.status(200).json({
      success: true,
      message: "사용자 삭제 성공",
      code: "USER_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 프로필 초기화
export const deleteProfileImage = async (req: Request, res: Response) => {
  const user = req.user;
  try {
    await userService.deleteProfileImage(user._id, user.profile_image!);

    res.status(200).json({
      succes: true,
      message: "프로필 초기화 성공",
      code: "INITIALIZE_PROFILE_IMAGE_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 운동 일지 목록 조회
export const getWorkoutListById = async (req: Request, res: Response) => {
  const user = req.user;
  const { year, month } = req.query;
  if (!year) {
    throw new BadRequestError("요청하는 연도 필수");
  }
  if (!month) {
    throw new BadRequestError("요청하는 연도 필수");
  }
  try {
    const workouts = await workoutService.getWoroutListByUserId(
      user._id,
      Number(year as string),
      Number(month as string)
    );

    console.log(workouts.map((d) => d.details));

    res.status(200).json({
      success: true,
      message: "사용자 운동일지 목록 조회 성공",
      code: "GET_WORKOUT_LIST_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        workouts,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 운동 일지 생성 (첫 생성 시 )
export const createWorkout = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { details } = req.body;
  const { date } = req.query;

  if (!details) {
    throw new BadRequestError("details 필수");
  }

  if (!date) {
    throw new BadRequestError("날짜 필수");
  }

  try {
    const workoutCreate = {
      userId,
      date: date as String,
      details: details,
    } as WorkoutCreateDto;

    const workout = await workoutService.createWorkoutAndDetail(workoutCreate);

    res.status(201).json({
      success: true,
      message: "운동일지 생성 성공",
      code: "WORKOUT_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        workout,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 운동 일지 상세 생성 (이미 운동일지가 생성된 경우)
export const createWorkoutDetail = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { workoutid } = req.params;
  const { details } = req.body;

  if (!workoutid) {
    throw new BadRequestError("운동일지 아이디 필수");
  }

  if (!details) {
    throw new BadRequestError("운동 종류 필수");
  }

  try {
    // 운동 일지 아이디 변경
    const workoutId = new mongoose.Types.ObjectId(workoutid);

    // 운동일지 상세
    const newDetails: WorkoutDetailAndFitnessDetailCreateDto[] = details.map(
      (detail: any) => ({
        ...detail,
        workoutId,
        userId,
      })
    );

    console.log(newDetails);

    const workout = await workoutService.creatWorkoutDetailsAndAddToWorkout(
      workoutId,
      newDetails
    );

    res.status(200).json({
      success: true,
      message: "운동일지 상세 생성 성공",
      code: "WORKOUT_DETAIL_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        workout,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 피트니스 상세 추가하기
export const addFitnessDetail = async (req: Request, res: Response) => {
  const { workoutid, detailid } = req.params;
  const { fitnessDetails } = req.body;

  if (!workoutid) {
    throw new BadRequestError("운동일지 아이디 필수");
  }

  if (!detailid) {
    throw new BadRequestError("운동일지 상세 아이디 필수");
  }
  try {
    const detailId = new mongoose.Types.ObjectId(detailid);

    const workoutDetail =
      await workoutService.createFitnessDetailAndAddToWorkoutDetail(
        detailId,
        fitnessDetails
      );

    console.log("생성된 workoutDetails", workoutDetail);

    res.status(200).json({
      success: true,
      message: "피트니스 상세 생성 성공",
      code: "FITNESS_DETAIL_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        workoutDetail,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 운동 일지 조회
export const getWorkoutById = async (req: Request, res: Response) => {
  const user = req.user;
  const { workoutid } = req.params;

  if (!workoutid) {
    throw new BadRequestError("운동일지 아이디 필수");
  }

  try {
    const workoutId = new mongoose.Types.ObjectId(workoutid);

    const workout = await workoutService.getWorkoutById(workoutId);

    if (workout.userId !== user._id) {
      throw new UnauthorizedError("운동일지 조회 권한 없음");
    }

    res.status(200).json({
      success: true,
      message: "운동일지 상세 조회 성공",
      code: "WORKOUT_DETAIL_SUCCEEDED",
      timestamp: new Date().toISOString(),
      date: {
        workout,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 운동일지 상세 조회
export const getWorkoutDetail = async (req: Request, res: Response) => {
  // const user = req.user;
  const { workoutid, workoutdetailid } = req.params;

  if (!workoutid) {
    throw new BadRequestError("운동일지 아이디 필수");
  }

  if (!workoutdetailid) {
    throw new BadRequestError("운동일지상세 아이디 필수");
  }

  try {
    const workoutdetailId = new mongoose.Types.ObjectId(workoutdetailid);

    const workoutDetail = await workoutService.getWorkoutDetailById(
      workoutdetailId
    );

    res.status(200).json({
      success: true,
      message: "운동일지 상세 조회",
      code: "GET_WORKOUT_DETAIL_SUCCEEDED",
      data: {
        detail: workoutDetail,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 운동일지 수정
export const updateWorkout = async (req: Request, res: Response) => {
  const { workoutid } = req.params;
  const { workout: updatedWorkout } = req.body;
  if (!workoutid) {
    throw new BadRequestError("운동일지 아이디 필수");
  }

  if (!Object.values(updatedWorkout ?? {}).some((v) => v !== undefined)) {
    throw new BadRequestError("변경할 필드가 최소 1개 이상 필수");
  }

  console.log(updatedWorkout);

  try {
    const workoutId = new mongoose.Types.ObjectId(workoutid);
    const workout = await workoutService.updateWorkout(
      workoutId,
      updatedWorkout
    );

    res.status(200).json({
      success: true,
      message: "운동일지 수정 성공",
      code: "UPDATE_WORKOUT_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        workout,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 운동일지 상세 수정
export const updateWorkoutDetail = async (req: Request, res: Response) => {
  const { workoutdetailid } = req.params;
  const { detail: updatedDetail } = req.body;
  console.log(updatedDetail);

  if (!workoutdetailid) {
    throw new BadRequestError("운동일지상세 아이디 필수");
  }

  if (!Object.values(updatedDetail ?? {}).some((v) => v !== undefined)) {
    throw new BadRequestError("변경할 필드가 최소 1개 이상 필수");
  }

  try {
    const workoutdetailId = new mongoose.Types.ObjectId(workoutdetailid);

    const workoutDetail = await workoutService.updateWorkoutDetail(
      workoutdetailId,
      updatedDetail
    );

    res.status(200).json({
      success: true,
      message: "운동일지 상세 조회",
      code: "UPDATE_WORKOUT_DETAIL_SUCCEEDED",
      data: {
        detail: workoutDetail,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 피트니스 상세 수정
export const updateFitnessDetail = async (req: Request, res: Response) => {
  const { fitnessid } = req.params;
  const { fitnessDetail: updatedFitnessDetail } = req.body;

  console.log(updatedFitnessDetail);

  if (!fitnessid) {
    throw new BadRequestError("피트니스 상세 아이디 필수");
  }

  if (!Object.values(updatedFitnessDetail ?? {}).some((v) => v !== undefined)) {
    throw new BadRequestError("변경할 필드가 최소 1개 이상 필수");
  }

  try {
    const fitnessDetailId = new mongoose.Types.ObjectId(fitnessid);

    const fitnessDetail = await workoutService.updateFitnessDetail(
      fitnessDetailId,
      updatedFitnessDetail
    );

    res.status(200).json({
      success: true,
      message: "운동 루틴 수정 수정",
      code: "UPDATE_FITNESS_DETAIL_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        fitnessDetail,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 운동 일지 삭제
export const deleteWorkoutById = async (req: Request, res: Response) => {
  const user = req.user;
  const { workoutid } = req.params;

  console.log(user._id);

  if (!workoutid) {
    throw new BadRequestError("운동일지 아이디 필수");
  }

  try {
    const workoutId = new mongoose.Types.ObjectId(workoutid);

    await workoutService.deleteWorkoutById(workoutId, user._id);

    res.status(200).json({
      success: true,
      message: "운동일지 삭제 성공",
      code: "WORKOUT_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 운동일지 상세 삭제
export const deleteWorkoutDetail = async (req: Request, res: Response) => {
  const { detailid } = req.params;
  if (!detailid) {
    throw new BadRequestError("운동일지 상세 아이디 필수");
  }
  try {
    const workoutDetailId = new mongoose.Types.ObjectId(detailid);

    await workoutService.deleteWorkoutDetailById(workoutDetailId);

    res.status(200).json({
      success: true,
      message: "운동일지 상세 조회",
      code: "WORKOUT_DETAIL_DELETION_SUCCEEDED",
    });
  } catch (error) {
    throw error;
  }
};

// 피트니스 상세 삭제
export const deleteFitnessDetail = async (req: Request, res: Response) => {
  const userId = req.user._id;

  const { fitnessdetailid } = req.params;

  console.log(fitnessdetailid);

  if (!userId) {
    throw new BadRequestError("사용자 아이디 필수");
  }
  if (!fitnessdetailid) {
    throw new BadRequestError("피트니스 아이디 필수");
  }
  try {
    const fitnessDetailId = new mongoose.Types.ObjectId(fitnessdetailid);

    await workoutService.deleteFitnessDetailById(fitnessDetailId);

    res.status(200).json({
      success: true,
      message: "피트니스 삭제 성공",
      code: "FITNESS_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// -----------------------------------------------------------------------------------------------

// 사용자의 일일 식단 목록
export const getDietListById = async (req: Request, res: Response) => {
  const user = req.user;
  const { year, month } = req.query;

  if (!year || !month) {
    throw new BadRequestError("날짜 정보 필수");
  }
  try {
    console.log(year, month);

    const diets = await dietService.getDietListByUserId(
      user._id,
      Number(year),
      Number(month)
    );

    res.status(200).json({
      success: true,
      message: "사용자 식단 조회 성공",
      code: "DIET_LIST_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        diets,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 식단 생성
export const createDiet = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { diet } = req.body;
  console.log(req.body);

  if (!diet) {
    throw new BadRequestError("식단 일지 필수");
  }

  try {
    console.log("전달 받은 값", diet);

    const newDiet = await dietService.createTotalDiet(userId, {
      ...diet,
    } as DietCreateRequestDto);

    console.log("생성된 값", newDiet);

    res.status(201).json({
      success: true,
      message: "일일 식단 추가",
      code: "DIET_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        diet: newDiet,
      },
    });
  } catch (error) {
    throw error;
  }
};

// meal 생성
export const createMeal = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { dietid } = req.params;
  const { meals, total_calories } = req.body;

  console.log(dietid);
  console.log("식단 상세", meals, "총 칼로리", total_calories);

  if (!dietid) {
    throw new BadRequestError("식단 아이디 필수");
  }

  if (!meals) {
    throw new BadRequestError("Meal 정보 필수");
  }

  if (!total_calories) {
    throw new BadRequestError("총 칼로리 필수");
  }

  try {
    const dietId = new mongoose.Types.ObjectId(dietid);

    // 새 Meal 생성 및 total_calories 업데이트
    const newMeals =
      await dietService.createMealsAndAddtoDietAndUpdateTotalCalories(
        dietId,
        meals,
        total_calories,
        userId
      );

    console.log(newMeals);

    res.status(201).json({
      success: true,
      message: "일일 식단 상세 추가",
      code: "DIET_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meals: newMeals,
        total_calories,
      },
    });
  } catch (error) {
    throw error;
  }
};

// food 생성
export const createFood = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { dietid, mealid } = req.params;
  const { foods, total_calories } = req.body;

  console.log("음식 추가", foods, total_calories);

  if (!dietid) {
    throw new BadRequestError("식단 아이디 필수");
  }
  if (!mealid) {
    throw new BadRequestError("Meal 아이디 필수");
  }

  if (!foods) {
    throw new BadRequestError("food 정보 필수");
  }

  try {
    const dietId = new mongoose.Types.ObjectId(dietid);
    const mealId = new mongoose.Types.ObjectId(mealid);

    const newFoods =
      await dietService.createFoodsAndAddToMealAndUpdateTotalCalories(
        mealId,
        foods,
        dietId,
        total_calories,
        userId
      );

    res.status(201).json({
      success: true,
      message: "음식 목록 추가",
      code: "DIET_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        foods: newFoods,
        total_calories,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 식단 조회
export const getDietById = async (req: Request, res: Response) => {
  const user = req.user;
  const { dietId } = req.body;

  if (!dietId) {
    throw new BadRequestError("식단 아이디 필수");
  }

  const _id = new mongoose.Types.ObjectId(dietId);
  
  try {
    const diet = await dietService.getDietById(_id, user._id);

    res.status(200).json({
      success: true,
      message: "식단 조회 성공",
      code: "GET_DIET_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        diet,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 식단 삭제
export const deleteDietById = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { dietid } = req.params;

  if (!dietid) {
    throw new BadRequestError("식단 아이디 필수");
  }

  try {
    const dietId = new mongoose.Types.ObjectId(dietid);
    await dietService.deleteDietById(dietId, userId);

    res.status(200).json({
      success: true,
      message: "식단 삭제 성공",
      code: "DEIT_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// meal 삭제
export const deleteMealById = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { dietid, mealid } = req.params;

  if (!dietid) {
    throw new BadRequestError("Meal 아이디 필수");
  }

  if (!mealid) {
    throw new BadRequestError("Meal 아이디 필수");
  }
  try {
    const dietId = new mongoose.Types.ObjectId(dietid);
    const mealId = new mongoose.Types.ObjectId(mealid);

    await dietService.deleteMealById(dietId, mealId, userId);

    res.status(200).json({
      success: true,
      message: "Meal 삭제 성공",
      code: "MEAL_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 음식 삭제
export const deleteFoodById = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { dietid, mealid, foodid } = req.params;

  if (!dietid) {
    throw new BadRequestError("Meal 아이디 필수");
  }

  if (!mealid) {
    throw new BadRequestError("Meal 아이디 필수");
  }

  if (!foodid) {
    throw new BadRequestError("음식 아이디 필수");
  }

  try {
    const dietId = new mongoose.Types.ObjectId(dietid);
    const foodId = new mongoose.Types.ObjectId(foodid);
    await dietService.deleteFoodById(dietId, foodId, userId);

    res.status(200).json({
      success: true,
      message: "음식 삭제 성공",
      code: "FOOD_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 사용자의 미팅 목록 조회
export const getMeetingListByUserId = async (req: Request, res: Response) => {
  const user = req.user;

  try {
    const meetings = await meetingService.getMeetingList(user._id);

    res.status(200).json({
      success: true,
      message: "모임 조회 성공",
      code: "GET_MEETING_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meetings,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 식단 수정
export const updateDietById = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { dietid } = req.params;
  const { diet } = req.body;

  console.log("수정 요청", req.body.diet.meals);
  console.log(
    "수정 요청",
    req.body.diet.meals.map((m: any) => m.foods)
  );

  if (!dietid) {
    throw new BadRequestError("식단 아이디 필수");
  }

  if (!diet) {
    throw new BadRequestError("식단 필수");
  }

  const dietId = new mongoose.Types.ObjectId(dietid);
  try {
    const newDiet = await dietService.updateDiet(dietId, diet, userId);

    res.status(200).json({
      success: true,
      message: "식단 피드백 수정 성공",
      code: "UPDATE_DIET_FEEDBACK_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        diet: newDiet,
      },
    });
  } catch (error) {
    throw error;
  }
};

// Meal 수정
export const updateMeal = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { dietid, mealid } = req.params;
  const { meals, total_calories } = req.body;

  console.log(userId);

  if (!dietid) {
    throw new BadRequestError("식단 아이디 필수");
  }

  if (!mealid) {
    throw new BadRequestError("Meal 아이디 필수");
  }

  if (!meals) {
    throw new BadRequestError("식단 필수");
  }

  if (!total_calories) {
    throw new BadRequestError("총 칼로리 필수");
  }

  try {
  } catch (error) {
    throw error;
  }
};

// food 수정
export const updateFood = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { dietid, mealid, foodid } = req.params;
  const { foods, total_calories } = req.body;

  console.log(userId);

  if (!dietid) {
    throw new BadRequestError("식단 아이디 필수");
  }

  if (!mealid) {
    throw new BadRequestError("Meal 아이디 필수");
  }

  if (!foodid) {
    throw new BadRequestError("음식 아이디 필수");
  }

  if (!foods) {
    throw new BadRequestError("식단 필수");
  }

  if (!total_calories) {
    throw new BadRequestError("총 칼로리 필수");
  }
  try {
  } catch (error) {
    throw error;
  }
};
