import { MeetCreateRequestDto } from "../dtos";
import { InternalServerError } from "../errors";
import { meetRepository } from "../repositories";

class MeetService {
  // 모집글 생성
  async createMeet(newMeet: MeetCreateRequestDto) {
    try {
      const meet = await meetRepository.createMeet(newMeet);

      if (!meet) {
        throw new InternalServerError("모집글 생성 실패");
      }

      return meet;
    } catch (error) {
      throw error;
    }
  }
}

export default new MeetService();
