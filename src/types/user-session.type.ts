import { Document, Types } from "mongoose";

export interface UserSessionState extends Document {
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
}

export interface UserSessionCreateDto {
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
}
