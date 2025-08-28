import mongoose, { Types } from "mongoose";
import { UserSessionState } from "types";

const UserSessionSchema = new mongoose.Schema<UserSessionState>(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const UserSession = mongoose.model("UserSession", UserSessionSchema);
