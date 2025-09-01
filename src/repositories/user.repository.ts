import { DeleteResult, Types, UpdateResult } from "mongoose";
import { User } from "../models";
import { UserState, UserUpdateDto } from "../types";
import { mongoDBErrorHandler } from "../utils";

class UserRepository {
  // 사용자 계정 생성
  async createUser(userInfo: UserState): Promise<UserState> {
    try {
      const user = User.create(userInfo);

      return user;
    } catch (error) {
      throw mongoDBErrorHandler("createUser", error);
    }
  }

  // objectId를 이용한 사용자 조회
  async getUserById(_id: Types.ObjectId): Promise<UserState | null> {
    try {
      const user = await User.findById({ _id });

      return user;
    } catch (error) {
      throw mongoDBErrorHandler("getUserById", error);
    }
  }

  // 이메일을 이용한 사용자 조회
  async getUserByEmail(email: string): Promise<UserState | null> {
    try {
      const user = await User.findOne({ email }).lean();

      return user;
    } catch (error) {
      throw mongoDBErrorHandler("getUserByEmail", error);
    }
  }

  // 사용자 정보 업데이트
  async updateMe(
    _id: Types.ObjectId,
    updateUserInfo: UserUpdateDto
  ): Promise<UpdateResult> {
    try {
      const result = await User.updateOne({ _id }, { updateUserInfo });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateMe", error);
    }
  }

  // 사용자 계정 삭제
  async deleteUser(_id: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await User.deleteOne({ _id });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler;
    }
  }

  // 사용자 목록 조회
  async getUserList(): Promise<UserState[]> {
    try {
      const users = await User.find({});

      return users;
    } catch (error) {
      throw mongoDBErrorHandler("getUserList", error);
    }
  }
}

export default new UserRepository();
