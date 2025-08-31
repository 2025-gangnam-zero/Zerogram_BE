import {
  GOOGLE_SECRET,
  GOOGLE_USERINFO_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_TOKEN_URL,
  KAKAO_CLIENT_ID,
  KAKAO_SECRET,
  KAKAO_TOKEN_URL,
  KAKAO_USERINFO_URL,
} from "../constants";
import { OauthInfo, OauthType } from "../types";

export const oauths: Record<OauthType, OauthInfo> = {
  google: {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_SECRET,
    token_url: GOOGLE_TOKEN_URL,
    userInfo_url: GOOGLE_USERINFO_URL,
  },
  kakao: {
    client_id: KAKAO_CLIENT_ID,
    client_secret: KAKAO_SECRET,
    token_url: KAKAO_TOKEN_URL,
    userInfo_url: KAKAO_USERINFO_URL,
  },
};
