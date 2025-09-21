import mongoose, { ClientSession, Types } from "mongoose";
import {
  MeetCreateRequestDto,
  MeetListOpts,
  MeetResponseDto,
  MeetUpdateDto,
  MeetUpdateRequestDto,
} from "../dtos";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../errors";
import {
  meetRepository,
  messageRepository,
  roomMembershipRepository,
  roomRepository,
} from "../repositories";
import { userService, commentService } from "../services";
import { MeetState } from "../types";
import { deleteImage, deleteImages, toArray } from "../utils";
import { IMAGE_MAX_COUNT } from "../constants";

class MeetService {
  // 모집글 생성
  async createMeet(newMeet: MeetCreateRequestDto): Promise<MeetResponseDto> {
    const session = await mongoose.startSession();
    try {
      console.log(newMeet);

      session.startTransaction();

      // 1) Meet 생성
      const meet = await meetRepository.createMeet(newMeet, session);
      if (!meet) throw new InternalServerError("모집글 생성 실패");

      console.log("모집글", meet);

      // 2) Room 생성 (Meet:Room = 1:1)
      const room = await roomRepository.createRoom(
        {
          meetId: meet._id,
          roomName: meet.title,
          imageUrl: (meet.images ?? [])[0],
          description: meet.description,
        },
        session
      );

      console.log("생성된 방 정보", room);
      if (!room) throw new InternalServerError("채팅방 생성 실패");

      // 3) 작성자 멤버십 owner 등록
      await roomMembershipRepository.upsertMember(
        room._id,
        meet.userId,
        { role: "owner" },
        session
      );

      // 4) 응답 구성 (기존 형식 유지)
      const { _id: userId, nickname } = await userService.getUserById(
        meet.userId,
        session
      );

      const result: MeetResponseDto = {
        ...meet,
        userId,
        nickname,
        crews: [{ userId, nickname }],
        comments: [],
      };

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 모집글 목록 조회
  async getMeetList(opts?: MeetListOpts): Promise<MeetResponseDto[]> {
    try {
      return await meetRepository.getMeetList(opts);
    } catch (error) {
      throw error;
    }
  }

  // 모집글 조회
  async getMeetById(
    meetId: Types.ObjectId,
    session?: ClientSession
  ): Promise<MeetResponseDto> {
    try {
      const meet = await meetRepository.getMeetById(meetId, session);
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
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<void> {
    try {
      const meet = await this.getMeetAsDoc(meetId, session);

      if (!userId.equals(meet.userId)) {
        throw new ForbiddenError("권한 없음");
      }
    } catch (error) {
      throw error;
    }
  }

  // 모집글 삭제
  async deleteMeetById(
    meetId: Types.ObjectId,
    session?: ClientSession
  ): Promise<void> {
    try {
      const result = await meetRepository.deleteMeetById(meetId, session);

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

  // 모집글 삭제 (권한검사 + 댓글 일괄 삭제 + 모집글 삭제) - 트랜잭션 적용
  async deleteMeetWithAuth(meetId: Types.ObjectId, userId: Types.ObjectId) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(
        async () => {
          // 1) 권한 확인
          await this.checkAuthorMatched(meetId, userId, session);

          // 2) Meet + 댓글 삭제(기존 로직)
          const meet = await this.getMeetAsDoc(meetId, session);

          const comments = meet.comments ?? [];
          if (comments.length > 0) {
            const commentIds: Types.ObjectId[] = comments
              .map((c: any) => (c instanceof Types.ObjectId ? c : c?._id))
              .filter(Boolean);
            if (commentIds.length > 0) {
              await commentService.deleteAllComments(commentIds, session);
            }
          }

          // 2-1) 이미지 제거(기존)
          if (meet.images && meet.images.length > 0) {
            await Promise.all(
              meet.images.map((ex) => deleteImage(ex.split(".com/")[1]))
            );
          }

          // 3) 연계 Room 정리
          const room = await roomRepository.findByMeetId(meetId, session);
          if (room) {
            await messageRepository.deleteAllByRoomId(room._id, session);
            await roomMembershipRepository.deleteAllByRoomId(room._id, session);

            const rr = await roomRepository.deleteById(room._id, session);
            if (!rr.acknowledged)
              throw new InternalServerError("채팅방 삭제 승인 실패");
          }

          // 4) 마지막으로 Meet 삭제
          await this.deleteMeetById(meetId, session);
        },
        { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } }
      );
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 모집글 수정
  async updateMeet(
    meetId: Types.ObjectId,
    meetUpdate: MeetUpdateDto,
    session?: ClientSession
  ): Promise<void> {
    try {
      const result = await meetRepository.updateMeetById(
        meetId,
        meetUpdate,
        session
      );

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
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 권한 확인
      await this.checkAuthorMatched(meetId, userId, session);

      const { existingImages, newImages, images, ...rest } = meetUpdate;

      // 남은 이미지들
      const remainedImages = toArray(images);

      // 삭제될 이미지들
      const deletedImages = toArray(existingImages);

      // 추가된 이미지들
      const addedImages = toArray(newImages);

      // 총 이미지 개수
      const totalImageNum = remainedImages.length + addedImages.length;

      // 총 이미지 개수가 제한 개수보다 큰 경우
      if (totalImageNum > IMAGE_MAX_COUNT) {
        // 추가된 이미지 삭제
        if (addedImages.length > 0) {
          await deleteImages(addedImages);
        }
        throw new BadRequestError("이미지 업로드 최대 개수 초과");
      }

      // 기존 이미지 삭제
      if (deletedImages.length > 0) {
        await deleteImages(deletedImages);
      }

      const filtered = (remainedImages ?? []).filter(
        (i) => !(deletedImages ?? []).includes(i)
      );
      const updatedImages = [...filtered, ...(addedImages ?? [])];

      // 모집글 수정
      await this.updateMeet(
        meetId,
        { ...rest, images: updatedImages },
        session
      );

      // room 메타 동기화
      await roomRepository.updateByMeetId(
        meetId,
        {
          ...(rest.title ? { roomName: rest.title } : {}),
          ...(updatedImages.length ? { imageUrl: updatedImages[0] } : {}),
        },
        session
      );

      await session.commitTransaction();
      // 수정된 모집글 조회
      return await this.getMeetById(meetId, session);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
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

      // 모집글 조회 (같은 세션)
      const meet = await this.getMeetAsDoc(meetId, session);

      // ObjectId 비교는 equals 사용 (undefined 대비도 추가)
      const crews: Types.ObjectId[] = (meet.crews ?? []) as any;
      const isMember = crews.some((id) => id.equals(userId));

      if (isMember) {
        if (meet.userId.equals(userId)) {
          throw new ForbiddenError("작성자의 참여 취소 불가");
        }

        await this.removeToCrews(meetId, userId, session);
      } else {
        await this.addToCrews(meetId, userId, session);
      }

      await session.commitTransaction();
      // 추가되었으면 true(신규), 삭제되었으면 false 반환
      return !isMember;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

export default new MeetService();
