import { Types } from "mongoose";
import { Message } from "../models";

export type CreateInput = {
  roomId: Types.ObjectId;
  authorId: Types.ObjectId;
  seq: number;
  type: "text" | "image" | "file" | "system.notice";
  content?: string | null;
  attachments?: any[] | null;
  clientMessageId?: string | null;
};

class MessageRepository {
  async findByClientId(roomId: Types.ObjectId, clientMessageId: string) {
    return Message.findOne({
      roomId: new Types.ObjectId(roomId),
      clientMessageId,
    }).lean();
  }

  async createOne(input: CreateInput, session?: any) {
    const doc = await Message.create(
      [
        {
          roomId: input.roomId,
          authorId: input.authorId,
          seq: input.seq,
          type: input.type,
          content: input.content ?? null,
          attachments: input.attachments ?? null,
          clientMessageId: input.clientMessageId ?? null,
          createdAt: new Date(),
        },
      ],
      { session }
    );
    // create(array) → [doc]
    return doc[0];
  }
}

export default new MessageRepository();
