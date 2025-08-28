import { Types } from "mongoose";
import { InternalServerError, NotFoundError } from "../errors";
import { userSessionRepository } from "../repositories";
import { UserSessionResponseDto } from "../types";

class UserSessionService {
  // 사용자 세션 조회
  async getUserSessionById(
    _id: Types.ObjectId
  ): Promise<UserSessionResponseDto> {
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
}

export default new UserSessionService();
