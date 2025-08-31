import { Types } from "mongoose";
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";
import { meetingRepository } from "../repositories";
import {
  MeetingState,
  MeetingUpdateDto,
  ReplyState,
  UserState,
} from "../types";

class MeetingService {
  // 모임 목록 조회 : 모든 목록 및 사용자의 목록 조회 동시에 처리
  async getMeetingList(userId?: Types.ObjectId): Promise<MeetingState[]> {
    try {
      const meetings = await meetingRepository.getMeetingList(userId);

      return meetings;
    } catch (error) {
      throw error;
    }
  }

  // 모임 조회
  async getMeetingById(_id: Types.ObjectId): Promise<MeetingState> {
    try {
      const meeting = await meetingRepository.getMeetingById(_id);

      if (!meeting) {
        throw new NotFoundError("모임 조회 실패");
      }

      return meeting;
    } catch (error) {
      throw error;
    }
  }

  // 모임 생성
  async createMeeting(meetingReq: MeetingState): Promise<MeetingState> {
    try {
      const meeting = await meetingRepository.createMeeting(meetingReq);

      if (!meeting) {
        throw new InternalServerError("모임 생성 실패");
      }

      return meeting;
    } catch (error) {
      throw error;
    }
  }

  // 권한 확인
  async checkMeetingAuthroization(user: UserState, meetingId: Types.ObjectId) {
    try {
      const meeting = await this.getMeetingById(meetingId);

      if (!meeting) {
        throw new NotFoundError("모임 조회 실패");
      }

      if (meeting.writer !== user._id && user.role === "ADMIN") {
        throw new UnauthorizedError("권한 없음");
      }
    } catch (error) {
      throw error;
    }
  }

  // 모임 수정
  async updateMeetingById(
    user: UserState,
    meetingId: Types.ObjectId,
    updateMeeting: MeetingUpdateDto
  ): Promise<void> {
    try {
      await this.checkMeetingAuthroization(user, meetingId);

      const result = await meetingRepository.updateMeeting(
        meetingId,
        updateMeeting
      );

      if (result.matchedCount === 0) {
        throw new NotFoundError("모임 조회 실패");
      }

      if (result.modifiedCount === 0) {
        throw new InternalServerError("모임 수정 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 모임 삭제
  async deleteMeetingById(
    user: UserState,
    meetingId: Types.ObjectId
  ): Promise<void> {
    try {
      await this.checkMeetingAuthroization(user, meetingId);

      const result = await meetingRepository.deleteMeeting(meetingId);

      // 삭제 결과 검증
      if (!result.acknowledged) {
        throw new InternalServerError("모임 삭제 승인 실패");
      }
      if (result.deletedCount === 0) {
        throw new NotFoundError("모임 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 댓글 생성
  async createReply(replyDto: ReplyState) {
    try {
      const reply = await meetingRepository.createReply(replyDto);

      if (!reply) {
        throw new InternalServerError("댓글 생성 실패");
      }

      return reply;
    } catch (error) {
      throw error;
    }
  }

  // 댓글 조회
  async getReplyById(replyId: Types.ObjectId) {
    try {
      const reply = await meetingRepository.getReplyById(replyId);

      if (!reply) {
        throw new NotFoundError("댓글 조회 성공");
      }

      return reply;
    } catch (error) {
      throw error;
    }
  }

  // 댓글 권한 확인
  async checkReplyAuthorization(user: UserState, replyId: Types.ObjectId) {
    try {
      const reply = await meetingRepository.getReplyById(replyId);

      if (user._id !== reply?.userId && user.role !== "ADMIN") {
        throw new UnauthorizedError("권한 없음");
      }
    } catch (error) {
      throw error;
    }
  }

  // 댓글 수정
  async updateReply(user: UserState, replyId: Types.ObjectId, text: string) {
    try {
      // 권한 확인
      await this.checkReplyAuthorization(user, replyId);

      const result = await meetingRepository.updateReply(replyId, text);

      if (result.matchedCount === 0) {
        throw new NotFoundError("댓글 조회 실패");
      }

      if (result.modifiedCount === 0) {
        throw new InternalServerError("댓글 수정 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 댓글 삭제
  async deleteReply(user: UserState, replyId: Types.ObjectId) {
    try {
      // 권한 확인
      await this.checkReplyAuthorization(user, replyId);

      const result = await meetingRepository.deleteReply(replyId);

      if (!result.acknowledged) {
        throw new InternalServerError("댓글 삭제 승인 실패");
      }

      if (result.deletedCount === 0) {
        throw new InternalServerError("댓글 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 참여자 추가
  async addParticipant(meetingId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const meeting = await this.getMeetingById(meetingId);

      if (meeting.participants.includes(userId)) {
        throw new ConflictError("이미 참여한 사용자");
      }

      const result = await meetingRepository.addParticipant(meetingId, userId);

      if (result.matchedCount === 0) {
        throw new NotFoundError("모임 조회 실패");
      }

      if (result.modifiedCount === 0) {
        throw new InternalServerError("참여자 추가 실패");
      }
    } catch (error) {
      throw error;
    }
  }

  // 참여자 삭제
  async removeParticipant(meetingId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const meeting = await this.getMeetingById(meetingId);

      if (!meeting.participants.includes(userId)) {
        throw new NotFoundError("참여자 조회 실패");
      }

      const result = await meetingRepository.removeParticipant(
        meetingId,
        userId
      );

      if (result.matchedCount === 0) {
        throw new NotFoundError("모임 조회 실패");
      }

      if (result.modifiedCount === 0) {
        throw new InternalServerError("참여자 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new MeetingService();
