// src/socket/index.ts (발췌)
import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { registerChatNamespace } from "./namespaces/chat";

// 기존 HTTP에서 쓰던 서비스/유틸 재사용
import { ACCESS_TOKEN_EXPIRESIN } from "../constants";
import { userService, userSessionService } from "../services";
import { jwtSign, jwtVerify } from "../utils";
import { setIo } from "./io";

export const initSocket = (
  httpServer: HttpServer,
  {
    path = "/ws",
    corsOrigins = ["http://localhost:3000"],
  }: { path?: string; corsOrigins?: string[] } = {}
) => {
  const io = new Server(httpServer, {
    path,
    cors: { origin: corsOrigins, credentials: true },
  });
  setIo(io); // 전역 io 등록

  const chat = io.of("/chat");

  // ✅ Socket.IO 네임스페이스 미들웨어: 세션/JWT 검증
  chat.use(async (socket, next) => {
    try {
      const sessionid = socket.handshake.auth?.sessionId as string | undefined;

      if (!sessionid || !mongoose.Types.ObjectId.isValid(sessionid)) {
        return next(new Error("UNAUTHORIZED: 세션 아이디가 유효하지 않음"));
      }
      const sessionId = new mongoose.Types.ObjectId(sessionid);

      // 1) 세션 조회
      const user_session = await userSessionService.getUserSessionById(
        sessionId
      );
      if (!user_session) {
        return next(new Error("UNAUTHORIZED: 사용자 세션을 찾을 수 없음"));
      }

      const { userId, access_token, refresh_token } = user_session;

      // 2) 액세스 토큰 검증 시도
      let validAccess = false;
      try {
        await jwtVerify(access_token);
        validAccess = true;
      } catch {
        validAccess = false;
      }

      // 3) 액세스 토큰 만료 시 → 리프레시 검증 & 재발급
      if (!validAccess) {
        try {
          const { userId: refreshUserId } = await jwtVerify(refresh_token);

          // 토큰-세션 사용자 일치 검증
          if (String(refreshUserId) !== String(userId)) {
            return next(new Error("UNAUTHORIZED: 토큰과 세션 정보 불일치"));
          }

          // 새 액세스 토큰 발급
          const newAccess = await jwtSign(
            { refreshUserId },
            ACCESS_TOKEN_EXPIRESIN
          );
          await userSessionService.updateAccessToken(refreshUserId, newAccess);

          // 선택) 연결 후 클라이언트와 토큰 동기화 이벤트
          // socket.emit("auth:reissued", { access_token: newAccess });

          // 이후 로직에서 사용할 수 있게 교체
          user_session.access_token = newAccess;
        } catch {
          return next(
            new Error("UNAUTHORIZED: 리프레시 토큰 만료 또는 검증 실패")
          );
        }
      }

      // 4) 사용자 정보 로드
      const user = await userService.getUserById(userId);
      if (!user) {
        return next(new Error("UNAUTHORIZED: 사용자 정보를 찾을 수 없음"));
      }

      // 5) 소켓 컨텍스트에 저장 (후속 이벤트에서 사용)
      (socket.data as any).sessionId = sessionId;
      (socket.data as any).user = {
        userId: String(user._id),
        nickname: user.nickname, // 스키마에 맞게 필드명 조정
        profile_image: user.profile_image, // 스키마에 맞게 필드명 조정
      };

      return next();
    } catch (err) {
      return next(new Error("UNAUTHORIZED: 내부 오류"));
    }
  });

  registerChatNamespace(chat);
  return io;
};
