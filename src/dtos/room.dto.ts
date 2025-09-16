export type CursorPayload = {
  lastMessageAt: string | null; // 정렬 기준: Room.lastMessageAt
  id: string; // Room._id
};

// 요청
export type ListRoomsRequestDto = {
  q?: string; // Room.roomName / Room.roomDescription 검색
  workoutType?: "running" | "fitness";
  cursor?: CursorPayload;
  limit?: number; // default 50
  includeLeft?: boolean; // 내 방 목록일 때만 의미
};

// 응답 아이템 (내 방 전용)
export type RoomListItemDto = {
  id: string; // Room._id
  roomName: string;
  roomImageUrl?: string | null;
  roomDescription?: string | null;
  workoutType?: "running" | "fitness";
  memberCapacity?: number;
  memberCount?: number;

  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string;

  // RoomMembership 기반 (내 방 전용)
  isPinned?: boolean;
  isMuted?: boolean;
  role?: "owner" | "admin" | "member";
  nicknameInRoom?: string | null;
  lastReadSeq?: number;

  // 파생
  unreadCount?: number;
};

// 응답
export type ListRoomsResponseDto = {
  items: RoomListItemDto[];
  nextCursor?: CursorPayload | null;
};

// 요청
export type ListPublicRoomsRequestDto = {
  q?: string;
  workoutType?: "running" | "fitness";
  cursor?: CursorPayload;
  limit?: number; // default 50
};

// 응답 아이템 (membership 없음)
export type PublicRoomListItemDto = {
  id: string;
  roomName: string;
  roomImageUrl?: string | null;
  roomDescription?: string | null;
  workoutType?: "running" | "fitness";
  memberCapacity?: number;
  memberCount?: number;

  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string;
};

// 응답
export type ListPublicRoomsResponseDto = {
  items: PublicRoomListItemDto[];
  nextCursor?: CursorPayload | null;
};

export type CreateRoomRequestDto = {
  roomName: string;
  roomImageUrl?: string;
  roomDescription?: string;
  workoutType?: "running" | "fitness";
  memberCapacity?: number; // min 1
  // createdBy, memberIds, memberCount, seqCounter 등은 서버에서 설정
};

export type CreateRoomResponseDto = {
  room: RoomListItemDto;
};

export type DeleteRoomResponseDto = {
  roomId: string;
};

export type JoinRoomResponseDto = {
  room: RoomListItemDto;
};

export type LeaveRoomResponseDto = {
  roomId: string;
};
