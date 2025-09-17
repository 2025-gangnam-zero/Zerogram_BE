import { Types } from "mongoose";
import { roomMembershipRepository } from "../repositories";

class RoomMembershipService {
  async findByRoomAndUser(roomId: string, userId: string) {
    const roomid = new Types.ObjectId(roomId);
    const userid = new Types.ObjectId(userId);
    return roomMembershipRepository.findByRoomAndUser(roomid, userid);
  }

  async getActiveMemberIds(roomId: string) {
    const roomid = new Types.ObjectId(roomId);
    return roomMembershipRepository.getActiveMemberIds(roomid);
  }

  async updateLastReadSeq(roomId: string, userId: string, lastReadSeq: number) {
    const roomid = new Types.ObjectId(roomId);
    const userid = new Types.ObjectId(userId);
    return roomMembershipRepository.updateLastReadSeq(
      roomid,
      userid,
      lastReadSeq
    );
  }
}

export default new RoomMembershipService();
