import mongoose, { Types } from "mongoose";
import { NotificationItemDto } from "../dtos/";
import { Message, Room, RoomMembership } from "../models";

// 이미 선언된 Mongoose 모델들을 import 하세요.

type ListParams = {
  userId: Types.ObjectId;
  limit: number;
  cursor?: string | null; // ISO
};

class NotificationRepository {
  /**
   * 방당 1개 항목: 최신 메시지 + unread 계산
   * 정렬: lastMessageAt DESC
   * 커서: lastMessageAt < cursor
   */
  async listForUser({
    userId,
    limit,
    cursor,
  }: ListParams): Promise<NotificationItemDto[]> {
    const pipeline: mongoose.PipelineStage[] = [
      // 1) 내 membership
      { $match: { userId } },

      // 2) 방 조인
      {
        $lookup: {
          from: Room.collection.name,
          localField: "roomId",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },

      // 3) 최신 메시지 1건 조인 (seq 우선, 없으면 createdAtIso 보조)
      {
        $lookup: {
          from: Message.collection.name,
          let: { rid: "$roomId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$roomId", "$$rid"] } } },
            { $sort: { seq: -1, createdAtIso: -1 } },
            { $limit: 1 },
            { $project: { text: 1, createdAtIso: 1 } },
          ],
          as: "latestMsg",
        },
      },
      { $addFields: { latestMsg: { $arrayElemAt: ["$latestMsg", 0] } } },

      // 4) unread 계산
      {
        $addFields: {
          unreadRaw: {
            $subtract: ["$room.seqCounter", { $ifNull: ["$lastReadSeq", 0] }],
          },
        },
      },
      {
        $addFields: {
          unread: { $cond: [{ $gt: ["$unreadRaw", 0] }, "$unreadRaw", 0] }, // 원본 카운트
        },
      },

      // 5) 표시 필드 정규화
      {
        $project: {
          _id: 0,
          roomId: { $toString: "$roomId" },
          roomName: "$room.roomName",
          lastMessage: "$latestMsg.text",
          lastMessageAt: "$latestMsg.createdAtIso", // ISO 문자열
          unread: 1,
        },
      },
    ];

    // 6) 커서 필터 (있을 때만 추가)
    if (cursor && cursor.trim()) {
      pipeline.push({
        $match: {
          $or: [
            // 메시지가 있는 방: lastMessageAt < cursor
            { lastMessageAt: { $lt: cursor } },
            // 메시지 없는 방은 커서와 무관하게 포함(원치 않으면 이 줄 제거)
            { lastMessageAt: { $exists: false } },
            { lastMessageAt: null },
          ],
        },
      });
    }

    // 7) 정렬 & 제한
    pipeline.push(
      { $sort: { lastMessageAt: -1 } }, // null/미존재는 자동으로 뒤로 감(내림차순)
      { $limit: limit }
    );

    const items = (await RoomMembership.aggregate(
      pipeline
    )) as NotificationItemDto[];

    return items.map((it) => ({
      roomId: it.roomId,
      roomName: it.roomName ?? undefined,
      lastMessage: it.lastMessage ?? undefined,
      lastMessageAt: it.lastMessageAt ?? undefined,
      unread: it.unread ?? 0,
    }));
  }
}

export default new NotificationRepository();
