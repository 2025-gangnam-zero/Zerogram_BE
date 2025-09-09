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
import { MealState, UserUpdateDto, UserUpdateResponseDto } from "../types";
import { deleteImage } from "../utils";
import {
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

    // const workout = await workoutService.createNewWorkoutDetailsAndAddToWorkout(
    //   workoutId,
    //   newDetails
    // );

    res.status(200).json({
      success: true,
      message: "운동일지 상세 생성 성공",
      code: "WORKOUT_DETAIL_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        // workout,
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
// 운동일지 상세 수정
export const updateWorkoutDetail = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { workoutid, workoutdetailid } = req.params;
  const { detail } = req.body;

  if (!workoutid) {
    throw new BadRequestError("운동일지 아이디 필수");
  }

  if (!workoutdetailid) {
    throw new BadRequestError("운동일지상세 아이디 필수");
  }

  try {
    const workoutId = new mongoose.Types.ObjectId(workoutid);
    const workoutdetailId = new mongoose.Types.ObjectId(workoutdetailid);

    console.log(userId, detail, workoutId, workoutdetailId);

    res.status(200).json({
      success: true,
      message: "운동일지 상세 조회",
      code: "UPDATE_WORKOUT_DETAIL_SUCCEEDED",
      data: {},
    });
  } catch (error) {
    throw error;
  }
};

// 운동일지 상세 삭제
export const deleteWorkoutDetail = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: "운동일지 상세 조회",
      code: "WORKOUT_DETAIL_DELETION_SUCCEEDED",
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
