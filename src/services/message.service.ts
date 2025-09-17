import mongoose, { Types } from "mongoose";
import { roomRepository, messageRepository } from "../repositories";

type CreateMsgInput = {
  roomId: string;
  authorId: string;
  type: "text" | "image" | "file" | "system.notice";
  content?: string | null;
  attachments?: any[] | null;
  clientMessageId?: string | null;
};

class MessageService {
  async findByClientId(roomId: string, clientMessageId: string) {
    const roomid = new Types.ObjectId(roomId);
    return messageRepository.findByClientId(roomid, clientMessageId);
  }

  /**
   * 방의 seqCounter를 원자적으로 증가시키면서 메시지를 저장.
   * - 가능한 경우 트랜잭션 사용(ReplicaSet 권장)
   * - lastMessage / lastMessageAt 업데이트
   */
  async createMessageWithSeq(input: CreateMsgInput) {
    const session = await mongoose.startSession();
    try {
      let saved: any;
      let roomAfter: any;

      await session.withTransaction(async () => {
        // 1) seqCounter +1 (방의 최신 시퀀스)
        const preview =
          input.type === "text" ? input.content ?? "" : `[${input.type}]`;

        const room = await roomRepository.incSeqAndTouch(
          new Types.ObjectId(input.roomId),
          preview,
          session
        );
        if (!room) throw new Error("ROOM_NOT_FOUND");
        const seq = room.seqCounter;

        // 2) 메시지 저장
        saved = await messageRepository.createOne(
          {
            roomId: new Types.ObjectId(input.roomId),
            authorId: new Types.ObjectId(input.authorId),
            seq,
            type: input.type,
            content: input.content ?? null,
            attachments: input.attachments ?? null,
            clientMessageId: input.clientMessageId ?? null,
          },
          session
        );

        roomAfter = room; // seqCounter/lastMessage/lastMessageAt 포함
      });

      // 트랜잭션 완료 후 seq는 saved.seq에도 들어 있음
      return { seq: saved.seq, saved, roomAfter };
    } finally {
      session.endSession();
    }
  }
}

export default new MessageService();
