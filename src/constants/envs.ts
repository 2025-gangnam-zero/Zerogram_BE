import dotenv from "dotenv";
const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: `.env.${env}`,
});

export const PORT = process.env.PORT || "4000";
export const SERVER_URL = process.env.SERVER_URL || "http://localhost";
export const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_SECRET = process.env.GOOGLE_SECRET || "";
export const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID || "";
export const KAKAO_SECRET = process.env.KAKAO_SECRET || "";
export const MONGODB_URL = process.env.MONGODB_URL || "";
