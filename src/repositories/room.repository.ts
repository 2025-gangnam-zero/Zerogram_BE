import { ClientSession, DeleteResult, Types, UpdateResult } from "mongoose";
import { Room } from "../models";
import { RoomState, RoomNoticeInline } from "../types";
import { mongoDBErrorHandler } from "../utils";

class RoomRepository {
  async createRoom(
    dto: {
      meetId: Types.ObjectId;
      roomName: string;
      imageUrl?: string;
      description?: string;
      memberCapacity?: number;
    },
    session?: ClientSession
  ) {
    try {
      const doc = new Room({
        ...dto,
        lastMessage: "",
        lastMessageAt: undefined,
        seqCounter: 0,
      });
      return await doc.save({ session });
    } catch (error) {
      throw mongoDBErrorHandler("createRoom", error);
    }
  }

  async findByMeetId(meetId: Types.ObjectId, session?: ClientSession | null) {
    try {
      return await Room.findOne({ meetId })
        .session(session ?? null)
        .lean();
    } catch (error) {
      throw mongoDBErrorHandler("findByMeetId", error);
    }
  }

  async updateByMeetId(
    meetId: Types.ObjectId,
    patch: Partial<{
      roomName: string;
      imageUrl?: string;
      description?: string;
      memberCapacity?: number;
    }>,
    session?: ClientSession
  ): Promise<UpdateResult> {
    try {
      return await Room.updateOne(
        { meetId },
        { $set: patch },
        { session: session }
      );
    } catch (error) {
      throw mongoDBErrorHandler("updateByMeetId", error);
    }
  }

  async deleteById(
    roomId: Types.ObjectId,
    session?: ClientSession
  ): Promise<DeleteResult> {
    try {
      return await Room.deleteOne({ _id: roomId }, { session });
    } catch (error) {
      throw mongoDBErrorHandler("deleteById", error);
    }
  }

  // 단건
  async findById(
    roomId: Types.ObjectId,
    session?: ClientSession
  ): Promise<RoomState | null> {
    try {
      return await Room.findById(roomId).session(session ?? null);
    } catch (error) {
      throw mongoDBErrorHandler("RoomRepository.findById", error);
    }
  }

  // 시퀀스 증가 후 최신 값 반환
  async incSeqCounter(
    roomId: Types.ObjectId,
    session?: ClientSession
  ): Promise<number> {
    try {
      const doc = await Room.findOneAndUpdate(
        { _id: roomId },
        { $inc: { seqCounter: 1 } },
        { new: true, session, projection: { seqCounter: 1 } }
      );
      return doc?.seqCounter ?? 0;
    } catch (error) {
      throw mongoDBErrorHandler("RoomRepository.incSeqCounter", error);
    }
  }

  // 메시지 메타 갱신
  async updateLastMessageMeta(
    roomId: Types.ObjectId,
    params: { lastMessage?: string; lastMessageAt?: Date },
    session?: ClientSession
  ): Promise<void> {
    try {
      const $set: Record<string, any> = {};
      if (typeof params.lastMessage === "string")
        $set.lastMessage = params.lastMessage;
      if (params.lastMessageAt instanceof Date)
        $set.lastMessageAt = params.lastMessageAt;

      if (Object.keys($set).length === 0) return;

      await Room.updateOne(
        { _id: roomId },
        { $set, $currentDate: { updatedAt: true } },
        { session }
      );
    } catch (error) {
      throw mongoDBErrorHandler("RoomRepository.updateLastMessageMeta", error);
    }
  }

  // 공지 갱신 (부분 업데이트)
  async updateNotice(
    roomId: Types.ObjectId,
    notice: Partial<RoomNoticeInline> & {
      authorId?: Types.ObjectId;
      updatedAt?: Date;
    },
    session?: ClientSession
  ): Promise<void> {
    try {
      const $set: Record<string, any> = {};
      if (typeof notice.text !== "undefined") $set["notice.text"] = notice.text;
      if (typeof notice.enabled !== "undefined")
        $set["notice.enabled"] = notice.enabled;
      if (typeof notice.authorId !== "undefined")
        $set["notice.authorId"] = notice.authorId;
      if (typeof notice.updatedAt !== "undefined")
        $set["notice.updatedAt"] = notice.updatedAt;

      await Room.updateOne(
        { _id: roomId },
        { $set, $currentDate: { updatedAt: true } },
        { session }
      );
    } catch (error) {
      throw mongoDBErrorHandler("RoomRepository.updateNotice", error);
    }
  }

  // 내 방 목록(사이드바) 집계
  async aggregateMineRooms(
    userId: Types.ObjectId,
    {
      limit = 20,
      cursor, // createdAt ISO 혹은 ObjectId 기반 커서 등 선택 구현
      q,
    }: { limit?: number; cursor?: string | null; q?: string },
    session?: ClientSession
  ): Promise<{ items: any[]; nextCursor: string | null }> {
    try {
      const matchName = q ? { roomName: { $regex: q, $options: "i" } } : {};
      const cursorMatch = cursor
        ? { updatedAt: { $lt: new Date(cursor) } }
        : {}; // 필요 시 커서 전략 변경

      const pipeline: any[] = [
        // 내 멤버십 연결
        {
          $lookup: {
            from: "roommemberships",
            let: { roomId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$roomId", "$$roomId"] },
                      { $eq: ["$userId", userId] },
                    ],
                  },
                },
              },
            ],
            as: "myMembership",
          },
        },
        {
          $match: {
            "myMembership.0": { $exists: true },
            ...matchName,
            ...cursorMatch,
          },
        },

        // 멤버 수
        {
          $lookup: {
            from: "roommemberships",
            localField: "_id",
            foreignField: "roomId",
            as: "members",
          },
        },
        {
          $addFields: {
            memberCount: { $size: "$members" },
            lastMessageAtStr: { $toString: "$lastMessageAt" },
            lastReadSeq: {
              $ifNull: [{ $arrayElemAt: ["$myMembership.lastReadSeq", 0] }, 0],
            },
          },
        },
        {
          $addFields: {
            unreadCount: {
              $max: [{ $subtract: ["$seqCounter", "$lastReadSeq"] }, 0],
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: { $toString: "$_id" },
            roomName: 1,
            imageUrl: 1,
            memberCount: 1,
            lastMessage: 1,
            lastMessageAt: "$lastMessageAtStr",
            unreadCount: 1,
            updatedAt: 1,
          },
        },
        { $sort: { updatedAt: -1 } },
        { $limit: limit },
      ];

      const result = await Room.aggregate(pipeline).session(session ?? null);

      const next =
        result.length === limit
          ? result[result.length - 1].updatedAt?.toISOString?.() ?? null
          : null;
      return {
        items: result.map(({ updatedAt, ...it }: any) => it),
        nextCursor: next,
      };
    } catch (error) {
      throw mongoDBErrorHandler("RoomRepository.aggregateMineRooms", error);
    }
  }
}

export default new RoomRepository();
