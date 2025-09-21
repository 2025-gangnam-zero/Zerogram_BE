import { ClientSession, Types } from "mongoose";
import { RoomMembership } from "../models";
import { RoomMembershipState } from "../types";
import { mongoDBErrorHandler } from "../utils";

class RoomMembershipRepository {
  async findOne(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<RoomMembershipState | null> {
    try {
      return await RoomMembership.findOne({ roomId, userId }).session(
        session ?? null
      );
    } catch (error) {
      throw mongoDBErrorHandler("RoomMembershipRepository.findOne", error);
    }
  }

  async findMembers(
    roomId: Types.ObjectId,
    { limit = 50, cursor }: { limit?: number; cursor?: string | null } = {},
    session?: ClientSession
  ): Promise<{ items: RoomMembershipState[]; nextCursor: string | null }> {
    try {
      const query: any = { roomId };
      if (cursor) query.joinedAt = { $lt: new Date(cursor) };

      const docs = await RoomMembership.find(query)
        .sort({ joinedAt: -1 })
        .limit(limit)
        .session(session ?? null);

      const next =
        docs.length === limit
          ? docs[docs.length - 1].joinedAt?.toISOString?.() ?? null
          : null;
      return { items: docs, nextCursor: next };
    } catch (error) {
      throw mongoDBErrorHandler("RoomMembershipRepository.findMembers", error);
    }
  }

  async upsertMember(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    payload: {
      role?: "owner" | "admin" | "member";
      joinedAt?: Date;
      lastReadSeq?: number;
    } = {},
    session?: ClientSession
  ): Promise<void> {
    try {
      await RoomMembership.updateOne(
        { roomId, userId },
        {
          $setOnInsert: {
            role: payload.role ?? "member",
            joinedAt: payload.joinedAt ?? new Date(),
          },
          $set: {
            ...(typeof payload.lastReadSeq === "number"
              ? { lastReadSeq: payload.lastReadSeq }
              : {}),
            ...(payload.role ? { role: payload.role } : {}),
          },
        },
        { upsert: true, session }
      );
    } catch (error) {
      throw mongoDBErrorHandler("RoomMembershipRepository.upsertMember", error);
    }
  }

  async deleteMember(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<void> {
    try {
      await RoomMembership.deleteOne({ roomId, userId }).session(
        session ?? null
      );
    } catch (error) {
      throw mongoDBErrorHandler("RoomMembershipRepository.deleteMember", error);
    }
  }

  async updateLastReadSeq(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    lastReadSeq: number,
    session?: ClientSession
  ): Promise<void> {
    try {
      await RoomMembership.updateOne(
        { roomId, userId },
        { $max: { lastReadSeq }, $currentDate: { updatedAt: true } },
        { session }
      );
    } catch (error) {
      throw mongoDBErrorHandler(
        "RoomMembershipRepository.updateLastReadSeq",
        error
      );
    }
  }

  async getLastReadSeq(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<number> {
    try {
      const doc = await RoomMembership.findOne(
        { roomId, userId },
        { lastReadSeq: 1 }
      ).session(session ?? null);
      return doc?.lastReadSeq ?? 0;
    } catch (error) {
      throw mongoDBErrorHandler(
        "RoomMembershipRepository.getLastReadSeq",
        error
      );
    }
  }

  async countByRoom(
    roomId: Types.ObjectId,
    session?: ClientSession
  ): Promise<number> {
    try {
      return await RoomMembership.countDocuments({ roomId }).session(
        session ?? null
      );
    } catch (error) {
      throw mongoDBErrorHandler("RoomMembershipRepository.countByRoom", error);
    }
  }
}

export default new RoomMembershipRepository();
