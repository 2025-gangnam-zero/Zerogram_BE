import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { userService, userSessionService } from "../services";
import { authLogout, jwtSign, jwtVerify } from "../utils";
import { ACCESS_TOKEN_EXPIRESIN } from "../constants";

export const authChecker = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionid = req.headers["x-session-id"] as string;
  const sessionId = new mongoose.Types.ObjectId(sessionid);

  // 세션 아이디가 없으면 로그아웃
  if (!sessionid) {
    authLogout(res, "세션 아이디가 존재하지 않음");
    return;
  }

  try {
    // 사용자 세션 확인
    const user_session = await userSessionService.getUserSessionById(sessionId);

    const { userId, access_token, refresh_token } = user_session;

    try {
      // 토큰 유효성 확인
      await jwtVerify(access_token);

      // 사용자 정보 조회
      const user = await userService.getUserById(userId);

      // 사용자 정보
      req.user = user;
      // 세션 정보
      req.sessionId = sessionId;

      next();
    } catch (err) {
      // 엑세스 토큰이 유효하지 않는 경우
      try {
        // 리프레시 토큰 유효성 확인
        const { _id } = await jwtVerify(refresh_token);

        // 액세스 토큰 재발급
        const access_token = await jwtSign({ _id }, ACCESS_TOKEN_EXPIRESIN);

        res.status(200).json({
          success: true,
          message: "액세스 토큰 재발급",
          code: "ACCESS_TOKEN_REISSUED",
          timestamp: new Date().toISOString(),
          data: {
            access_token,
            sessionId,
          },
        });
      } catch (err) {
        // 리프레시 토큰의 유효성이 만료된 경우 로그아웃
        authLogout(res, "리프레시 토큰 만료로 인한 로그아웃", sessionId);
        return;
      }
    }
  } catch (err) {
    // 사용자 세션을 찾을 수 없는 경우 로그아웃
    authLogout(res, "사용자 세션을 찾을 수 없습니다.", sessionId);
    return;
  }
};
