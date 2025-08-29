import { User } from "models";
import { Types, UpdateResult } from "mongoose";
import { mongoDBErrorHandler } from "utils";

class UserRepository {
  // objectId를 이용한 사용자 조회
  async getUserById(_id: Types.ObjectId) {
    try {
      const user = await User.findById({ _id });

      return user;
    } catch (error) {
      throw mongoDBErrorHandler("getUserById", error);
    }
  }

  // 이메일을 이용한 사용자 조회
  async getUserByEmail(email: string) {
    try {
      const user = await User.findOne({ email });

      return user;
    } catch (error) {
      throw mongoDBErrorHandler("getUserByEmail", error);
    }
  }

  // 사용자 정보 업데이트
  async updateMe(_id: Types.ObjectId, updateInfo: {}): Promise<UpdateResult> {
    try {
      const result = await User.updateOne({ _id }, { updateInfo });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateMe", error);
    }
  }
}

export default new UserRepository();
