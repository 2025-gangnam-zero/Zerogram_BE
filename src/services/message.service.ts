// services/message.service.ts
import mongoose, { Types } from "mongoose";
import {
  messageRepository,
  roomRepository,
  roomMembershipRepository,
} from "../repositories";
import { ForbiddenError, InternalServerError, NotFoundError } from "../errors";
import { ChatUser, MessageState } from "../types";

export type SendMessageInput = {
  roomId: Types.ObjectId;
  authorId: Types.ObjectId;
  author: ChatUser; // 스냅샷
  serverId: string; // 멱등성/고유 ID
  text?: string;
  attachments?: MessageState["attachments"];
};

export type ChatMessageDTO = {
  serverId: string;
  roomId: string;
  authorId: string;
  author: ChatUser;
  text?: string;
  attachments?: MessageState["attachments"];
  seq: number;
  createdAtIso: string;
  meta?: { readCount?: number };
};

const toDTO = (m: MessageState): ChatMessageDTO => ({
  serverId: m.serverId,
  roomId: String(m.roomId),
  authorId: String(m.authorId),
  author: m.author,
  text: m.text,
  attachments: m.attachments,
  seq: m.seq,
  createdAtIso: m.createdAtIso,
  meta: m.meta,
});

class MessageService {
  // 메시지 전송: 멤버십 확인 → (TX) seq 증가 → 메시지 생성 → 룸 메타 갱신
  async sendMessage(input: SendMessageInput): Promise<ChatMessageDTO> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 멤버십 확인
      const member = await roomMembershipRepository.findOne(
        input.roomId,
        input.authorId,
        session ?? null
      );
      if (!member) {
        throw new ForbiddenError("채팅방 멤버가 아닙니다.");
      }

      // 시퀀스 증가 및 획득
      const nextSeq = await roomRepository.incSeqCounter(
        input.roomId,
        session ?? null
      );
      const createdAtIso = new Date().toISOString();

      // 메시지 생성
      const saved = await messageRepository.createMessage(
        {
          roomId: input.roomId,
          authorId: input.authorId,
          author: input.author,
          serverId: input.serverId,
          seq: nextSeq,
          text: input.text,
          attachments: input.attachments ?? [],
          createdAtIso,
        },
        session ?? null
      );

      // 룸 메타 갱신
      await roomRepository.updateLastMessageMeta(
        input.roomId,
        { lastMessage: input.text ?? "", lastMessageAt: new Date() },
        session ?? null
      );

      await session.commitTransaction();
      return toDTO(saved);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 히스토리 조회 (커서: beforeId 또는 beforeSeq)
  async getHistory(
    roomId: Types.ObjectId,
    opts: { beforeId?: Types.ObjectId; beforeSeq?: number; limit?: number } = {}
  ): Promise<{ items: ChatMessageDTO[] }> {
    try {
      const items = await messageRepository.findByRoom(roomId, opts, undefined);
      return { items: items.map(toDTO) };
    } catch (error) {
      throw error;
    }
  }

  // 메시지 삭제(작성자 또는 owner/admin)
  async deleteMessage(
    roomId: Types.ObjectId,
    messageId: Types.ObjectId,
    actorId: Types.ObjectId
  ): Promise<void> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const msg = await messageRepository.findById(messageId, session ?? null);
      if (!msg || String(msg.roomId) !== String(roomId)) {
        throw new NotFoundError("메시지를 찾을 수 없습니다.");
      }

      const membership = await roomMembershipRepository.findOne(
        roomId,
        actorId,
        session ?? null
      );
      if (!membership) {
        throw new ForbiddenError("채팅방 멤버가 아닙니다.");
      }

      const isAdmin =
        membership.role === "owner" || membership.role === "admin";
      const isAuthor = String(msg.authorId) === String(actorId);
      if (!isAuthor && !isAdmin) {
        throw new ForbiddenError("삭제 권한이 없습니다.");
      }

      const result = await messageRepository.deleteMessage(
        roomId,
        messageId,
        session ?? null
      );
      if (!result.acknowledged || result.deletedCount === 0) {
        throw new InternalServerError("메시지 삭제 실패");
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

export default new MessageService();
