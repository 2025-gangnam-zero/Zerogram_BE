import dotenv from "dotenv";
const env = process.env.NODE_ENV || "local";

dotenv.config({
  path: `.env.${env}` ? `.env.${env}` : undefined,
});

export const PORT = process.env.PORT || "4000";
export const SERVER_URL = process.env.SERVER_URL || "http://localhost";
export const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_SECRET = process.env.GOOGLE_SECRET || "";
export const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID || "";
export const KAKAO_SECRET = process.env.KAKAO_SECRET || "";
export const MONGODB_URL = process.env.MONGODB_URL || "";
export const CLIENT_PORT = process.env.CLIENT_PORT || "";
export const CLIENT_URL = CLIENT_PORT
  ? `${process.env.CLIENT_URL}:${CLIENT_PORT}`
  : process.env.CLIENT_URL || "";
export const AWS_REGION = process.env.AWS_REGION || "";
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
