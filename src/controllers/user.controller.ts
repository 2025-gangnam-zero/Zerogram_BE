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
import {
  MealState,
  UserUpdateDto,
  UserUpdateResponseDto,
  WorkoutCreateDto,
} from "../types";
import { deleteImage } from "../utils";

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

// 운동 일지 목록 조회
export const getWorkoutListById = async (req: Request, res: Response) => {
  const user = req.user;
  try {
    const workouts = await workoutService.getWoroutListByUserId(user._id);

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
  const user = req.user;
  const { workout_name, duration, calories, feedback, running, fitness } =
    req.body;

  if (!workout_name) {
    throw new BadRequestError("운동 종류 필수");
  }

  if (!duration) {
    throw new BadRequestError("운동 시간 필수");
  }

  if (!calories) {
    throw new BadRequestError("칼로리 필수");
  }

  if (!running && !fitness) {
    throw new BadRequestError("running 혹은 fitness 정보 필수");
  }

  try {
    const workoutCreate = {
      userId: user._id,
      workout_name,
      duration,
      calories,
      feedback,
      running,
      fitness,
    } as WorkoutCreateDto;

    const workout = await workoutService.createWorkout(workoutCreate);

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
  const user = req.user;
  const { workoutid } = req.params;
  const { workout_name, running, fitness } = req.body;

  if (!workoutid) {
    throw new BadRequestError("운동일지 아이디 필수");
  }

  if (!workout_name) {
    throw new BadRequestError("운동 종류 필수");
  }

  if (!running && !fitness) {
    throw new BadRequestError("러닝 혹은 피트니스 필수");
  }

  try {
    // 운동 일지 아이디 변경
    const workoutId = new mongoose.Types.ObjectId(workoutid);

    // 운동일지 상세
    const detail = running || fitness;

    // 운동일지 상세 생성
    const workout = await workoutService.createWorkoutDetail(
      workoutId,
      workout_name,
      detail,
      user._id
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

// 운동 일지 수정 : 운동일지 전체 수정
export const updateWorkoutById = async (req: Request, res: Response) => {
  const user = req.user;
  const { workoutid } = req.params;
  const { feedback } = req.body;

  if (!feedback) {
    throw new BadRequestError("피드백 필수");
  }

  try {
    const workoutId = new mongoose.Types.ObjectId(workoutid);

    const workout = await workoutService.updateWorkout(
      workoutId,
      { feedback },
      user._id
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

// 운동 일지 삭제
export const deleteWorkoutById = async (req: Request, res: Response) => {
  const user = req.user;
  const { workoutid } = req.params;

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

// 사용자의 일일 식단 목록
export const getDietListById = async (req: Request, res: Response) => {
  const user = req.user;
  try {
    const diets = await dietService.getDietListByUserId(user._id);

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
  const user = req.user;
  const {} = req.body;
  try {
    const meal = {} as MealState;
    const diet = await dietService.createDiet(user._id, meal);

    res.status(201).json({
      success: true,
      message: "일일 식단 추가",
      code: "DIET_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        diet,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 식단 생성
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

// 식단 수정
export const updateDietFeedbackById = async (req: Request, res: Response) => {
  const user = req.user;
  const { dietId, feedback } = req.body;

  if (!dietId) {
    throw new BadRequestError("식단 아이디 필수");
  }

  if (!feedback) {
    throw new BadRequestError("피드백 필수");
  }

  const _id = new mongoose.Types.ObjectId(dietId);
  try {
    await dietService.updateFeedback(_id, feedback, user._id);

    res.status(200).json({
      success: true,
      message: "식단 피드백 수정 성공",
      code: "UPDATE_DIET_FEEDBACK_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 식단 삭제
export const deleteDietById = async (req: Request, res: Response) => {
  const user = req.user;
  const { dietId } = req.body;

  if (!dietId) {
    throw new BadRequestError("식단 아이디 필수");
  }

  const _id = new mongoose.Types.ObjectId(dietId);
  try {
    await dietService.deleteDietById(_id, user._id);

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
