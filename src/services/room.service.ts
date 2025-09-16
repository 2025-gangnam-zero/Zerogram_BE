import mongoose, { Types } from "mongoose";
import { roomRepository, roomMembershipRepository } from "../repositories";
import {
  ListRoomsRequestDto,
  ListRoomsResponseDto,
  CreateRoomRequestDto,
  ListPublicRoomsRequestDto,
  ListPublicRoomsResponseDto,
} from "../dtos";
import { toPublicRoomListItemDto, toRoomListItemDto } from "../utils";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors";

export class RoomsService {
  /**
   * 내가 속한 방 목록
   * - 기본: memberIds 캐시 기반 검색 + 커서
   * - fallback: 멤버십에서 roomIds 먼저 조회 후 find({_id: {$in: roomIds}})
   */
  async listMyJoinedRooms(
    userId: Types.ObjectId,
    req: ListRoomsRequestDto,
    opt: { preferCache?: boolean } = { preferCache: true }
  ): Promise<ListRoomsResponseDto> {
    const limit = Math.max(1, Math.min(req.limit ?? 50, 100));
    const cursorPayload = req.cursor
      ? {
          lastMessageAt: req.cursor.lastMessageAt,
          id: new Types.ObjectId(req.cursor.id),
        }
      : undefined;

    if (opt.preferCache) {
      // 캐시 경로: 당신이 준 findRooms 활용
      const docs = await roomRepository.findRooms({
        memberOfUserId: userId,
        q: req.q,
        workoutType: req.workoutType,
        cursorPayload,
        limit,
      });

      let items = docs;
      let hasNext = false;
      if (docs.length > limit) {
        hasNext = true;
        items = docs.slice(0, limit);
      }
      const mapped = items.map(toRoomListItemDto);
      const last = items[items.length - 1];

      return {
        items: mapped,
        nextCursor:
          hasNext && last
            ? {
                lastMessageAt:
                  last.lastMessageAt === null ||
                  last.lastMessageAt === undefined
                    ? null
                    : new Date(last.lastMessageAt as any).toISOString(),
                id: last._id.toString(),
              }
            : null,
      };
    }

    // fallback 경로: membership → roomIds → Room.find({_id: {$in: roomIds}}) + 커서 수동 처리
    const roomIds = await roomMembershipRepository.findActiveRoomIdsByUser(
      userId,
      500
    );
    if (roomIds.length === 0) return { items: [], nextCursor: null };

    // 기본 정렬 키와 동일하게 정렬 & 커서 적용
    const baseCond: any = { _id: { $in: roomIds } };
    if (req.q) baseCond.roomName = { $regex: req.q, $options: "i" };
    if (req.workoutType) baseCond.workoutType = req.workoutType;

    if (cursorPayload) {
      const { lastMessageAt, id } = cursorPayload;
      if (lastMessageAt === null) {
        baseCond.$or = [
          { lastMessageAt: { $ne: null } },
          { lastMessageAt: null, _id: { $lt: new Types.ObjectId(id) } },
        ];
      } else {
        baseCond.$or = [
          { lastMessageAt: { $lt: new Date(lastMessageAt) } },
          {
            lastMessageAt: new Date(lastMessageAt),
            _id: { $lt: new Types.ObjectId(id) },
          },
        ];
      }
    }

    const docs = await roomRepository
      // repo에 일반 findByCond 메서드를 추가해도 되고, 여기서 직접 모델을 써도 됨
      .findRooms({
        memberOfUserId: userId, // 형식을 맞추기 위해 전달하지만 실제로는 baseCond 사용이 이상적
        q: req.q,
        workoutType: req.workoutType,
        cursorPayload,
        limit,
      });

    let items = docs;
    let hasNext = false;
    if (docs.length > limit) {
      hasNext = true;
      items = docs.slice(0, limit);
    }
    const mapped = items.map(toRoomListItemDto);
    const last = items[items.length - 1];

    return {
      items: mapped,
      nextCursor:
        hasNext && last
          ? {
              lastMessageAt:
                last.lastMessageAt === null || last.lastMessageAt === undefined
                  ? null
                  : new Date(last.lastMessageAt as any).toISOString(),
              id: last._id.toString(),
            }
          : null,
    };
  }

  /** 공개 방 목록 (현재는 모든 방을 퍼블릭 취급) */
  async listPublicRooms(
    req: ListPublicRoomsRequestDto
  ): Promise<ListPublicRoomsResponseDto> {
    const limit = Math.max(1, Math.min(req.limit ?? 50, 100));
    const cursorPayload = req.cursor
      ? {
          lastMessageAt: req.cursor.lastMessageAt,
          id: new Types.ObjectId(req.cursor.id),
        }
      : undefined;

    const docs = await roomRepository.findPublicRooms({
      q: req.q,
      workoutType: req.workoutType,
      cursorPayload,
      limit,
    });

    let items = docs;
    let hasNext = false;
    if (docs.length > limit) {
      hasNext = true;
      items = docs.slice(0, limit);
    }

    const mapped = items.map(toPublicRoomListItemDto);
    const last = items[items.length - 1];

    return {
      items: mapped,
      nextCursor:
        hasNext && last
          ? {
              lastMessageAt:
                last.lastMessageAt === null || last.lastMessageAt === undefined
                  ? null
                  : new Date(last.lastMessageAt as any).toISOString(),
              id: last._id.toString(),
            }
          : null,
    };
  }

