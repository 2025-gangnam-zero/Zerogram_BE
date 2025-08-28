import { Request, Response } from "express";
import { OauthType } from "../types";
import { oauths } from "../data";

export const signup = async (req: Request, res: Response) => {};

export const login = async (req: Request, res: Response) => {};

export const logout = async (req: Request, res: Response) => {};

export const oauth = async (req: Request, res: Response) => {
  const { state, code } = req.query;

  const oauthType = state as OauthType;

  console.log(oauthType, code);

  const redirect_uri = (process.env.REACT_APP_BASE_URL || "") + "/auth/oauth";

  if (code) {
    const requestBody = {
      code: code as string,
      client_id: oauths[oauthType].client_id,
      client_secret: oauths[oauthType].client_secret,
      redirect_uri,
      grant_type: "authorization_code",
    };

    const response = await fetch(oauths[state as OauthType].token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams(requestBody).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error: ${response.status}, ${errorText}`);
      throw new Error("엑세스 토큰 취득 실패");
    }

    const data = await response.json();

    const access_token = data.access_token;

    if (access_token) {
      const response = await fetch(
        oauths[oauthType].userInfo,

        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`, // Authorization 헤더에 Bearer 토큰 포함
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text(); // 응답 본문을 텍스트로 가져오기
        console.error(`Error: ${response.status}, ${errorText}`);
      }

      const data = await response.json();

      if (oauthType === "kakao") {
        const nickname = data.properties.nickname;
        const profile_image = data.properties.profile_image;
        const email = data.kakao_account.email;

        console.log(nickname, profile_image, email);
      } else if (oauthType === "google") {
        console.log(data);
        const { email, name: nickname, picture: profile_image } = data;
      }
    }
  }
};

export const getPasswordByEmail = async (req: Request, res: Response) => {};
