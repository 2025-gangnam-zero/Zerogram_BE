import { BadRequestError } from "errors";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { dietService, userService } from "services";
import { MealState, UserUpdateDto } from "types";

// 사용자 조회
export const getUserInfo = async (req: Request, res: Response) => {
  const user = req.user;
  try {
    res.status(200).json({
      success: true,
      message: "사용자 조회 성공",
      code: "GET_USER_SUCCEEDED",
      timestamp: new Date().toISOString(),
      date: {
        user,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 사용자 수정
export const updateMe = async (req: Request, res: Response) => {
  const user = req.user;
  const {} = req.body;

  try {
    const updateDto = {} as UserUpdateDto;

    await userService.updateMe(user._id, updateDto);

    res.status(200).json({
      success: true,
      message: "사용자 정보 수정",
      code: "USER_UPDATE_SUCCEEDED",
      timestamp: new Date().toISOString(),
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

export const getWorkoutListById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

export const createWorkout = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

export const getWorkoutById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

export const updateWorkoutById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

export const deleteWorkoutById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

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

export const getMeetingListById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};
