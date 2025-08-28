import { DeleteResult, Types } from "mongoose";
import { UserSession } from "../models";
import { mongoDBErrorHandler } from "../utils";
import { UserSessionResponseDto } from "../types";

class UserSessionRepository {
  async getUserSessionById(
    _id: Types.ObjectId
  ): Promise<UserSessionResponseDto | null> {
    try {
      const user_session = await UserSession.findById(_id);

      return user_session;
    } catch (error) {
      throw mongoDBErrorHandler("getUserSessionById", error);
    }
  }

  async deleteUserSessionById(_id: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await UserSession.deleteOne({ _id });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteUserSessionId", error);
    }
  }
}

export default new UserSessionRepository();
