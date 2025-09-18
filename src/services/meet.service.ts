import mongoose, { ClientSession, Types } from "mongoose";
import {
  MeetCreateRequestDto,
  MeetListOpts,
  MeetResponseDto,
  MeetUpdateDto,
  MeetUpdateRequestDto,
} from "../dtos";
import { ForbiddenError, InternalServerError, NotFoundError } from "../errors";
import { meetRepository } from "../repositories";
import { userService, commentService } from "../services";
import { MeetState } from "../types";

class MeetService {
  // 모집글 생성
  async createMeet(newMeet: MeetCreateRequestDto): Promise<MeetResponseDto> {
    try {
      const meet = await meetRepository.createMeet(newMeet);

      if (!meet) {
        throw new InternalServerError("모집글 생성 실패");
      }

      const { _id: userId, nickname } = await userService.getUserById(
        meet.userId
      );

      return {
        ...meet,
        userId,
        nickname,
        crews: [{ userId, nickname }],
        comments: [],
      };
    } catch (error) {
      throw error;
    }
  }

  // 모집글 목록 조회
  async getMeetList(opts: MeetListOpts): Promise<MeetResponseDto[]> {
    try {
      return await meetRepository.getMeetList(opts);
    } catch (error) {
      throw error;
    }
  }

  // 모집글 조회
  async getMeetById(meetId: Types.ObjectId): Promise<MeetResponseDto> {
    try {
      const meet = await meetRepository.getMeetById(meetId);
      if (!meet) {
        throw new InternalServerError("모집글 조회 실패");
      }

      return meet;
    } catch (error) {
      throw error;
    }
  }

  // 모집글 doc 조회
  async getMeetAsDoc(
    meetId: Types.ObjectId,
    session?: ClientSession
  ): Promise<MeetState> {
    try {
      const meet = await meetRepository.getMeetAsDoc(meetId, session);

      if (!meet) {
        throw new NotFoundError("모집글 조회 실패");
      }

      return meet;
    } catch (error) {
      throw error;
    }
  }

  // 작성자 확인
  async checkAuthorMatched(
    meetId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<void> {
    try {
      const meet = await this.getMeetAsDoc(meetId);

      if (!userId.equals(meet.userId)) {
        throw new ForbiddenError("권한 없음");
      }
    } catch (error) {
      throw error;
    }
  }

  // 모집글 삭제
  async deleteMeetById(meetId: Types.ObjectId): Promise<void> {
    try {
      const result = await meetRepository.deleteMeetById(meetId);

      if (!result.acknowledged) {
        throw new InternalServerError("모집글 삭제 승인 실패");
      }

      if (result.deletedCount === 0) {
        throw new InternalServerError("모집글 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 모집글 삭제 권한 사용자 삭제
  async deleteMeetWithAuthorization(
    meetId: Types.ObjectId,
    userId: Types.ObjectId
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 권한 확인
      await this.checkAuthorMatched(meetId, userId);

      // 모집글의 댓글 목록
      const { comments } = await this.getMeetAsDoc(meetId);

      // 모집글 내 댓글 삭제
      if (comments.length !== 0) {
        const commentIds = comments.map((comment) => comment._id);

        // 댓글 일괄 삭제
        await commentService.deleteAllComments(commentIds);
      }

      // 모집글 삭제
      await this.deleteMeetById(meetId);
    } catch (error) {
      throw error;
    }
  }

  // 모집글 수정
  async updateMeet(
    meetId: Types.ObjectId,
    meetUpdate: MeetUpdateDto
  ): Promise<void> {
    try {
      const result = await meetRepository.updateMeetById(meetId, meetUpdate);

      if (result.matchedCount === 0) {
        throw new NotFoundError("모집글 조회 실패");
      }

      if (!result.acknowledged || result.modifiedCount === 0) {
        throw new InternalServerError("모집글 수정 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 모집글 권한 확인 및 수정
  async updateMeetWithAuth(
    meetId: Types.ObjectId,
    meetUpdate: MeetUpdateRequestDto,
    userId: Types.ObjectId
  ): Promise<MeetResponseDto> {
    try {
      // 권한 확인
      await this.checkAuthorMatched(meetId, userId);

      // 모집글 수정
      await this.updateMeet(meetId, meetUpdate);

      // 수정된 모집글 조회
      return await this.getMeetById(meetId);
    } catch (error) {
      throw error;
    }
  }

  // 모집글에 댓글 아이디 추가
  async addCommentToMeet(
    meetId: Types.ObjectId,
    commentId: Types.ObjectId,
    session?: ClientSession
  ): Promise<void> {
    try {
      const result = await meetRepository.addCommentToMeet(
        meetId,
        commentId,
        session
      );

      if (result.matchedCount === 0) {
        throw new NotFoundError("모집글 조회 실패");
      }

      if (!result.acknowledged || result.modifiedCount === 0) {
        throw new InternalServerError("모집글에 댓글 추가 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 참여자 추가
  async addToCrews(
    meetId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      const result = await meetRepository.addToCrews(meetId, userId, session);

      if (result.matchedCount === 0) {
        throw new NotFoundError("모집글 조회 실패");
      }

      if (!result.acknowledged || result.modifiedCount === 0) {
        throw new InternalServerError("참여자 추가 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 참여자 삭제
  async removeToCrews(
    meetId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      const result = await meetRepository.removeFromCrews(
        meetId,
        userId,
        session
      );

      if (result.matchedCount === 0) {
        throw new NotFoundError("모집글 조회 실패");
      }

      if (!result.acknowledged || result.modifiedCount === 0) {
        throw new InternalServerError("참여자 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 모집글에 참여자 추가 삭제
  async toggleCrew(meetId: Types.ObjectId, userId: Types.ObjectId) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 모집글 조회
      const meet = await this.getMeetAsDoc(meetId, session);

      const crews = meet.crews;

      // 현재 참여자 인경우
      if (crews.includes(userId)) {
        await this.removeToCrews(meetId, userId);
      } else {
        //현재 참여자가 아닌 경우
        await this.addToCrews(meetId, userId);
      }

      await session.commitTransaction();
      return !crews.includes(userId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

export default new MeetService();
