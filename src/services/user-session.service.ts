import { Types } from "mongoose";

class UserSessionService {
  // 사용자 세션 조회
  async getUserSessionById(_id: Types.ObjectId): Promise<any> {
    try {
      return;
    } catch (error) {}
  }

  // 사용자 세션 삭제
  async deleteUserSessionById(_id: Types.ObjectId) {
    try {
    } catch (error) {}
  }
}

export default new UserSessionService();
