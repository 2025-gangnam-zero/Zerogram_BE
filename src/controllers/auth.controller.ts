import { Request, Response } from "express";
import { BadRequestError } from "../errors";
import { userService, userSessionService } from "../services";
import { UserState } from "../types";

export const signup = async (req: Request, res: Response) => {
  const userInfo = req.body;
  try {
    // 유효성 검사 추가

    // 사용자 계정 생성
    await userService.createUser(userInfo as UserState);

    res.status(201).json({
      success: true,
      message: "사용자 계정 생성 성공",
      code: "USER_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, pw } = req.body;

  // 유효성 검사
  if (!email) {
    throw new BadRequestError("이메일 필수");
  }

  if (!pw) {
    throw new BadRequestError("비밀번호 필수");
  }

  try {
    // 사용자 정보 확인
    const user = await userService.login(email, pw);

    // 사용자 세션 생성
    const userSession = await userSessionService.createUserSession(user._id);

    const { password, ...rest } = user;

    // sessionId를 어떤 식으로 전달할지 결정 필요

    // 응답
    res.status(200).json({
      success: true,
      message: "로그인 성공",
      code: "LOGIN_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        user: rest,
        sessionId: userSession._id, // 변경 될 수 있음
      },
    });
  } catch (error) {
    throw error;
  }
};

export const logout = async (req: Request, res: Response) => {
  const sessionId = req.sessionId;
  try {
    // 사용자 세션 생성
    await userSessionService.deleteUserSessionById(sessionId);

    res.status(200).json({
      success: true,
      message: "로그아웃 성공",
      code: "LOGOUT_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

export const oauth = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};

//
export const resetPassword = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};
