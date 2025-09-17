import { ClientSession, Types } from "mongoose";
import { RoomMembership } from "../models";
import { mongoDBErrorHandler } from "../utils";

export class RoomMembershipRepository {
  /** 해당 방-사용자 멤버십 1건(활성/비활성 무관) */
  async findByRoomAndUser(roomId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      return await RoomMembership.findOne({ roomId, userId })
        .lean(false)
        .exec();
    } catch (error) {
      throw mongoDBErrorHandler("roomMembership.findByRoomAndUser", error);
    }
  }

  /** 신규 멤버 가입(역할 member) */
  async createMemberMembership(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      const [doc] = await RoomMembership.create(
        [
          {
            roomId,
            userId,
            role: "member",
            joinedAt: new Date(),
            leftAt: null,
            lastReadSeq: 0,
            isPinned: false,
            isMuted: false,
            nicknameInRoom: null,
          },
        ],
        { session }
      );
      return doc;
    } catch (error) {
      throw mongoDBErrorHandler("roomMembership.createMemberMembership", error);
    }
  }

  /** 재가입: leftAt → null, joinedAt 갱신 */
  async reactivateMembership(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      return await RoomMembership.updateOne(
        { roomId, userId },
        { $set: { leftAt: null, joinedAt: new Date() } }
      )
        .session(session ?? null)
        .exec();
    } catch (error) {
      throw mongoDBErrorHandler("roomMembership.reactivateMembership", error);
    }
  }

  async findActiveRoomIdsByUser(userId: Types.ObjectId, limit = 200) {
    try {
      const rows = await RoomMembership.find({
        userId,
        $or: [{ leftAt: null }, { leftAt: { $exists: false } }],
      })
        .select({ roomId: 1 })
        .limit(limit)
        .lean()
        .exec();
      return rows.map((r) => r.roomId as Types.ObjectId);
    } catch (error) {
      throw mongoDBErrorHandler(
        "roomMembership.findActiveRoomIdsByUser",
        error
      );
    }
  }

  async createOwnerMembership(roomId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const [doc] = await RoomMembership.create([
        {
          roomId,
          userId,
          role: "owner",
          joinedAt: new Date(),
          lastReadSeq: 0,
          isPinned: false,
          isMuted: false,
        },
      ]);
      return doc;
    } catch (error) {
      throw mongoDBErrorHandler("roomMembership.createOwnerMembership", error);
    }
  }

  async findRole(roomId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const m = await RoomMembership.findOne({ roomId, userId })
        .select({ role: 1 })
        .lean()
        .exec();
      return m?.role as "owner" | "admin" | "member" | undefined;
    } catch (error) {
      throw mongoDBErrorHandler("roomMembership.findRole", error);
    }
  }

  async deleteAllByRoom(roomId: Types.ObjectId) {
    try {
      return await RoomMembership.deleteMany({ roomId }).exec();
    } catch (error) {
      throw mongoDBErrorHandler("roomMembership.deleteAllByRoom", error);
    }
  }

  /** 활성 멤버십을 탈퇴 처리(leftAt 세팅) */
  async deactivateMembership(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession
  ) {
    try {
      return await RoomMembership.updateOne(
        { roomId, userId, leftAt: null },
        { $set: { leftAt: new Date() } }
      )
        .session(session ?? null)
        .exec();
    } catch (error) {
      throw mongoDBErrorHandler("roomMembership.deactivateMembership", error);
    }
  }

  async getActiveMemberIds(roomId: Types.ObjectId): Promise<string[]> {
    const rows = await RoomMembership.find({
      roomId,
      leftAt: null,
    })
      .select({ userId: 1 })
      .lean();
    return rows.map((r) => String(r.userId));
  }

  async updateLastReadSeq(
    roomId: Types.ObjectId,
    userId: Types.ObjectId,
    lastReadSeq: number
  ) {
    const now = new Date();
    await RoomMembership.updateOne(
      {
        roomId,
        userId,
      },
      { $set: { lastReadSeq, lastReadAt: now } }
    );
  }
}

export default new RoomMembershipRepository();
