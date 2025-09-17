import { Request, Response } from "express";
import {
  ListRoomsRequestDto,
  CreateRoomRequestDto,
  RoomListItemDto,
  ListPublicRoomsRequestDto,
  ListPublicRoomsResponseDto,
  JoinRoomResponseDto,
  LeaveRoomResponseDto,
} from "../dtos";
import { toPublicRoomListItemDto, toRoomListItemDto } from "../utils"; // ← 매퍼 경로가 mappers로 바뀌었으면 수정
import { BadRequestError } from "../errors";
import { roomService } from "../services";

const nowISO = () => new Date().toISOString();

/** GET /rooms : 내가 속한 방 + 검색/커서 */
export const listMyJoinedRooms = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const cursorId =
      typeof req.query.cursorId === "string" ? req.query.cursorId : undefined;

    const cursorLast =
      typeof req.query.cursorLastMessageAt === "string"
        ? req.query.cursorLastMessageAt
        : undefined;

    // ✅ limit 가드(옵션)
    const rawLimit = req.query.limit
      ? parseInt(String(req.query.limit), 10)
      : 50;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 100)
      : 50;

    const dto: ListRoomsRequestDto = {
      q:
        typeof req.query.q === "string" && req.query.q.trim()
          ? req.query.q.trim()
          : undefined,
      workoutType:
        req.query.workoutType === "running" ||
        req.query.workoutType === "fitness"
          ? (req.query.workoutType as "running" | "fitness")
          : undefined,
      cursor:
        cursorId && cursorLast !== undefined
          ? {
              id: cursorId,
              lastMessageAt: cursorLast === "null" ? null : cursorLast,
            }
          : undefined,
      limit,
      // ✅ includeLeft 파싱(옵션)
      includeLeft:
        typeof req.query.includeLeft === "string"
          ? req.query.includeLeft === "true"
          : undefined,
    };

    const data = await roomService.listMyJoinedRooms(userId, dto, {
      preferCache: true,
    });

    res.status(200).json({
      success: true,
      message: "채팅방 목록 조회 성공",
      code: "ROOM_LIST_SUCCEEDED",
      timestamp: nowISO(),
      data,
    });
  } catch (error) {
    throw error;
  }
};

/** GET /rooms/public : 공개 방 목록 (임시) */
export const listPublicRooms = async (req: Request, res: Response) => {
  const cursorId =
    typeof req.query.cursorId === "string" ? req.query.cursorId : undefined;

  const cursorLast =
    typeof req.query.cursorLastMessageAt === "string"
      ? req.query.cursorLastMessageAt
      : undefined;

  const rawLimit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 100)
    : 50;

  const dto: ListPublicRoomsRequestDto = {
    q:
      typeof req.query.q === "string" && req.query.q.trim()
        ? req.query.q.trim()
        : undefined,
    workoutType:
      req.query.workoutType === "running" || req.query.workoutType === "fitness"
        ? (req.query.workoutType as "running" | "fitness")
        : undefined,
    cursor:
      cursorId && cursorLast !== undefined
        ? {
            id: cursorId,
            lastMessageAt: cursorLast === "null" ? null : cursorLast,
          }
        : undefined,
    limit,
  };

  const { items, nextCursor } = await roomService.listPublicRooms(dto);

  res.status(200).json({
    success: true,
    message: "공개 방 목록 조회 성공",
    code: "PUBLIC_ROOM_LIST_SUCCEEDED",
    timestamp: nowISO(),
    data: {
      items: items.map(toPublicRoomListItemDto),
      nextCursor,
    } as ListPublicRoomsResponseDto,
  });
};

/** POST /rooms : 생성 + owner 가입 */
export const createRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const body = req.body as CreateRoomRequestDto;

    if (!body?.roomName || !String(body.roomName).trim()) {
      throw new BadRequestError("roomName 필수", "ROOM_NAME_REQUIRED");
    }

    const roomDoc = await roomService.createWithOwner(userId, {
      ...body,
      roomName: body.roomName.trim(),
    });

    // roomService가 멤버십 오버레이를 포함해 반환하면 그대로 매핑하면 됨.
    // 혹시 Room만 떨어진다면 최소한의 기본값(role/unreadCount) 보정(옵션).
    let item: RoomListItemDto = toRoomListItemDto(roomDoc);
    if (!item.role) item.role = "owner";
    if (typeof item.unreadCount !== "number") item.unreadCount = 0;

    res.status(201).json({
      success: true,
      message: "채팅방 생성 성공",
      code: "ROOM_CREATE_SUCCEEDED",
      timestamp: nowISO(),
      data: { room: item },
    });
  } catch (error) {
    throw error;
  }
};

/** DELETE /rooms/:roomId : owner/admin */
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { roomId } = req.params;
    if (!roomId) throw new BadRequestError("roomId 필수", "ROOM_ID_REQUIRED");

    await roomService.deleteIfOwnerOrAdmin(roomId, userId);

    res.status(200).json({
      success: true,
      message: "채팅방 삭제 성공",
      code: "ROOM_DELETE_SUCCEEDED",
      timestamp: nowISO(),
      data: { roomId },
    });
  } catch (error) {
    throw error;
  }
};

/** POST /rooms/:roomId/join : 공개 방 가입(재가입 포함) */
export const joinRoom = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { roomId } = req.params;
  if (!roomId) throw new BadRequestError("roomId 필수", "ROOM_ID_REQUIRED");

  const joined = await roomService.joinRoom(userId, roomId);

  // 서비스는 Room(+membership 합성값) 문서를 반환한다고 가정.
  // 매퍼로 직렬화 + 최소 기본값 보정
  const item = toRoomListItemDto(joined);
  if (!item.role) item.role = "member";
  if (typeof item.unreadCount !== "number") item.unreadCount = 0;

  const data: JoinRoomResponseDto = { room: item };

  res.status(200).json({
    success: true,
    message: "채팅방 가입 성공",
    code: "ROOM_JOIN_SUCCEEDED",
    timestamp: nowISO(),
    data,
  });
};

/** POST /rooms/:roomId/leave : 방 탈퇴 */
export const leaveRoom = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { roomId } = req.params;
  if (!roomId) throw new BadRequestError("roomId 필수", "ROOM_ID_REQUIRED");

  const result = await roomService.leaveRoom(userId, roomId);
  const data: LeaveRoomResponseDto = { roomId: result.roomId };

  res.status(200).json({
    success: true,
    message: "채팅방 탈퇴 성공",
    code: "ROOM_LEAVE_SUCCEEDED",
    timestamp: nowISO(),
    data,
  });
};
