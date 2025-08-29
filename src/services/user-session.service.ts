import { Types } from "mongoose";
import { InternalServerError, NotFoundError } from "../errors";
import { userSessionRepository } from "../repositories";
import { UserSessionState } from "../types";

class UserSessionService {
  // 사용자 세션 조회
  async getUserSessionById(_id: Types.ObjectId): Promise<UserSessionState> {
    try {
      const userSession = await userSessionRepository.getUserSessionById(_id);

      if (!userSession) {
        throw new NotFoundError("사용자 세션 조회 실패");
      }

      return userSession;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 세션 삭제
  async deleteUserSessionById(_id: Types.ObjectId): Promise<void> {
    try {
      const result = await userSessionRepository.deleteUserSessionById(_id);

      if (!result.acknowledged) {
        throw new NotFoundError("세션을 찾을 수 없음");
      }

      if (result.deletedCount === 0) {
        throw new InternalServerError("삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 액세스 토큰 업데잍 ㅡ
  async updateAccessToken(
    _id: Types.ObjectId,
    access_token: string
  ): Promise<void> {
    try {
      const result = await userSessionRepository.updateAccessToken(
        _id,
        access_token
      );

      if (result.matchedCount === 0) {
        throw new NotFoundError("세션 조회 실패");
      }

      if (result.modifiedCount === 0) {
        throw new InternalServerError("세션 변경 실패");
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new UserSessionService();
