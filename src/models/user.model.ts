import mongoose, { Types } from "mongoose";
import { UserState } from "../types";

const UserSchema = new mongoose.Schema<UserState>(
  {
    name: {
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
    favoriteSports: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    meetings: {
      type: [Types.ObjectId],
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const User = mongoose.model("User", UserSchema);
