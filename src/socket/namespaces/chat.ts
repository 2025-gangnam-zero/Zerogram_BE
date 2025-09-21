// src/socket/namespaces/chat.ts
import type { Namespace, Socket } from "socket.io";
import mongoose from "mongoose";
import { ChatUser } from "../../types";
import { messageService } from "../../services";

type SendPayload = { roomId: string; text: string };
type SendAck = {
  ok: boolean;
  id?: string; // ← messageId (_id)
  serverId?: string; // ← 멱등키
  createdAt?: string; // ISO
  error?: string;
};

const makeId = () =>
  `svr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const registerChatNamespace = (nsp: Namespace) => {
  nsp.on("connection", (socket: Socket) => {
    const sid = (socket.data as any).sessionId as string;
    const author = ((socket.data as any).user || { id: sid }) as ChatUser;

    socket.on("room:join", ({ roomId } = {} as any) => {
      if (!roomId) return;
      socket.join(roomId);
      socket.to(roomId).emit("room:userJoined", { roomId, author });
    });

    socket.on("room:leave", ({ roomId } = {} as any) => {
      if (!roomId) return;
      socket.leave(roomId);
      socket.to(roomId).emit("room:userLeft", { roomId, author });
    });

    // 메시지 전송 + DB 영속화
    socket.on(
      "message:send",
      async (
        { roomId, text }: SendPayload = {} as any,
        ack?: (r: SendAck) => void
      ) => {
        try {
          if (!roomId || !text || !text.trim()) {
            return ack?.({ ok: false, error: "INVALID_PAYLOAD" });
          }

          const serverId = makeId(); // 멱등키
          const roomObjId = new mongoose.Types.ObjectId(roomId);
          const authorObjId = new mongoose.Types.ObjectId(author.userId);

          // 트랜잭션 내부: seq 증가 → message 저장 → room 메타 갱신
          const saved = await messageService.sendMessage({
            roomId: roomObjId,
            authorId: authorObjId,
            author, // 스냅샷
            serverId,
            text: String(text),
            attachments: [], // 필요 시 확장
          });
          // saved는 ChatMessageDTO { id, serverId, roomId, authorId, author, text, attachments, seq, createdAtIso, meta }

          // 브로드캐스트: 클라 ChatMessage와 정합
          nsp.to(roomId).emit("message:new", {
            id: saved.id, // ← messageId (_id)
            serverId: saved.serverId, // ← 멱등키
            roomId: saved.roomId,
            authorId: saved.authorId,
            author: saved.author, // 저장된 스냅샷 사용
            text: saved.text ?? "",
            attachments: saved.attachments ?? [],
            seq: saved.seq,
            createdAt: saved.createdAtIso, // ISO 문자열
            meta: saved.meta,
          });

          // ACK에도 id 포함
          return ack?.({
            ok: true,
            id: saved.id,
            serverId: saved.serverId,
            createdAt: saved.createdAtIso,
          });
        } catch (err: any) {
          return ack?.({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
        }
      }
    );
  });
};
