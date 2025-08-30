import { BadRequestError } from "errors";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { meetingService, userService } from "services";

export const getAllInfo = async (req: Request, res: Response) => {
  try {
    // 사용자 목록 조회
    const users = await userService.getUserList();

    // 모임 목록 조회
    const meetings = await meetingService.getMeetingList();

    res.status(200).json({
      success: true,
      message: "사용자 목록 조회 성공",
      code: "USER_LIST_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        users,
        meetings,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getUserInfoByUserId = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    throw new BadRequestError("사용자 아이디 필수");
  }

  try {
    const _id = new mongoose.Types.ObjectId(userId);

    const user = await userService.getUserById(_id);

    res.status(200).json({
      success: true,
      message: "사용자 정보 조회 성공",
      code: "GET_USERINFO_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        user,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getMeetingById = async (req: Request, res: Response) => {
  const { meetingId } = req.body;

  if (!meetingId) {
    throw new BadRequestError("모임 아이디 필수");
  }

  const _id = new mongoose.Types.ObjectId(meetingId);

  try {
    const meeting = await meetingService.getMeetingById(_id);

    res.status(200).json({
      success: true,
      message: "모임 조회 성공",
      code: "GET_MEETING_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meeting,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getReplyById = async (req: Request, res: Response) => {};

export const deleteUserByEmail = async (req: Request, res: Response) => {};

export const deleteMeetingById = async (req: Request, res: Response) => {};

export const deleteReplyById = async (req: Request, res: Response) => {};
