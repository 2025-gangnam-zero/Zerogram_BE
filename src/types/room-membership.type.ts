import { Types } from "mongoose";

export type RoomMembershipState = {
  _id?: Types.ObjectId;
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "owner" | "admin" | "member";
  lastReadSeq: number; // unread = room.seqCounter - lastReadSeq
  joinedAt: Date; // 최초 가입 시각
  createdAt?: Date; // timestamps:true
  updatedAt?: Date; // timestamps:true
};
