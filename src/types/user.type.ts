import { Types } from "mongoose";

export type GenderType = "m" | "f";
export type RoleType = "USER" | "ADMIN";

export interface UserState {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  profile_image?: string;
  gender: GenderType;
  favoriteSports: string[];
  address: string;
  height: number;
  weight: number;
  meetings: Types.ObjectId[];
  role: RoleType;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateDto {
  password?: string;
  profile_image?: string;
  favoriteSports?: string[];
  address?: string;
  height?: number;
  weight?: number;
  meetings?: Types.ObjectId[];
}
