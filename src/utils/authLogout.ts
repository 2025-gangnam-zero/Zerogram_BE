import { Response } from "express";
import { Types } from "mongoose";
import { userSessionService } from "../services";

export const authLogout = async (
  res: Response,
  message: string,
  sessionId?: Types.ObjectId
) => {
  try {
    if (sessionId) {
      await userSessionService.deleteUserSessionById(sessionId);
    }

    return res.status(401).json({
      success: false,
      message,
      code: "LOGOUT",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message,
      code: "LOGOUT",
      timestamp: new Date().toISOString(),
    });
  }
};
