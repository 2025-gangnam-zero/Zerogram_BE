import { Types } from "mongoose";

export type GenderType = "m" | "f";
export type RoleType = "USER" | "ADMIN";

export interface UserState {
  _id: Types.ObjectId;
  nickname: string; // 사용자 이름
  email: string; // 이메일
  password?: string; // 비밀번호
  profile_image?: string; // 프로필 이미지
  gender: GenderType; // 성별
  role: RoleType;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateDto {
  nickname?: string;
  password?: string;
  profile_image?: string;
  favoriteSports?: string[];
  address?: string;
  height?: number;
  weight?: number;
}

export interface UserUpdateResponseDto {
  profile_image?: string;
  nickname?: string;
}
