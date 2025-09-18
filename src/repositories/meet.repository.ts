import { MeetState } from "types";
import { MeetCreateRequestDto, MeetListOpts, MeetResponseDto } from "../dtos";
import { Meet } from "../models";
import { aggregateGetMeetList, mongoDBErrorHandler } from "../utils";

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
}

export default new MeetRepository();
