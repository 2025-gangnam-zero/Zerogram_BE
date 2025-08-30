import { DeleteResult, Types, UpdateResult } from "mongoose";
import { Meeting, Reply } from "../models";
import { MeetingState, MeetingUpdateDto, ReplyState } from "../types";
import { mongoDBErrorHandler } from "../utils";

class MeetingRespository {
  // 모임 목록 조회
  async getMeetingList(): Promise<MeetingState[]> {
    try {
      const meetings = await Meeting.find({});

      return meetings;
    } catch (error) {
      throw mongoDBErrorHandler("getMeetingList", error);
    }
  }

  // 모임 조회
  async getMeetingById(_id: Types.ObjectId): Promise<MeetingState | null> {
    try {
      const meeting = await Meeting.findById({ _id });

      return meeting;
    } catch (error) {
      throw mongoDBErrorHandler("getMeetingById", error);
    }
  }

  // 모임 생성
  async createMeeting(newMeeting: MeetingState): Promise<MeetingState> {
    try {
      const meeting = await Meeting.create(newMeeting);

      return meeting;
    } catch (error) {
      throw mongoDBErrorHandler("createMeeting", error);
    }
  }

  // 모임 수정
  async updateMeeting(
    _id: Types.ObjectId,
    updatedMeeting: MeetingUpdateDto
  ): Promise<UpdateResult> {
    try {
      const result = await Meeting.updateOne({ _id }, { ...updatedMeeting });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateMeeting", error);
    }
  }

  // 참석자 추가
  async addParticipant(
    _id: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<UpdateResult> {
    try {
      const result = await Meeting.updateOne(
        { _id },
        {
          $addToSet: {
            participants: userId,
          },
        }
      );

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("addParticipant", error);
    }
  }

  // 참석자 삭제
  async removeParticipant(
    _id: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<UpdateResult> {
    try {
      const result = await Meeting.updateOne(
        { _id },
        {
          $pull: {
            participants: userId,
          },
        }
      );

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("removeParticipant", error);
    }
  }

  // 모임 삭제
  async deleteMeeting(_id: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await Meeting.deleteOne({ _id });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteMeeting", error);
    }
  }

  // 댓글 생성
  async createReply(newReply: ReplyState): Promise<ReplyState | null> {
    try {
      const reply = await Reply.create(newReply);

      return reply;
    } catch (error) {
      throw mongoDBErrorHandler("createReply", error);
    }
  }

  // 댓글 수정
  async updateReply(_id: Types.ObjectId, text: string): Promise<UpdateResult> {
    try {
      const result = await Reply.updateOne(
        { _id },
        {
          $set: {
            text,
          },
        }
      );

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("updateReply", error);
    }
  }

  // 댓글 삭제
  async deleteReply(_id: Types.ObjectId): Promise<DeleteResult> {
    try {
      const result = await Reply.deleteOne({ _id });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteReply", error);
    }
  }

  // 댓글 조회
  async getReplyById(_id: Types.ObjectId): Promise<ReplyState | null> {
    try {
      const reply = await Reply.findById({ _id });

      return reply;
    } catch (error) {
      throw mongoDBErrorHandler("getReplyById", error);
    }
  }
}

export default new MeetingRespository();
