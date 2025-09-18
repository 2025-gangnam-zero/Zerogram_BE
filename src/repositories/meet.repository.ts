import { MeetState } from "types";
import {
  MeetCreateRequestDto,
  MeetListOpts,
  MeetResponseDto,
  MeetUpdateDto,
} from "../dtos";
import { Meet } from "../models";
import {
  aggregateGetMeetById,
  aggregateGetMeetList,
  mongoDBErrorHandler,
} from "../utils";
import { ClientSession, DeleteResult, Types, UpdateResult } from "mongoose";

class MeetRepository {
  // 모집글 생성
  async createMeet(newMeet: MeetCreateRequestDto): Promise<MeetState> {
    try {
      const meet = await Meet.create(newMeet);

      return meet;
    } catch (error) {
      throw mongoDBErrorHandler("createMeet", error);
    }
  }

  // 모집글 목록 조회
  async getMeetList(opts?: MeetListOpts): Promise<MeetResponseDto[]> {
    try {
      return await aggregateGetMeetList(opts);
    } catch (error) {
      throw mongoDBErrorHandler("getMeetList", error);
    }
  }

  // 모집글 조회
  async getMeetById(meetId: Types.ObjectId): Promise<MeetResponseDto | null> {
    try {
      return await aggregateGetMeetById(meetId);
    } catch (error) {
      throw mongoDBErrorHandler("getMeetById", error);
    }
  }

  // 모집글 조회 doc
  async getMeetAsDoc(
    meetId: Types.ObjectId,
    session?: ClientSession
  ): Promise<MeetState | null> {
    try {
      return await Meet.findById({ _id: meetId }, { lean: true, session });
    } catch (error) {
      throw mongoDBErrorHandler("getMeetAsDoc", error);
    }
  }

  // 모집글 삭제
  async deleteMeetById(
    meetId: Types.ObjectId,
    session?: ClientSession
  ): Promise<DeleteResult> {
    try {
      return await Meet.deleteOne({ _id: meetId }, { session });
    } catch (error) {
      throw mongoDBErrorHandler("deleteMeetById", error);
    }
  }

  // 모집글 수정
  async updateMeetById(
    meetId: Types.ObjectId,
    meetUpdate: MeetUpdateDto,
    session?: ClientSession
  ): Promise<UpdateResult> {
    try {
      return await Meet.updateOne(
        { _id: meetId },
        { $set: meetUpdate },
        {
          session,
        }
      );
    } catch (error) {
      throw mongoDBErrorHandler("updateMeetById", error);
    }
  }

  // 모집글에 댓글 추가
  async addCommentToMeet(
    meetId: Types.ObjectId,
    commentId: Types.ObjectId,
    session?: ClientSession
  ): Promise<UpdateResult> {
    try {
      return await Meet.updateOne(
        { _id: meetId },
        { $addToSet: { comments: commentId } }, // 중복 방지
        { session }
      );
    } catch (error) {
      throw mongoDBErrorHandler("addCommentToMeet", error);
    }
  }
}

export default new MeetRepository();
