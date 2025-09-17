// initSocket.ts
import mongoose from "mongoose";
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import {
  userService,
  userSessionService,
  roomService,
  roomMembershipService,
  messageService,
} from "../services";
import { jwtSign, jwtVerify } from "../utils";
import { ACCESS_TOKEN_EXPIRESIN } from "../constants";
import type { MessageDto } from "../types";

// 채널 키 유틸
const roomKey = (id: string) => `room:${id}`;
const userKey = (id: string) => `user:${id}`;

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

  // /chat 네임스페이스
  const chat = io.of("/chat");

  // ⬇️ 네임스페이스 단위 인증 미들웨어
  chat.use(async (socket, next) => {
    try {
      const sessionid = (socket.handshake.auth?.sessionId ||
        socket.handshake.query?.sessionId) as string | undefined;

      if (!sessionid || !mongoose.Types.ObjectId.isValid(sessionid)) {
        return next(new Error("SESSION_ID_MISSING"));
      }
      const sessionId = new mongoose.Types.ObjectId(sessionid);

      const user_session = await userSessionService.getUserSessionById(
        sessionId
      );
      const { userId, access_token, refresh_token } = user_session;

      try {
        await jwtVerify(access_token);
      } catch {
        const { userId: refreshUserId } = await jwtVerify(refresh_token);
        if (String(refreshUserId) !== String(userId)) {
          return next(new Error("TOKEN_SESSION_MISMATCH"));
        }
        const new_access = await jwtSign(
          { refreshUserId },
          ACCESS_TOKEN_EXPIRESIN
        );
        await userSessionService.updateAccessToken(refreshUserId, new_access);
        (socket.data as any).reissuedAccessToken = new_access;
      }

      const user = await userService.getUserById(userId);
      socket.data.user = user;
      (socket.data as any).sessionId = sessionId;

      return next();
    } catch {
      return next(new Error("AUTH_FAILED"));
    }
  });

  chat.on("connection", (socket) => {
    const user = socket.data.user as any; // { _id, nickname, profile_image, ... }
    const userId = String(user._id);

    // 전역 채널 자동 조인
    socket.join(userKey(userId));

    // 선택: 핸드셰이크 중 재발급된 토큰 통지
    if ((socket.data as any).reissuedAccessToken) {
      socket.emit("auth:reissued", {
        accessToken: (socket.data as any).reissuedAccessToken,
      });
    }

    // 디버그 인사
    socket.emit("sys:hello", { userId, ts: Date.now() });

    // ---- 방 구독: room:join ----
    socket.on(
      "room:join",
      async ({ roomId }: { roomId: string }, ack?: (res: any) => void) => {
        try {
          if (!roomId) return ack?.({ ok: false, code: "VALIDATION_ERROR" });

          // 멤버십 확인
          const m = await roomMembershipService.findByRoomAndUser(
            roomId,
            userId
          ); // TODO
          if (!m || m.leftAt)
            return ack?.({ ok: false, code: "ROOM_NOT_MEMBER" });

          // 최신 seq (sinceSeq) 조회
          const sinceSeq = await roomService.getCurrentSeq(roomId); // TODO: room.seqCounter
          socket.join(roomKey(roomId));
          ack?.({ ok: true, roomId, sinceSeq });
        } catch (e) {
          ack?.({ ok: false, code: "UNKNOWN" });
        }
      }
    );

    // ---- 방 구독 해제: room:leave ----
    socket.on(
      "room:leave",
      ({ roomId }: { roomId: string }, ack?: (res: any) => void) => {
        if (!roomId) return ack?.({ ok: false, code: "VALIDATION_ERROR" });
        socket.leave(roomKey(roomId));
        ack?.({ ok: true });
      }
    );

    // ---- 메시지 전송: message:send ----
    socket.on(
      "message:send",
      async (
        payload: {
          roomId: string;
          type: "text" | "image" | "file";
          content?: string | null;
          attachments?: any[] | null; // 서버 Attachment
          clientMessageId?: string; // 멱등/매칭용(옵션이지만 권장)
        },
        ack?: (res: {
          ok: boolean;
          id?: string;
          seq?: number;
          clientMessageId?: string;
          createdAt?: string;
          code?: string;
        }) => void
      ) => {
        try {
          console.log(
            "[ws] send:",
            payload.roomId,
            "emit to",
            roomKey(payload.roomId)
          );
          const { roomId, type } = payload;
          if (!roomId || !type)
            return ack?.({ ok: false, code: "VALIDATION_ERROR" });

          // 멤버십 검사
          const m = await roomMembershipService.findByRoomAndUser(
            roomId,
            userId
          );
          if (!m || m.leftAt)
            return ack?.({ ok: false, code: "ROOM_NOT_MEMBER" });

          // 멱등 처리(선택): (roomId, clientMessageId)로 기존 메시지 조회
          if (payload.clientMessageId) {
            const existed = await messageService.findByClientId(
              roomId,
              payload.clientMessageId
            ); // TODO
            if (existed) {
              // 이미 생성된 경우 그 값으로 ACK
              return ack?.({
                ok: true,
                id: String(existed._id),
                seq: existed.seq,
                clientMessageId: payload.clientMessageId,
                createdAt: existed.createdAt.toISOString(),
              });
            }
          }

          // seq 발급(원자적 증가) + 메시지 저장
          const { seq, saved, roomAfter } =
            await messageService.createMessageWithSeq({
              roomId,
              authorId: userId,
              type: payload.type,
              content: payload.content ?? null,
              attachments: payload.attachments ?? null,
              clientMessageId: payload.clientMessageId,
            });
          // saved: DB 엔티티 → DTO로 변환
          const dto: MessageDto = {
            id: String(saved._id),
            clientMessageId: saved.clientMessageId,
            roomId,
            seq,
            author: {
              id: userId,
              name: user.nickname,
              avatarUrl: user.profile_image ?? null,
            },
            type: saved.type,
            content: saved.content,
            attachments: saved.attachments ?? null,
            createdAt: saved.createdAt.toISOString(),
            editedAt: saved.editedAt ? saved.editedAt.toISOString() : null,
            deletedAt: saved.deletedAt ? saved.deletedAt.toISOString() : null,
          };

          // 방 스코프 브로드캐스트(본인 포함)
          chat.to(roomKey(roomId)).emit("message:new", dto);

          // 전역(사이드바) 요약 브로드캐스트
          const summary = {
            id: roomId,
            lastMessage:
              dto.type === "text" ? dto.content ?? "" : `[${dto.type}]`,
            lastMessageAt: dto.createdAt,
            memberCount: roomAfter.memberCount, // TODO: messageService에서 함께 리턴 or 별도 조회
            seqCounter: seq, // 최신 시퀀스
          };
          // 모든 멤버에게 전역 채널로 발행 (연결된 유저만 수신)
          const memberIds: string[] =
            await roomMembershipService.getActiveMemberIds(roomId); // TODO
          memberIds.forEach((uid) => {
            chat.to(userKey(uid)).emit("global:roomSummary", summary);
          });

          // ACK
          ack?.({
            ok: true,
            id: dto.id,
            seq,
            clientMessageId: payload.clientMessageId,
            createdAt: dto.createdAt,
          });
        } catch (e) {
          ack?.({ ok: false, code: "UNKNOWN" });
        }
      }
    );

    // ---- 읽음 처리(REST가 업데이트하면 거기서 emit해도 OK)
    socket.on(
      "message:read",
      async ({
        roomId,
        lastReadSeq,
      }: {
        roomId: string;
        lastReadSeq: number;
      }) => {
        if (!roomId) return;
        // DB 업데이트
        await roomMembershipService.updateLastReadSeq(
          roomId,
          userId,
          lastReadSeq
        ); // TODO
        chat.to(roomKey(roomId)).emit("read:updated", {
          roomId,
          userId,
          lastReadSeq,
          lastReadAt: new Date().toISOString(),
        });
      }
    );

    // 타이핑 (휘발)
    socket.on("typing", ({ roomId, on }: { roomId: string; on: boolean }) => {
      if (!roomId) return;
      socket
        .to(roomKey(roomId))
        .volatile.emit("typing", { roomId, userId, on });
    });

    socket.on("disconnect", () => {
      // 필요 시 정리
    });
  });

  return io;
};
