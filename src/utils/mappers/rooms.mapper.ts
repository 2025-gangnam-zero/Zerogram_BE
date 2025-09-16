// src/mappers/room.mapper.ts
import { RoomListItemDto, PublicRoomListItemDto } from "../../dtos"; 
// ↑ 서버용 DTO들을 import (내 방용 / 공개 방용)

type AnyRoomDoc = any; // 필요하면 명시 타입으로 교체 (LeanDoc<Room & {...}> 등)

// 공통(Room) 필드 매핑
export const toRoomBaseDto = (r: AnyRoomDoc) => ({
  id: r._id?.toString?.() ?? r.id,
  roomName: r.roomName,
  roomImageUrl: r.roomImageUrl ?? undefined,
  roomDescription: r.roomDescription ?? undefined,
  workoutType: r.workoutType ?? undefined,
  memberCapacity:
    typeof r.memberCapacity === "number" ? r.memberCapacity : undefined,
  memberCount: typeof r.memberCount === "number" ? r.memberCount : undefined,

  lastMessage: r.lastMessage ?? undefined,
  lastMessageAt: r.lastMessageAt
    ? new Date(r.lastMessageAt).toISOString()
    : undefined,
  createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
});

// 내 방 목록용 (membership/파생 필드 포함)
export const toRoomListItemDto = (r: AnyRoomDoc): RoomListItemDto => {
  const base = toRoomBaseDto(r);
  return {
    ...base,
    // RoomMembership 기반 (집계 결과에 join/projection 되어 있다고 가정)
    isPinned: r.isPinned ?? undefined,
    isMuted: r.isMuted ?? undefined,
    role: r.role ?? undefined,
    nicknameInRoom: r.nicknameInRoom ?? undefined,
    lastReadSeq: typeof r.lastReadSeq === "number" ? r.lastReadSeq : undefined,

    // 파생값 (서버에서 계산했으면 그대로 사용, 아니면 여기서 fallback)
    unreadCount:
      typeof r.unreadCount === "number"
        ? r.unreadCount
        : typeof r.seqCounter === "number" && typeof r.lastReadSeq === "number"
        ? Math.max(0, r.seqCounter - r.lastReadSeq)
        : 0,
  };
};

// 공개 방 목록용 (membership/파생 필드 제외)
export const toPublicRoomListItemDto = (
  r: AnyRoomDoc
): PublicRoomListItemDto => {
  const base = toRoomBaseDto(r);
  return {
    ...base,
    // 공개 목록엔 membership/파생 필드 넣지 않음
  };
};
