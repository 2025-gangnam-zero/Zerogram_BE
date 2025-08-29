import { Document, Types } from "mongoose";

export interface UserSessionState extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  access_token: string;
  refresh_token: string;
  createdAt: Date;
}
