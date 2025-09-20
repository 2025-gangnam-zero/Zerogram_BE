// src/socket/namespaces/chat.ts
import type { Namespace, Socket } from "socket.io";

type ChatUser = {
  id: string;
  name?: string;
  avatarUrl?: string;
};

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

    console.log(`[chat] connected id=${socket.id} sid=${sid}`);

    // 여러 방 입장
    socket.on("room:join", ({ roomId } = {} as any) => {
      if (!roomId) return;
      socket.join(roomId);
      // (선택) 일관성 위해 author 포함
      socket.to(roomId).emit("room:userJoined", { roomId, author });
    });

    // 여러 방 퇴장
    socket.on("room:leave", ({ roomId } = {} as any) => {
      if (!roomId) return;
      socket.leave(roomId);
      socket.to(roomId).emit("room:userLeft", { roomId, author });
    });

    // 메시지 전송 + ACK
    socket.on(
      "message:send",
      (
        { roomId, text }: SendPayload = {} as any,
        ack?: (r: SendAck) => void
      ) => {
        if (!roomId || !text || !text.trim()) {
          return ack?.({ ok: false, error: "INVALID_PAYLOAD" });
        }

        const id = makeId();
        const createdAt = new Date().toISOString();

        // ✅ 클라 수신 타입(UI 모델)과 1:1: { id, roomId, text, createdAt, author, meta? }
        const message = {
          id,
          roomId,
          text: String(text),
          createdAt, // 문자열(ISO)
          author, // ← senderId 대신 author 전체 스냅샷
          // meta: { readCount: 0 }, // 필요 시
        };

        // 같은 방의 모두에게 방송
        nsp.to(roomId).emit("message:new", message);

        // ACK (문자열 createdAt 유지)
        ack?.({ ok: true, serverId: id, createdAt });
      }
    );

    socket.on("disconnect", (reason) => {
      console.log(`[chat] disconnected id=${socket.id} reason=${reason}`);
    });
  });
};
