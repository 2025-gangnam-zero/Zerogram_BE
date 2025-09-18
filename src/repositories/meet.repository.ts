import { MeetState } from "types";
import { MeetCreateRequestDto, MeetListOpts, MeetResponseDto } from "../dtos";
import { Meet } from "../models";
import { aggregateGetMeetList, mongoDBErrorHandler } from "../utils";
import { ClientSession, DeleteResult, Types } from "mongoose";

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
}

export default new MeetRepository();
