import { Types } from "mongoose";
import { RoomMembership } from "../models";

class RoomMembershipRepository {
  async findMembershipsByUser(userId: Types.ObjectId) {
    return RoomMembership.find({ userId })
      .select("roomId lastReadSeq isPinned")
      .lean();
  }
}

export default new RoomMembershipRepository();
