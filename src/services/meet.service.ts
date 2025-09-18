import { MeetCreateRequestDto, MeetListOpts, MeetResponseDto } from "../dtos";
import { InternalServerError } from "../errors";
import { meetRepository } from "../repositories";
import userService from "./user.service";

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
}

export default new MeetService();
