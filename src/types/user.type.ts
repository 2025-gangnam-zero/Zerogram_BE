import { Types, Document } from "mongoose";

export type GenderType = "m" | "f";

export interface UserState extends Document {
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
