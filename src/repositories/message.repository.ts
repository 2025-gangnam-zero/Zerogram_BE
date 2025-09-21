// repositories/message.repository.ts
import { ClientSession, Types, DeleteResult } from "mongoose";
import { Message } from "../models";
import { ChatUser, MessageState } from "../types";
import { mongoDBErrorHandler } from "../utils";

class MessageRepository {
  async findById(
    messageId: Types.ObjectId,
    session?: ClientSession
  ): Promise<MessageState | null> {
    try {
      return await Message.findById(messageId).session(session ?? null);
    } catch (error) {
      throw mongoDBErrorHandler("MessageRepository.findById", error);
    }
  }

  async findByServerId(
    serverId: string,
    session?: ClientSession
  ): Promise<MessageState | null> {
    try {
      return await Message.findOne({ serverId }).session(session ?? null);
    } catch (error) {
      throw mongoDBErrorHandler("MessageRepository.findByServerId", error);
    }
  }

  async getSeqById(
    roomId: Types.ObjectId,
    messageId: Types.ObjectId,
    session?: ClientSession
  ): Promise<number | null> {
    try {
      const doc = await Message.findOne(
        { _id: messageId, roomId },
        { seq: 1 }
      ).session(session ?? null);
      return doc?.seq ?? null;
    } catch (error) {
      throw mongoDBErrorHandler("MessageRepository.getSeqById", error);
    }
  }

  async findByRoom(
    roomId: Types.ObjectId,
    {
      beforeSeq,
      beforeId,
      limit = 30,
    }: { beforeSeq?: number; beforeId?: Types.ObjectId; limit?: number },
    session?: ClientSession
  ): Promise<MessageState[]> {
    try {
      let seqCut: number | undefined = beforeSeq;
      if (!seqCut && beforeId) {
        const seq = await this.getSeqById(roomId, beforeId, session);
        if (seq) seqCut = seq;
      }

      const query: any = { roomId };
      if (typeof seqCut === "number") query.seq = { $lt: seqCut };

      return await Message.find(query)
        .sort({ seq: -1 })
        .limit(limit)
        .session(session ?? null);
    } catch (error) {
      throw mongoDBErrorHandler("MessageRepository.findByRoom", error);
    }
  }

  async createMessage(
    params: {
      roomId: Types.ObjectId;
      authorId: Types.ObjectId;
      author: ChatUser; // 스냅샷
      serverId: string;
      seq: number;
      text?: string;
      attachments?: MessageState["attachments"];
      createdAtIso: string;
    },
    session?: ClientSession
  ): Promise<MessageState> {
    try {
      const doc = new Message({
        roomId: params.roomId,
        authorId: params.authorId,
        author: params.author,
        serverId: params.serverId,
        seq: params.seq,
        text: params.text,
        attachments: params.attachments ?? [],
        createdAtIso: params.createdAtIso,
      });
      return await doc.save({ session });
    } catch (error) {
      throw mongoDBErrorHandler("MessageRepository.createMessage", error);
    }
  }

  async deleteMessage(
    roomId: Types.ObjectId,
    messageId: Types.ObjectId,
    session?: ClientSession
  ): Promise<DeleteResult> {
    try {
      return await Message.deleteOne({ _id: messageId, roomId }).session(
        session ?? null
      );
    } catch (error) {
      throw mongoDBErrorHandler("MessageRepository.deleteMessage", error);
    }
  }

  async deleteAllByRoomId(
    roomId: Types.ObjectId,
    session?: ClientSession
  ): Promise<DeleteResult> {
    try {
      return await Message.deleteMany({ roomId }, { session });
    } catch (error) {
      throw mongoDBErrorHandler("deleteAllByRoomId", error);
    }
  }
}

export default new MessageRepository();
