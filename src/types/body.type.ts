import { Types } from "mongoose";

export interface BodyState {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  height: number;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}
