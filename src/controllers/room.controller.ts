import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { BadRequestError } from "../errors";
import {
  messageService,
  roomMembershipService,
  roomService,
} from "../services";
import { getIo } from "../socket/io";
import { socketRooms } from "../socket/socketRooms";

// 내 방 목록
export const getMyRooms = async (req: Request, res: Response) => {
  const { limit, cursor, q } = req.query;

  const nLimit = Number(limit ?? 20);
  if (!Number.isInteger(nLimit) || nLimit <= 0 || nLimit > 100) {
    throw new BadRequestError("limit은 1~100 사이의 정수여야 합니다.");
  }

  try {
    const { items, nextCursor } = await roomService.getMineRooms(req.user._id, {
      limit: nLimit,
      cursor: typeof cursor === "string" ? cursor : null,
      q: typeof q === "string" ? q.trim() : undefined,
    });

    res.status(200).json({
      success: true,
      message: "내 방 목록 조회 성공",
      code: "GET_MY_ROOMS_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: { items, nextCursor },
    });
  } catch (error) {
    throw error;
  }
};

// 방 상세
export const getRoom = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { roomid } = req.params;
  if (!roomid) throw new BadRequestError("roomid 필수");

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    const room = await roomService.getRoom(roomId, userId);

    res.status(200).json({
      success: true,
      message: "방 상세 조회 성공",
      code: "GET_ROOM_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: { room },
    });
  } catch (error) {
    throw error;
  }
};

// 공지 조회
export const getRoomNotice = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { roomid } = req.params;
  if (!roomid) throw new BadRequestError("roomid 필수");

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    const room = await roomService.getRoom(roomId, userId);
    res.status(200).json({
      success: true,
      message: "공지 조회 성공",
      code: "GET_ROOM_NOTICE_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: { notice: room.notice ?? null },
    });
  } catch (error) {
    throw error;
  }
};

// 공지 수정 (owner/admin)
export const updateRoomNotice = async (req: Request, res: Response) => {
  const { roomid } = req.params;
  const { text, enabled } = req.body as { text?: string; enabled?: boolean };
  if (!roomid) throw new BadRequestError("roomid 필수");

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    await roomService.updateNotice(roomId, req.user._id as Types.ObjectId, {
      ...(typeof text !== "undefined" ? { text } : {}),
      ...(typeof enabled !== "undefined" ? { enabled } : {}),
    });

    res.status(200).json({
      success: true,
      message: "공지 수정 성공",
      code: "UPDATE_ROOM_NOTICE_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: { ok: true },
    });
  } catch (error) {
    throw error;
  }
};

// 공지 삭제
export const deleteRoomNotice = async (req: Request, res: Response) => {
  const { roomid } = req.params;
  const user = req.user;
  if (!roomid) throw new BadRequestError("roomid 필수");

  const notice = await roomService.clearNotice(
    new Types.ObjectId(roomid),
    new Types.ObjectId(user._id)
  );

  res.status(200).json({
    success: true,
    message: "공지 삭제 성공",
    code: "ROOM_NOTICE_DELETE_SUCCEEDED",
    timestamp: new Date().toISOString(),
    data: notice, // { enabled:false, ... } 최신 상태 반환
  });
};

// 방 나가기
export const leaveRoom = async (req: Request, res: Response) => {
  const { roomid } = req.params;
  if (!roomid) throw new BadRequestError("roomid 필수");

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    await roomMembershipService.leaveRoom(
      roomId,
      req.user._id as Types.ObjectId
    );

    res.status(200).json({
      success: true,
      message: "방 나가기 성공",
      code: "LEAVE_ROOM_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: { ok: true },
    });
  } catch (error) {
    throw error;
  }
};

// 멤버 목록
export const listRoomMembers = async (req: Request, res: Response) => {
  const { roomid } = req.params;
  const { limit, cursor } = req.query;
  if (!roomid) throw new BadRequestError("roomid 필수");

  const nLimit = Number(limit ?? 50);
  if (!Number.isInteger(nLimit) || nLimit <= 0 || nLimit > 200) {
    throw new BadRequestError("limit은 1~200 사이의 정수여야 합니다.");
  }

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    const { items, nextCursor } = await roomMembershipService.listMembers(
      roomId,
      {
        limit: nLimit,
        cursor: typeof cursor === "string" ? cursor : null,
      }
    );

    res.status(200).json({
      success: true,
      message: "멤버 목록 조회 성공",
      code: "LIST_ROOM_MEMBERS_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: { items, nextCursor },
    });
  } catch (error) {
    throw error;
  }
};

