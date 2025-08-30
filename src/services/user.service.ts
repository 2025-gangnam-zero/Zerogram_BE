import { Types } from "mongoose";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";
import { userRepository } from "../repositories";
import { UserState, UserUpdateDto } from "../types";
import { checkPassword, hashPassword } from "utils";

class UserService {
  // _id를 이용한 사용자 조회
  async getUserById(_id: Types.ObjectId): Promise<UserState> {
    try {
      const user = await userRepository.getUserById(_id);

      if (!user) {
        throw new NotFoundError("사용자 조회 실패");
      }

      return user;
    } catch (err) {
      throw err;
    }
  }

  // email를 이용한 사용자 조회
  async getUserByEmail(email: string): Promise<UserState> {
    try {
      const user = await userRepository.getUserByEmail(email);

      if (!user) {
        throw new NotFoundError("사용자 조회 실패");
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // email 중복 조회
  async checkEmailDuplicate(email: string): Promise<Boolean> {
    try {
      const user = await userRepository.getUserByEmail(email);

      return user ? true : false;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 계정 생성
  async createUser(userInfo: UserState): Promise<UserState> {
    try {
      const { email, password } = userInfo;

      // 이메일 중복 확인
      const existingUser = await this.checkEmailDuplicate(email);

      // 이메일 중복 시 종료
      if (existingUser) {
        throw new ConflictError("이메일 중복");
      }

      // 사용자 이미지 업로드 시 이미지 업로드 필요

      let hashedPassword;
      // 비밀번호 해싱
      if (password) {
        hashedPassword = await hashPassword(password!);
      }

      // 수정된 request dto
      const modifiedUserInfo = {
        ...userInfo,
        password: hashedPassword,
      } as UserState;

      // 사용자 계정 생성
      const user = await userRepository.createUser(modifiedUserInfo);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // 로그인
  async login(email: string, password: string): Promise<UserState> {
    try {
      // 이메일을 이용한 사용자 조회
      const user = await userRepository.getUserByEmail(email);

      if (!user) {
        throw new NotFoundError("사용자 조회 실패");
      }

      // 비밀번호 일치 확인
      const isPasswordMatched = await checkPassword(password, user.password!);

      if (!isPasswordMatched) {
        throw new UnauthorizedError("패스워드 불일치");
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 목록 조회
  async getUserList(): Promise<UserState[]> {
    try {
      const users = await userRepository.getUserList();

      return users;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 수정
  async updateMe(userId: Types.ObjectId, userUpdate: UserUpdateDto) {
    try {
      const result = await userRepository.updateMe(userId, userUpdate);

      if (result.matchedCount === 0) {
        throw new NotFoundError("사용자 조회 실패");
      }

      if (result.modifiedCount === 0) {
        throw new InternalServerError("사용자 수정 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 사용자 삭제
  async deleteUserById(userId: Types.ObjectId) {
    try {
      const result = await userRepository.deleteUser(userId);

      if (!result.acknowledged) {
        throw new InternalServerError("사용자 삭제 승인 실패");
      }

      if (result.deletedCount === 0) {
        throw new InternalServerError("사용자 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  
}

export default new UserService();
