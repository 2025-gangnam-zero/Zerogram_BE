import { ClientSession, Types } from "mongoose";
import { Room } from "../models";
import { mongoDBErrorHandler } from "../utils";

export type FindRoomsParams = {
  memberOfUserId: Types.ObjectId;
  q?: string;
  workoutType?: "running" | "fitness";
  cursorPayload?: { lastMessageAt: string | null; id: Types.ObjectId };
  limit: number;
};

export type FindPublicRoomsParams = {
  q?: string;
  workoutType?: "running" | "fitness";
  cursorPayload?: { lastMessageAt: string | null; id: Types.ObjectId };
  limit: number;
};

export class RoomRepository {
  // ✅ 당신이 준 검색 + 커서 그대로
  async findRooms(params: FindRoomsParams) {
    const { memberOfUserId, q, workoutType, cursorPayload, limit } = params;
    try {
      const cond: any = { memberIds: new Types.ObjectId(memberOfUserId) };
      if (q) cond.roomName = { $regex: q, $options: "i" };
      if (workoutType) cond.workoutType = workoutType;

      if (cursorPayload) {
        const { lastMessageAt, id } = cursorPayload;
        if (lastMessageAt === null) {
          cond.$or = [
            { lastMessageAt: { $ne: null } },
            { lastMessageAt: null, _id: { $lt: new Types.ObjectId(id) } },
          ];
        } else {
          cond.$or = [
            { lastMessageAt: { $lt: new Date(lastMessageAt) } },
            {
              lastMessageAt: new Date(lastMessageAt),
              _id: { $lt: new Types.ObjectId(id) },
            },
          ];
        }
      }

      const docs = await Room.find(cond)
        .sort({ lastMessageAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean(false)
        .exec();

      return docs;
    } catch (error) {
      throw mongoDBErrorHandler("rooms.findRooms", error);
    }
  }

  /** 공개 방 목록 (현재는 "모든 방 퍼블릭 취급") */
  async findPublicRooms(params: FindPublicRoomsParams) {
    const { q, workoutType, cursorPayload, limit } = params;
    try {
      const cond: any = {};

      // 검색: roomName / roomDescription
      if (q && q.trim()) {
        cond.$or = [
          { roomName: { $regex: q.trim(), $options: "i" } },
          { roomDescription: { $regex: q.trim(), $options: "i" } },
        ];
      }

      if (workoutType) cond.workoutType = workoutType;

      // 커서 페이지네이션
      if (cursorPayload) {
        const { lastMessageAt, id } = cursorPayload;
        if (lastMessageAt === null) {
          cond.$or = [
            ...(cond.$or || []),
            { lastMessageAt: { $ne: null } }, // 먼저 lastMessageAt 있는 애들 소진
            { lastMessageAt: null, _id: { $lt: new Types.ObjectId(id) } },
          ];
        } else {
          cond.$or = [
            ...(cond.$or || []),
            { lastMessageAt: { $lt: new Date(lastMessageAt) } },
            {
              lastMessageAt: new Date(lastMessageAt),
              _id: { $lt: new Types.ObjectId(id) },
            },
          ];
        }
      }

      const docs = await Room.find(cond)
        .sort({ lastMessageAt: -1, _id: -1 })
        .limit(limit + 1) // 오버페치로 다음 페이지 유무 판단
        .lean(false)
        .exec();

      return docs;
    } catch (error) {
      throw mongoDBErrorHandler("rooms.findPublicRooms", error);
    }
  }

  // ✅ 생성(+ seqCounter 0, memberIds 캐시 쓰기-스루)
  async createOne(payload: {
    roomName: string;
    roomImageUrl?: string;
    workoutType?: "running" | "fitness";
    createdBy: Types.ObjectId;
  }) {
    try {
      const [doc] = await Room.create([
        {
          roomName: payload.roomName,
          roomImageUrl: payload.roomImageUrl,
          workoutType: payload.workoutType,
          createdBy: payload.createdBy,
          seqCounter: 0,
          memberIds: [payload.createdBy], // 캐시 즉시 반영
          memberCount: 1, // 캐시 즉시 반영
        },
      ]);
      return doc;
    } catch (error) {
      throw mongoDBErrorHandler("rooms.createOne", error);
    }
  }

  async findById(roomId: Types.ObjectId, session?: ClientSession) {
    try {
      return await Room.findById(roomId)
        .session(session ?? null)
        .lean(false)
        .exec();
    } catch (error) {
      throw mongoDBErrorHandler("rooms.findById", error);
    }
  }

  async pushMemberCache(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      return await Room.updateOne(
        { _id: roomId },
        { $addToSet: { memberIds: userId }, $inc: { memberCount: 1 } }
      )
        .session(session ?? null)
        .exec();
    } catch (error) {
      throw mongoDBErrorHandler("rooms.pushMemberCache", error);
    }
  }

  /** 탈퇴 시 캐시에서 제거 & 카운트 감소 */
  async pullMemberCache(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      return await Room.updateOne(
        { _id: roomId },
        { $pull: { memberIds: userId }, $inc: { memberCount: -1 } }
      )
        .session(session ?? null)
        .exec();
    } catch (error) {
      throw mongoDBErrorHandler("rooms.pullMemberCache", error);
    }
  }

  async deleteById(roomId: Types.ObjectId) {
    try {
      return await Room.deleteOne({ _id: roomId }).exec();
    } catch (error) {
      throw mongoDBErrorHandler("rooms.deleteById", error);
    }
  }
}

export default new RoomRepository();