// 읽음 커밋
export const commitRead = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { roomid } = req.params;
  const { lastReadMessageId, lastReadSeq } = req.body as {
    lastReadMessageId?: string;
    lastReadSeq?: number;
  };
  if (!roomid) throw new BadRequestError("roomid 필수");

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    const payload: {
      lastReadMessageId?: Types.ObjectId;
      lastReadSeq?: number;
    } = {};

    if (typeof lastReadSeq === "number") payload.lastReadSeq = lastReadSeq;
    if (typeof lastReadMessageId === "string" && lastReadMessageId.trim()) {
      payload.lastReadMessageId = new mongoose.Types.ObjectId(
        lastReadMessageId
      );
    }

    const result = await roomMembershipService.commitRead(
      roomId,
      req.user._id as Types.ObjectId,
      payload
    );

    // ✅ 본인에게 즉시 unread:0 반영 (UX 동기화)
    try {
      const room = await roomService.getRoom(roomId, userId);
      if (room) {
        const io = getIo();
        io.of("/chat")
          .to(socketRooms.user(String(req.user._id)))
          .emit("notify:update", {
            roomId: String(room.id),
            roomName: room.roomName,
            lastMessage: room.lastMessage,
            lastMessageAt: room.lastMessageAt
              ? new Date(room.lastMessageAt).toISOString()
              : undefined,
            unread: 0,
          });
      }
    } catch (e) {
      console.error("[notify] push self zero error:", e);
    }

    res.status(200).json({
      success: true,
      message: "읽음 커밋 성공",
      code: "COMMIT_READ_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    throw error;
  }
};

// 미읽음 카운트
export const getUnreadCount = async (req: Request, res: Response) => {
  const { roomid } = req.params;
  if (!roomid) throw new BadRequestError("roomid 필수");

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    const result = await roomMembershipService.getUnreadCount(
      roomId,
      req.user._id as Types.ObjectId
    );

    res.status(200).json({
      success: true,
      message: "미읽음 수 조회 성공",
      code: "GET_UNREAD_COUNT_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    throw error;
  }
};

// 메시지 히스토리
export const getMessages = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { roomid } = req.params;
  const { beforeId, beforeSeq, limit } = req.query;

  if (!roomid) throw new BadRequestError("roomid 필수");
  const nLimit = Number(limit ?? 30);
  if (!Number.isInteger(nLimit) || nLimit <= 0 || nLimit > 100) {
    throw new BadRequestError("limit은 1~100 사이의 정수여야 합니다.");
  }

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    const items = await messageService.getHistory(roomId, userId, {
      beforeSeq: typeof beforeSeq === "string" ? Number(beforeSeq) : undefined,
      beforeId:
        typeof beforeId === "string" && beforeId.trim()
          ? new mongoose.Types.ObjectId(beforeId)
          : undefined,
      limit: nLimit,
    });

    res.status(200).json({
      success: true,
      message: "메시지 목록 조회 성공",
      code: "GET_MESSAGES_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: items, // { items: ChatMessageDTO[] }
    });
  } catch (error) {
    throw error;
  }
};

// 메시지 삭제
export const deleteMessage = async (req: Request, res: Response) => {
  const { roomid, messageid } = req.params;
  if (!roomid) throw new BadRequestError("roomid 필수");
  if (!messageid) throw new BadRequestError("messageid 필수");

  try {
    const roomId = new mongoose.Types.ObjectId(roomid);
    const messageId = new mongoose.Types.ObjectId(messageid);

    await messageService.deleteMessage(
      roomId,
      messageId,
      req.user._id as Types.ObjectId
    );

    res.status(200).json({
      success: true,
      message: "메시지 삭제 성공",
      code: "DELETE_MESSAGE_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: { ok: true },
    });
  } catch (error) {
    throw error;
  }
};
