import { Types } from "mongoose";

export interface UserSessionState {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessionCreateDto {
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
}
