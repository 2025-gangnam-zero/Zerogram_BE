import mongoose, { Schema } from "mongoose";
import { UserSessionState } from "../types";

const UserSessionSchema = new mongoose.Schema<UserSessionState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    access_token: {
      type: String,
      required: true,
    },
    refresh_token: {
      type: String,
      required: true,
    },
    login_type: {
      type: String,
      enum: ["normal", "social"],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const UserSession = mongoose.model("UserSession", UserSessionSchema);
