import { Types } from "mongoose";

export interface UserSessionResponseDto {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
  createdAt: Date;
}

export interface UserSessionState extends UserSessionResponseDto {}
