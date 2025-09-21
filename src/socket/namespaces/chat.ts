// src/socket/namespaces/chat.ts
import type { Namespace, Socket } from "socket.io";
import mongoose from "mongoose";
import { ChatUser } from "../../types";
import { messageService } from "../../services";

type SendPayload = { roomId: string; text: string };
type SendAck = {
  ok: boolean;
  serverId?: string;
  createdAt?: string;
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

    // ✅ 메시지 전송 + DB 영속화
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

          const serverId = makeId(); // 멱등키(서버 생성). 클라 생성으로 바꾸려면 payload에 포함
          const roomObjId = new mongoose.Types.ObjectId(roomId);
          const authorObjId = new mongoose.Types.ObjectId(author.userId); // 미들웨어에서 user 주입됨

          // DB 저장 (트랜잭션 내부: seq 증가 → message 저장 → room 메타 갱신)
          const saved = await messageService.sendMessage({
            roomId: roomObjId,
            authorId: authorObjId,
            author, // 스냅샷
            serverId,
            text: String(text),
            attachments: [], // 필요 시 클라에서 전달받아 포함
          });

          // 브로드캐스트: 클라 UI 모델에 맞춰 전달
          nsp.to(roomId).emit("message:new", {
            id: saved.serverId,
            roomId,
            text: saved.text ?? "",
            createdAt: saved.createdAtIso,
            author, // 스냅샷
            meta: saved.meta,
          });

          return ack?.({ ok: true, serverId, createdAt: saved.createdAtIso });
        } catch (err: any) {
          // 서비스에서 던진 커스텀 에러 메시지 전달
          return ack?.({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
        }
      }
    );
  });
};
