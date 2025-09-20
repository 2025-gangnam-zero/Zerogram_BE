import type { Server as HttpServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { registerChatNamespace } from "./namespaces/chat";
import { userService, userSessionService } from "../services";

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
  chat.use(async (socket, next) => {
    const sessionId = socket.handshake.auth?.sessionId as string | undefined;
    if (!sessionId || sessionId.length < 8) {
      return next(new Error("UNAUTHORIZED: sessionId missing or invalid"));
    }
    (socket.data as any).sessionId = sessionId;

    const sessionid = new mongoose.Types.ObjectId(sessionId);

    const { userId } = await userSessionService.getUserSessionById(sessionid);

    const { _id, nickname, profile_image } = await userService.getUserById(
      userId
    );
    //--
    (socket.data as any).user = {
      id: _id,
      name: nickname,
      avatarUrl: profile_image,
    };

    next();
  });

  registerChatNamespace(chat);
  return io;
};
