import { roomMembershipRepository, roomRepository } from "../repositories";
import { RoomsListQuery, RoomsListResult } from "../types";
import { decodeCursor, encodeCursor } from "../utils";

class RoomService {
  async listRooms(query: RoomsListQuery): Promise<RoomsListResult> {
    const { userId, limit, q, workoutType, cursor } = query;

    // 1) 내 membership 조회
    const memberships = await roomMembershipRepository.findMembershipsByUser(
      userId
    );

    const lastReadMap = new Map<string, number>(
      memberships.map((m: any) => [String(m.roomId), m.lastReadSeq ?? 0])
    );
    const pinnedSet = new Set<string>(
      memberships
        .filter((m: any) => m.isPinned)
        .map((m: any) => String(m.roomId))
    );

    // 2) 커서 파라미터 디코딩
    const cursorPayload = cursor ? decodeCursor(cursor) : undefined;

    // 3) 방 조회
    const rooms = await roomRepository.findRooms({
      memberOfUserId: userId,
      q,
      workoutType,
      cursorPayload,
      limit,
    });

    // 4) 응답 변환(+ unreadCount)
    const slice = rooms.slice(0, limit);

    const items = slice.map((r: any) => {
      const rid = String(r._id);
      const lastReadSeq = lastReadMap.get(rid) ?? 0;
      const lastSeq = r.lastMessageSeq ?? 0;
      const unreadCount = Math.max(0, lastSeq - lastReadSeq);

      return {
        id: rid,
        roomName: r.roomName,
        roomImageUrl: r.roomImageUrl ?? null,
        roomDescription: r.roomDescription ?? null,
        memberCount: r.memberCount ?? 0,
        memberCapacity: r.memberCapacity,
        workoutType: r.workoutType,
        isPinned: pinnedSet.has(rid),
        lastMessage: r.lastMessage ?? null,
        lastMessageAt: r.lastMessageAt ? r.lastMessageAt.toISOString() : null,
        unreadCount,
      };
    });

    // 5) nextCursor
    let nextCursor: string | undefined;
    if (rooms.length > slice.length && slice.length > 0) {
      const last = slice[slice.length - 1];
      nextCursor = encodeCursor({
        lastMessageAt: last.lastMessageAt
          ? last.lastMessageAt.toISOString()
          : null,
        id: last._id,
      });
    }

    return { items, nextCursor };
  }
}

export default new RoomService();
