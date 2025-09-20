import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { registerChatNamespace } from "./namespaces/chat";

export type InitSocketOptions = {
  path?: string;
  corsOrigins?: string[];
};

export const initSocket = (
  httpServer: HttpServer,
  {
    path = "/ws",
    corsOrigins = ["http://localhost:3000"],
  }: InitSocketOptions = {}
) => {
  const io = new Server(httpServer, {
    path,
    cors: { origin: corsOrigins, credentials: true },
  });

  const chat = io.of("/chat");

  // ① 세션/유저 스냅샷 주입
  chat.use((socket, next) => {
    const sessionId = socket.handshake.auth?.sessionId as string | undefined;
    if (!sessionId || sessionId.length < 8) {
      return next(new Error("UNAUTHORIZED: sessionId missing or invalid"));
    }
    (socket.data as any).sessionId = sessionId;

    // TODO: 실제 DB/캐시에서 조회해 채워 넣으세요.
    // 최소 기본 형태만 먼저 세팅해도 됩니다.
    (socket.data as any).user = {
      id: sessionId,
      name: `user-${sessionId.slice(-4)}`,
      avatarUrl: undefined,
    };

    next();
  });

  registerChatNamespace(chat);
  return io;
};
