import { SERVER_URL } from "./envs";

export const ACCESS_TOKEN_EXPIRESIN = "10m";
export const REFRESH_TOKEN_EXPIRESIN = "1h";
export const PASSWORD_SALT = 10;

// 구글
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL = "https://www.googleapis.com/userinfo/v2/me";

// 카카오
export const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
export const KAKAO_USERINFO_URL = "https://kapi.kakao.com/v2/user/me";

// 소셜 로그인
export const OAUTH_REDIRECT_URI = `${SERVER_URL}/auth/oauth`;
export const OAUTH_GRANT_TYPE = "authorization_code";
