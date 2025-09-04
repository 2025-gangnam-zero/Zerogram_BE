import { Types } from "mongoose";

export type LoginType = "normal" | "social";

export interface UserSessionState {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
  login_type: LoginType;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessionCreateDto {
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
  login_type: LoginType;
}
