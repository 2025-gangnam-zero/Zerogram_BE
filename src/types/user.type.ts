import { Types } from "mongoose";

export type GenderType = "m" | "f";

export interface UserState {
  name: string;
  email: string;
  password: string;
  profile_image?: string;
  gender: GenderType;
  favoriteSports: string[];
  address: string;
  height: number;
  weight: number;
  meetings: Types.ObjectId[];
}

export interface IUser extends UserState {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
