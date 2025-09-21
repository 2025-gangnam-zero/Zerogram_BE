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
  async createMeet(
    newMeet: MeetCreateRequestDto,
    session?: ClientSession
  ): Promise<MeetState> {
    try {
      // A안) save + toObject
      const created = await new Meet(newMeet).save({ session });
      return created.toObject(); // ✅ 항상 Plain 반환

      // B안) create([doc], { session }) 사용 (트랜잭션 친화)
      // const [created] = await Meet.create([newMeet], { session });
      // return created.toObject();
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
  async getMeetById(
    meetId: Types.ObjectId,
    session?: ClientSession
  ): Promise<MeetResponseDto | null> {
    try {
      return await aggregateGetMeetById(meetId, session);
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
      return await Meet.findById({ _id: meetId }, undefined, {
        session,
      }).lean();
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

  // 모집글에 참여자 추가
  async addToCrews(
    meetId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<UpdateResult> {
    try {
      return await Meet.updateOne(
        { _id: meetId },
        { $addToSet: { crews: userId } }, // 중복 방지
        { session }
      );
    } catch (error) {
      throw mongoDBErrorHandler("addToCrews", error);
    }
  }

  // 모집글에 참여자 삭제
  async removeFromCrews(
    meetId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<UpdateResult> {
    try {
      return await Meet.updateOne(
        { _id: meetId },
        { $pull: { crews: userId } },
        { session }
      );
    } catch (error) {
      throw mongoDBErrorHandler("removeFromCrews", error);
    }
  }
}

export default new MeetRepository();