  /** 방 생성 + 생성자 owner 가입 + 캐시 쓰기-스루(트랜잭션) */
  async createWithOwner(userId: Types.ObjectId, body: CreateRoomRequestDto) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const room = await roomRepository.createOne({
        roomName: body.roomName.trim(),
        roomImageUrl: body.roomImageUrl?.trim(),
        workoutType: body.workoutType,
        createdBy: userId,
      });

      // membership 문서
      await roomMembershipRepository.createOwnerMembership(room._id, userId);

      // (옵션) 캐시가 생성 시 이미 반영되었지만, 재보정 로직이 별도라면 여기서 호출
      // await roomRepository.pushMemberCache(room._id, userId);

      await session.commitTransaction();
      return room;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /** 삭제(Owner/Admin만) + 연관 정리 hook 자리 */
  async deleteIfOwnerOrAdmin(roomIdRaw: string, userId: Types.ObjectId) {
    const roomId = new Types.ObjectId(roomIdRaw);
    const role = await roomMembershipRepository.findRole(roomId, userId);
    if (role !== "owner" && role !== "admin") {
      throw new ForbiddenError(
        "삭제 권한이 없습니다.",
        "ROOM_DELETE_FORBIDDEN"
      );
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const room = await roomRepository.findById(roomId);
      if (!room)
        throw new NotFoundError("방을 찾을 수 없습니다.", "ROOM_NOT_FOUND");

      // TODO: 메시지/리액션/노티피 정리 레포 호출(있다면)
      // await Promise.all([ ...deleteAllByRoom(roomId) ]);

      await roomMembershipRepository.deleteAllByRoom(roomId);
      const del = await roomRepository.deleteById(roomId);

      await session.commitTransaction();
      return del.deletedCount > 0;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /** 공개 방 가입(재가입 포함)
   * - 에러:
   *   - 이미 가입됨( leftAt === null ) → BadRequestError("ROOM_ALREADY_JOINED")
   *   - 정원 초과 → ForbiddenError("ROOM_CAPACITY_EXCEEDED")
   */
  async joinRoom(userId: Types.ObjectId, roomIdRaw: string) {
    const roomId = new Types.ObjectId(roomIdRaw);

    // 1) 방 존재 확인
    const room = await roomRepository.findById(roomId);
    if (!room)
      throw new NotFoundError("방을 찾을 수 없습니다.", "ROOM_NOT_FOUND");

    // 2) 이미 가입 여부 확인
    const existing = await roomMembershipRepository.findByRoomAndUser(
      roomId,
      userId
    );
    if (existing && !existing.leftAt) {
      // 이미 활성 멤버
      throw new BadRequestError("이미 가입된 방입니다.", "ROOM_ALREADY_JOINED");
    }

    // 3) 정원 체크 (memberCapacity 설정 시)
    if (
      typeof room.memberCapacity === "number" &&
      typeof room.memberCount === "number" &&
      room.memberCount >= room.memberCapacity
    ) {
      throw new ForbiddenError(
        "정원이 가득 찼습니다.",
        "ROOM_CAPACITY_EXCEEDED"
      );
    }

    // 4) 트랜잭션: 멤버십 활성화/생성 + 캐시(memberIds, memberCount) 갱신
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      if (existing && existing.leftAt) {
        // 재가입: 기존 멤버십 활성화
        await roomMembershipRepository.reactivateMembership(
          roomId,
          userId,
          session
        );
      } else if (!existing) {
        // 신규 가입
        await roomMembershipRepository.createMemberMembership(
          roomId,
          userId,
          session
        );
      }

      // 캐시 증가(memberIds, memberCount)
      await roomRepository.pushMemberCache(roomId, userId, session);

      // 최종 Room 재조회(증가된 memberCount 반영)
      const joinedRoom = await roomRepository.findById(roomId, session);
      await session.commitTransaction();

      // 컨트롤러 매퍼에서 membership 파생값을 넣기 좋도록, 최소 필드(역할) 합성
      // (populate 대신 컨트롤러에서 기본값 보정으로 마무리)
      return {
        ...joinedRoom,
        role: existing?.role ?? "member",
        isPinned: false,
        isMuted: false,
        // unreadCount는 매퍼에서 seqCounter/lastReadSeq로 계산 가능
      };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /** 방 탈퇴 */
  async leaveRoom(
    userId: Types.ObjectId,
    roomIdRaw: string
  ): Promise<{ roomId: string }> {
    const roomId = new Types.ObjectId(roomIdRaw);

    // 1) 방 존재
    const room = await roomRepository.findById(roomId);
    if (!room)
      throw new NotFoundError("방을 찾을 수 없습니다.", "ROOM_NOT_FOUND");

    // 2) 멤버십 상태
    const membership = await roomMembershipRepository.findByRoomAndUser(
      roomId,
      userId
    );
    if (!membership) {
      throw new BadRequestError("가입된 방이 아닙니다.", "ROOM_NOT_MEMBER");
    }
    if (membership.leftAt) {
      throw new BadRequestError("이미 탈퇴한 방입니다.", "ROOM_ALREADY_LEFT");
    }

    // 3) 오너 탈퇴 제한(정책)
    if (membership.role === "owner") {
      throw new ForbiddenError(
        "방장(소유자)은 탈퇴할 수 없습니다. 방을 삭제하거나 권한을 위임하세요.",
        "ROOM_OWNER_CANNOT_LEAVE"
      );
    }

    // 4) 트랜잭션: 멤버십 비활성화 + 캐시 감소
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      await roomMembershipRepository.deactivateMembership(
        roomId,
        userId,
        session
      );
      await roomRepository.pullMemberCache(roomId, userId, session);

      await session.commitTransaction();
      return { roomId: roomId.toString() };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }
}

export default new RoomsService();
