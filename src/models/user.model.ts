import mongoose from "mongoose";
import { UserState } from "types";

const UserSchema = new mongoose.Schema<UserState>(
  {},
  {
    versionKey: false,
    timestamps: true,
  }
);

export const User = mongoose.model("User", UserSchema);
