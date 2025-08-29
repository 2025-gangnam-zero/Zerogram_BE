import { DeleteResult, Types, UpdateResult } from "mongoose";
import { UserSession } from "../models";
import { mongoDBErrorHandler } from "../utils";
import { UserSessionCreateDto, UserSessionState } from "types";

class UserSessionRepository {
  // 사용자 세션 생성
  async createUserSession(userSession: UserSessionCreateDto) {
    try {
      const newUserSession = await UserSession.create(userSession);

      return newUserSession;
    } catch (error) {
      mongoDBErrorHandler("createUserSession", error);
    }
  }

  // 사용자 세션 조회
  async getUserSessionById(
    _id: Types.ObjectId
  ): Promise<UserSessionState | null> {
    try {
      const user_session = await UserSession.findById(_id);

      return user_session;
    } catch (error) {
      throw mongoDBErrorHandler("getUserSessionById", error);
    }
  }

  // 사용자 세션 삭제
  async deleteUserSessionById(_id: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await UserSession.deleteOne({ _id });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteUserSessionId", error);
    }
  }

  // 사용자 세션 업데이트
  async updateAccessToken(
    _id: Types.ObjectId,
    access_token: string
  ): Promise<UpdateResult> {
    try {
      const result = await UserSession.updateOne({ _id }, { access_token });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateAccessToken", error);
    }
  }
}

export default new UserSessionRepository();
