// initSocket.ts (핵심만)
import mongoose from "mongoose";
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { userService, userSessionService } from "../services";
import { jwtSign, jwtVerify } from "../utils";
import { ACCESS_TOKEN_EXPIRESIN } from "../constants";

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL ?? "http://localhost:3000",
        "http://localhost:3001",
      ],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // ⬇️ HTTP의 authChecker와 등가로 동작하는 소켓 인증
  io.use(async (socket, next) => {
    try {
      const sessionid = (socket.handshake.auth?.sessionId ||
        socket.handshake.query?.sessionId) as string | undefined;

      if (!sessionid || !mongoose.Types.ObjectId.isValid(sessionid)) {
        return next(new Error("SESSION_ID_MISSING"));
      }
      const sessionId = new mongoose.Types.ObjectId(sessionid);

      // 세션 조회
      const user_session = await userSessionService.getUserSessionById(
        sessionId
      );
      const { userId, access_token, refresh_token } = user_session;

      // 액세스 토큰 검증
      try {
        await jwtVerify(access_token);
      } catch {
        // 리프레시로 재발급 시도 (HTTP와 동일 검증)
        const { userId: refreshUserId } = await jwtVerify(refresh_token);
        if (String(refreshUserId) !== String(userId)) {
          return next(new Error("TOKEN_SESSION_MISMATCH"));
        }
        const new_access = await jwtSign(
          { refreshUserId },
          ACCESS_TOKEN_EXPIRESIN
        );
        await userSessionService.updateAccessToken(refreshUserId, new_access);
        // 핸드셰이크에선 응답 바디가 없으므로, 연결 후 이벤트로 알려줄 수 있음
        (socket.data as any).reissuedAccessToken = new_access;
      }

      // 사용자 정보 주입 (req.user 대체)
      const user = await userService.getUserById(userId);
      socket.data.user = user;
      (socket.data as any).sessionId = sessionId;

      return next();
    } catch (e) {
      return next(new Error("AUTH_FAILED"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as any; // UserState
    socket.emit("sys:hello", { userId: user._id, ts: Date.now() });

    // 액세스 토큰이 핸드셰이크에서 재발급된 경우, 선택적으로 통지
    if ((socket.data as any).reissuedAccessToken) {
      socket.emit("auth:reissued", {
        accessToken: (socket.data as any).reissuedAccessToken,
      });
    }

    socket.on("room:join", ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      socket.join(roomId);
      socket.emit("room:joined", { roomId });
    });

    socket.on("room:leave", ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      socket.leave(roomId);
      socket.emit("room:left", { roomId });
    });

    // 메시지 전송
    socket.on(
      "msg:send",
      async (
        payload: {
          roomId: string;
          text?: string;
          images?: string[];
          clientId: string; // 낙관적 매칭용
        },
        ack?: (res: { ok: boolean; serverId?: string; error?: string }) => void
      ) => {
        try {
          if (!payload?.roomId || !payload?.clientId) {
            return ack?.({ ok: false, error: "roomId/clientId required" });
          }

          console.log("[서버] msg:send 수신:", payload);

          // TODO: DB 저장 (여기선 mock)
          const msg = {
            id: `srv-${Date.now()}`,
            roomId: payload.roomId,
            author: {
              id: user._id,
              name: user.nickname,
              avatarUrl: user.profile_image,
            },
            content: payload.text ?? "",
            images: payload.images ?? [],
            createdAt: Date.now(),
          };

          // 전송자 제외 브로드캐스트(중복 수신 방지)
          //   socket.to(payload.roomId).emit("msg:new", { msg });
          socket.broadcast.emit("msg:new", { msg });

          // 전송자에게 ACK (tmp id 교체용)
          ack?.({ ok: true, serverId: msg.id });
        } catch (e) {
          ack?.({ ok: false, error: "send failed" });
        }
      }
    );

    // 읽음 처리 (휘발 이벤트 권장)
    socket.on(
      "msg:read",
      ({ roomId, lastReadSeq }: { roomId: string; lastReadSeq: number }) => {
        if (!roomId) return;
        // TODO: DB 업데이트
        socket.to(roomId).volatile.emit("msg:read:updated", {
          roomId,
          userId: user._id,
          lastReadSeq,
        });
      }
    );

    // 타이핑 인디케이터 (휘발)
    socket.on("typing", ({ roomId, on }: { roomId: string; on: boolean }) => {
      if (!roomId) return;
      socket.to(roomId).volatile.emit("typing", {
        roomId,
        userId: user._id,
        on,
      });
    });

    socket.on("disconnect", () => {
      // 필요시 정리
    });
  });

  return io;
};
