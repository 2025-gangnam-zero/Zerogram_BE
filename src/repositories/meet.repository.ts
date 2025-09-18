import { MeetCreateRequestDto } from "../dtos";
import { Meet } from "../models";
import { mongoDBErrorHandler } from "../utils";

class MeetRepository {
  // 모집글 생성
  async createMeet(newMeet: MeetCreateRequestDto) {
    try {
      const meet = await Meet.create(newMeet);

      return meet;
    } catch (error) {
      throw mongoDBErrorHandler("createMeet", error);
    }
  }
}

export default new MeetRepository();
