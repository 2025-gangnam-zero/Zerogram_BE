import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { toInt } from "../utils";
import { roomService } from "../services";
import { BadRequestError } from "../errors";

export const getRoomsByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user._id as Types.ObjectId;

    // limit: 필수 + 범위(1~100)
    const limitRaw = req.query.limit;
    if (typeof limitRaw !== "string") {
      throw new BadRequestError("limit 필수(숫자 문자열)");
    }
    const limit = Math.min(toInt(limitRaw, 30), 100);
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new BadRequestError("limit은 1~100 사이의 정수여야 합니다.");
    }

    // q: 선택
    const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;

    // workoutType: 선택
    const workoutTypeRaw = req.query.workoutType;
    const workoutType =
      workoutTypeRaw === "running" || workoutTypeRaw === "fitness"
        ? workoutTypeRaw
        : undefined;

    // cursor: 선택(첫 페이지면 보통 없음)
    const cursor =
      typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const result = await roomService.listRooms({
      userId,
      limit,
      q,
      workoutType,
      cursor,
    });

    res.status(200).json({
      success: true,
      message: "사용자의 가입된 채팅방 정보 조회 성공",
      code: "GET_ROOMS_BY_USERID_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: result, // { items, nextCursor }
    });
  } catch (error) {
    next(error);
  }
};
