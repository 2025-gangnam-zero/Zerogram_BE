// services/room.service.ts
import { Types } from "mongoose";
import { roomRepository, roomMembershipRepository } from "../repositories";
import { ForbiddenError, NotFoundError } from "../errors";

const toRoomDTO = (r: any) => ({
  id: String(r._id),
  meetId: String(r.meetId),
  roomName: r.roomName,
  imageUrl: r.imageUrl,
  description: r.description,
  memberCapacity: r.memberCapacity,
  lastMessage: r.lastMessage,
  lastMessageAt: r.lastMessageAt
    ? new Date(r.lastMessageAt).toISOString()
    : undefined,
  seqCounter: r.seqCounter,
  notice: r.notice
    ? {
        text: r.notice.text,
        enabled: r.notice.enabled,
        authorId: r.notice.authorId ? String(r.notice.authorId) : undefined,
        updatedAt: r.notice.updatedAt
          ? new Date(r.notice.updatedAt).toISOString()
          : undefined,
      }
    : undefined,
  createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
  updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
});

class RoomService {
  // 방 상세
  async getRoom(roomId: Types.ObjectId) {
    try {
      const room = await roomRepository.findById(roomId, undefined);
      if (!room) throw new NotFoundError("채팅방을 찾을 수 없습니다.");
      return toRoomDTO(room);
    } catch (error) {
      throw error;
    }
  }

  // 내 방 목록(사이드바)
  async getMineRooms(
    userId: Types.ObjectId,
    opts: { limit?: number; cursor?: string | null; q?: string } = {}
  ) {
    try {
      return await roomRepository.aggregateMineRooms(userId, opts, undefined);
    } catch (error) {
      throw error;
    }
  }

  // 공지 업데이트(내장 notice) - owner/admin 권한
  async updateNotice(
    roomId: Types.ObjectId,
    actorId: Types.ObjectId,
    input: { text?: string; enabled?: boolean }
  ): Promise<void> {
    try {
      const membership = await roomMembershipRepository.findOne(
        roomId,
        actorId,
        undefined
      );
      const isPrivileged =
        membership &&
        (membership.role === "owner" || membership.role === "admin");
      if (!isPrivileged) {
        throw new ForbiddenError("공지 수정 권한이 없습니다.");
      }

      await roomRepository.updateNotice(
        roomId,
        {
          ...(typeof input.text !== "undefined" ? { text: input.text } : {}),
          ...(typeof input.enabled !== "undefined"
            ? { enabled: input.enabled }
            : {}),
          authorId: actorId,
          updatedAt: new Date(),
        },
        undefined
      );
    } catch (error) {
      throw error;
    }
  }
}

export default new RoomService();
