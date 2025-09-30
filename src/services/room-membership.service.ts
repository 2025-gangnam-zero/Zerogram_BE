// services/room-membership.service.ts
import mongoose, { Types } from "mongoose";
import {
  roomMembershipRepository,
  roomRepository,
  messageRepository,
} from "../repositories";
import { ForbiddenError, NotFoundError } from "../errors";
import { RoomMembershipState } from "../types";
import meetService from "./meet.service";
import { RoomMembership } from "../models";

class RoomMembershipService {
  // 멤버십 단건 조회
  async getMembership(
    roomId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<RoomMembershipState | null> {
    try {
      return await roomMembershipRepository.findOne(roomId, userId, undefined);
    } catch (error) {
      throw error;
    }
  }

  // 멤버 목록 (페이지네이션)
  async listMembers(
    roomId: Types.ObjectId,
    opts: { limit?: number; cursor?: string | null } = {}
  ) {
    try {
      return await roomMembershipRepository.findMembers(
        roomId,
        opts,
        undefined
      );
    } catch (error) {
      throw error;
    }
  }

  // 읽음 커밋: messageId → seq 변환 or 직접 seq, max 업데이트
  async commitRead(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    payload: { lastReadMessageId?: Types.ObjectId; lastReadSeq?: number }
  ): Promise<{ ok: true; unreadCount: number }> {
    try {
      const mem = await roomMembershipRepository.findOne(
        roomId,
        userId,
        undefined
      );
      if (!mem) throw new ForbiddenError("채팅방 멤버가 아닙니다.");

      let targetSeq = payload.lastReadSeq;
      if (typeof targetSeq !== "number" && payload.lastReadMessageId) {
        const seq = await messageRepository.getSeqById(
          roomId,
          payload.lastReadMessageId,
          undefined
        );
        if (typeof seq === "number") targetSeq = seq;
      }
      if (typeof targetSeq !== "number") targetSeq = mem.lastReadSeq;

      await roomMembershipRepository.updateLastReadSeq(
        roomId,
        userId,
        targetSeq,
        undefined
      );

      // 증가 없이 현재 seqCounter 조회(inc 금지)
      const room = await roomRepository.findById(roomId, undefined);
      if (!room) throw new NotFoundError("채팅방을 찾을 수 없습니다.");

      const unread = Math.max((room.seqCounter ?? 0) - targetSeq, 0);
      return { ok: true, unreadCount: unread };
    } catch (error) {
      throw error;
    }
  }

  // 현재 미읽음 수 계산
  async getUnreadCount(roomId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const mem = await roomMembershipRepository.findOne(
        roomId,
        userId,
        undefined
      );
      if (!mem) return { unreadCount: 0 };

      const room = await roomRepository.findById(roomId, undefined);
      if (!room) throw new NotFoundError("채팅방을 찾을 수 없습니다.");

      const unread = Math.max((room.seqCounter ?? 0) - mem.lastReadSeq, 0);
      return { unreadCount: unread };
    } catch (error) {
      throw error;
    }
  }

  // 방 나가기
  // 방 나가기: RoomMembership 제거 + (연결된 모집글이 있으면) crews에서도 제거
  async leaveRoom(
    roomId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<void> {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // 1) 방 확인
        const room = await roomRepository.findById(roomId, session);
        if (!room) throw new NotFoundError("채팅방을 찾을 수 없습니다.");

        // 2) RoomMembership 제거 (멱등)
        await roomMembershipRepository.deleteMember(roomId, userId, session);

        // 3) 방이 meet와 1:1이면 crews에서도 제거
        const meetId = (room as any).meetId as Types.ObjectId | undefined;
        if (meetId) {
          // 작성자는 본인 모집글에서 나갈 수 없음(기존 규칙 유지)
          const meet = await meetService.getMeetById(meetId, session);
          if (!meet)
            throw new NotFoundError("연결된 모집글을 찾을 수 없습니다.");
          if (meet.userId?.equals?.(userId)) {
            throw new ForbiddenError("작성자는 방을 나갈 수 없습니다.");
          }

          await meetService.removeFromCrews(meetId, userId, session);
        }

        const count = await roomMembershipRepository.countByRoom(
          roomId,
          session
        );

        await roomRepository.updateById(
          roomId,
          { memberCount: count },
          session
        );
      });
    } finally {
      await session.endSession();
    }
  }

  // (선택) 멤버 추가/초대
  async addMember(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    role: "owner" | "admin" | "member" = "member"
  ): Promise<void> {
    try {
      await roomMembershipRepository.upsertMember(
        roomId,
        userId,
        { role },
        undefined
      );
    } catch (error) {
      throw error;
    }
  }

  async isMember(roomId: Types.ObjectId, userId: Types.ObjectId) {
    const doc = await RoomMembership.findOne({ roomId, userId })
      .select({ _id: 1 })
      .lean()
      .exec();
    return !!doc;
  }
}

export default new RoomMembershipService();
