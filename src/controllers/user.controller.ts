import { Request, Response } from "express";
import { userService } from "services";
import { UserUpdateDto } from "types";

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
  try {
  } catch (error) {
    throw error;
  }
};

export const createDiet = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

export const getDietById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

export const updateDietById = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

export const deleteDietById = async (req: Request, res: Response) => {
  try {
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
