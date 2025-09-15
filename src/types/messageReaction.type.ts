import { Types } from "mongoose";

export interface MessageReactionState {
  _id: Types.ObjectId;

  messageId: Types.ObjectId; // FK(Message)
  roomId: Types.ObjectId; // FK(Room) - 조인/집계 최적화용
  userId: Types.ObjectId; // FK(User)

  emoji: string; // "👍" 또는 ":party_parrot:" 등
  createdAt: Date; // 반응 시각(서버 권위)
}
