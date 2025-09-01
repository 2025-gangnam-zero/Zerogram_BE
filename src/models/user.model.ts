import mongoose from "mongoose";
import { UserState } from "../types";

const UserSchema = new mongoose.Schema<UserState>(
  {
    nickname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    profile_image: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["m", "f"],
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const User = mongoose.model("User", UserSchema);
