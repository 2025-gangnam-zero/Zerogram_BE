import { Room } from "../models";
import { Types } from "mongoose";

type FindRoomsParams = {
  memberOfUserId: Types.ObjectId; // 사용자가 속한 방
  q?: string;
  workoutType?: "running" | "fitness";
  cursorPayload?: { lastMessageAt: string | null; id: Types.ObjectId };
  limit: number;
};

class RoomRepository {
  async findRooms(params: FindRoomsParams) {
    const { memberOfUserId, q, workoutType, cursorPayload, limit } = params;

    const cond: any = { memberIds: new Types.ObjectId(memberOfUserId) };
    if (q) cond.roomName = { $regex: q, $options: "i" };
    if (workoutType) cond.workoutType = workoutType;

    if (cursorPayload) {
      const { lastMessageAt, id } = cursorPayload;

      if (lastMessageAt === null) {
        // null 그룹 하단: 먼저 lastMessageAt != null 남은 것들, 이어서 null 그룹 tie-break
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
      .limit(limit + 1) // nextCursor 판별 위해 +1
      .lean();

    return docs;
  }
}

export default new RoomRepository();
