import { Request, Response } from "express";
import { BadRequestError, ForbiddenError } from "../errors";
import { userService, userSessionService } from "../services";
import { OauthInfo, OauthType, UserState } from "../types";
import { oauths } from "../data";
import {
  OAUTH_REDIRECT_URI,
  OAUTH_GRANT_TYPE,
  CLIENT_URL,
  CLIENT_PORT,
} from "../constants";

// 회원 가입
export const signup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email) {
    throw new BadRequestError("이메일 필수");
  }

  if (!password) {
    throw new BadRequestError("비밀번호 필수");
  }

  if (!name) {
    throw new BadRequestError("닉네임 필수");
  }

  if (!/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email)) {
    throw new BadRequestError("이메일 형식 에러");
  }

  if (password.length < 8) {
    throw new BadRequestError("패스워드 형식 에러");
  }

  try {
    const userInfo = {
      email,
      password,
      nickname: name,
    };
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

// 로그인
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

// 로그 아웃
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

// 소셜 로그인
export const oauth = async (req: Request, res: Response) => {
  try {
    const { state, code } = req.query;

    console.log("state", state, "code", code);

    // state와 code를 전달 받지 못한 경우
    if (!state || !code) {
      throw new BadRequestError("소셜 타입과 code 필수");
    }

    // state를 통한 소셜 타입 확인
    const oauthType = state.toString() as OauthType;

    // 소셜 로그인 필요 정보 구조 분해
    const { client_id, client_secret, token_url, userInfo_url } = oauths[
      oauthType
    ] as OauthInfo;

    console.log(client_id, client_secret);

    // 토큰 요청을 위한 필요 정보
    const requestBody = {
      code: code as string, // 인증 코드
      client_id,
      client_secret,
      redirect_uri: OAUTH_REDIRECT_URI,
      grant_type: OAUTH_GRANT_TYPE,
    };

    console.log(OAUTH_REDIRECT_URI);

    // 토큰 요청
    try {
      const response = await fetch(token_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams(requestBody).toString(),
      });

      if (!response.ok) {
        // 응답 본문을 텍스트로 가져오기
        const errorText = await response.text();
        console.error(`에러: ${response.status}, ${errorText}`);

        throw new ForbiddenError("Oauth 액세스 토큰 취득 실패");
      }

      const result = await response.json();

      // 소셜 액세스 토큰
      const access_token = result.access_token;

      console.log(userInfo_url);
      console.log(access_token);

      // 사용자 정보 요청
      try {
        const response = await fetch(userInfo_url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!response.ok) {
          // 응답 본문을 텍스트로 가져오기
          const errorText = await response.text();
          console.error(`에러: ${response.status}, ${errorText}`);

          throw new ForbiddenError("Oauth 사용자 정보 조회 실패");
        }

        const result = await response.json();

        // 소셜 로그인 사용자 정보: 초기값
        let oauthUserInfo: {
          email: string;
          nickname: string;
          profile_image: string;
        } = {
          email: "",
          nickname: "",
          profile_image: "",
        };

        if (oauthType === "google") {
          oauthUserInfo = {
            email: result.email,
            nickname: result.name,
            profile_image: result.picture,
          };
        } else if (oauthType === "kakao") {
          oauthUserInfo = {
            email: result.kakao_account.email,
            nickname: result.properties.nickname,
            profile_image: result.properties.profile_image,
          };
        }

        // 소셜 로그인 : 기존 사용자 여부 확인하고 정보 조회
        const user = await userService.socialLogin(oauthUserInfo.email);

        console.log(user);

        // 기존 사용자가 아닌 경우: 회원가입 진행
        if (!user) {
          // 사용자 계정 생성
          const user = await userService.createUser(oauthUserInfo as UserState);

          // 세션 생성
          const session = await userSessionService.createUserSession(user._id);

          const { password, ...rest } = user;

          const params = new URLSearchParams();
          Object.entries(rest).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            params.append(k, String(v));
          });

          return res.redirect(
            `${CLIENT_URL}:${CLIENT_PORT}/login?sessionId=${
              session._id
            }&${params.toString()}`
          );
        }

        // 사용자 세션 생성
        const userSession = await userSessionService.createUserSession(
          user._id
        );

        const { password, ...rest } = user;

        // sessionId를 어떤 식으로 전달할지 결정 필요

        const params = new URLSearchParams();
        Object.entries(rest).forEach(([k, v]) => {
          if (v === undefined || v === null) return;
          params.append(k, String(v));
        });

        console.log(params);
        // 응답
        return res.redirect(
          `${CLIENT_URL}:${CLIENT_PORT}/login?sessionId=${
            userSession._id
          }&${params.toString()}`
        );
      } catch (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

// 비밀번호 재설정
export const resetPassword = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    throw error;
  }
};
