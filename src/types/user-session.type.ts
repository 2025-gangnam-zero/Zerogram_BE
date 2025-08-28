import { Types } from "mongoose";

export interface UserSessionState {
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
}
