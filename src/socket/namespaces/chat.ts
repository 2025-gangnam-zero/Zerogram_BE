import type { Namespace, Socket } from "socket.io";
import mongoose from "mongoose";
import { AttachmentState, ChatUser, SendAck, SendPayload } from "../../types";
import { messageService, roomMembershipService } from "../../services";
import { deleteImages, uploadFromBuffer } from "../../utils";
import { socketRooms } from "../../socket/socketRooms";
import { Room, RoomMembership } from "../../models";
// ❌ 정적 import 제거: import { fileTypeFromBuffer } from "file-type";

// ✅ ESM 전용 패키지(file-type)를 CJS 빌드에서 쓰기 위한 호환 래퍼
type FileTypeResult = { ext: string; mime: string };
let _fileTypeFromBuffer:
  | ((buf: Buffer) => Promise<FileTypeResult | undefined>)
  | null = null;

async function fileTypeFromBufferCompat(buf: Buffer) {
  if (!_fileTypeFromBuffer) {
    const mod: any = await eval('import("file-type")'); // ESM 동적 import
    _fileTypeFromBuffer = mod.fileTypeFromBuffer;
    if (typeof _fileTypeFromBuffer !== "function") {
      throw new Error("file-type: fileTypeFromBuffer not available");
    }
  }
  return _fileTypeFromBuffer(buf);
}

const MAX_FILES = 4; // 🔸 요구사항
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 필요 시 조정
const ALLOWED = [
  // 🔸 허용 MIME
  /^image\//,
  /^video\//,
  /^application\/pdf$/,
  /^application\/zip$/,
  /^text\//,
];

const makeId = () =>
  `svr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** ─────────────────────────────────────────────────────────
 * 로깅/중복조인 유틸
 * ───────────────────────────────────────────────────────── */
function makeLogger(socket: Socket) {
  const sid = socket.id;
  const uid = (socket.data as any)?.user?.userId ?? "anon";
  const pfx = `[chat][sid=${sid}][uid=${uid}]`;
  return {
    info: (...args: any[]) => console.log(pfx, ...args),
    warn: (...args: any[]) => console.warn(pfx, ...args),
    error: (...args: any[]) => console.error(pfx, ...args),
  };
}

function getJoinedRoomsSet(socket: Socket): Set<string> {
  if (!(socket.data as any).joinedRooms) {
    (socket.data as any).joinedRooms = new Set<string>();
  }
  return (socket.data as any).joinedRooms as Set<string>;
}

/** (옵션) 멤버십 검증 훅 포인트
 * 실제 서비스 함수가 준비되면 아래 형태로 주입해서 사용하세요.
 * ex) if (await roomMembershipService.isMember(roomId, author.userId)) { ... }
 */
// async function isMember(roomId: string, userId: string): Promise<boolean> {
//   return true;
// }

export const registerChatNamespace = (nsp: Namespace) => {
  nsp.on("connection", (socket: Socket) => {
    const log = makeLogger(socket);

    const sid = (socket.data as any).sessionId as string;
    const author = ((socket.data as any).user || { id: sid }) as ChatUser;

    // 개인 알림 룸(join 은 그대로 유지)
    // ✅ 개인 알림 채널 조인 (접속자 전용)
    if (author?.userId) {
      socket.join(socketRooms.user(author.userId));
    }
    // const userRoom = `user:${author.userId}`;
    // socket.join(userRoom);
    // log.info("joined personal room", userRoom);

    /** ───────────────── room:join ───────────────── */
    socket.on(
      "room:join",
      async ({ roomId } = {} as any, ack?: (r: SendAck) => void) => {
        try {
          if (!roomId || !mongoose.isValidObjectId(roomId)) {
            return ack?.({ ok: false, error: "INVALID_ROOM_ID" });
          }

          const joined = getJoinedRoomsSet(socket);
          if (joined.has(roomId)) {
            // 멱등 처리: 이미 조인되어 있으면 노옵
            return ack?.({ ok: true, message: "ALREADY_JOINED" } as any);
          }

          // (옵션) 멤버십 검증: 서비스 함수 연결 시 여기에 추가
          const ok = await roomMembershipService.isMember(
            new mongoose.Types.ObjectId(roomId),
            new mongoose.Types.ObjectId(author.userId)
          );
          if (!ok) return ack?.({ ok: false, error: "FORBIDDEN_NOT_A_MEMBER" });

          await socket.join(roomId);
          joined.add(roomId);

          // 본인 제외 브로드캐스트
          socket.to(roomId).emit("room:userJoined", { roomId, author });

          ack?.({ ok: true });
          log.info("room:join ok", roomId);
        } catch (err: any) {
          log.error("room:join error:", err?.message ?? err);
          ack?.({ ok: false, error: "JOIN_FAILED" });
        }
      }
    );

    /** ───────────────── room:leave ───────────────── */
    socket.on(
      "room:leave",
      async ({ roomId } = {} as any, ack?: (r: SendAck) => void) => {
        try {
          if (!roomId || !mongoose.isValidObjectId(roomId)) {
            return ack?.({ ok: false, error: "INVALID_ROOM_ID" });
          }

          const joined = getJoinedRoomsSet(socket);
          if (!joined.has(roomId)) {
            // 조인 상태가 아니면 노옵
            return ack?.({ ok: true, message: "NOT_JOINED" } as any);
          }

          await socket.leave(roomId);
          joined.delete(roomId);

          socket.to(roomId).emit("room:userLeft", { roomId, author });

          ack?.({ ok: true });
          log.info("room:leave ok", roomId);
        } catch (err: any) {
          log.error("room:leave error:", err?.message ?? err);
          ack?.({ ok: false, error: "LEAVE_FAILED" });
        }
      }
    );

    /** ───────────── 메시지 전송 + DB 영속화 ───────────── */
    socket.on(
      "message:send",
      async (
        {
          roomId,
          text,
          attachments = [],
          serverId: clientServerId,
        }: SendPayload = {} as any,
        ack?: (r: SendAck) => void
      ) => {
        const uploadedUrls: string[] = []; // 👈 롤백용(URL로 보관: deleteImages가 URL을 받음)
        try {
          if (!roomId || !mongoose.isValidObjectId(roomId)) {
            return ack?.({ ok: false, error: "INVALID_ROOM_ID" });
          }

          const isMem = await roomMembershipService.isMember(
            new mongoose.Types.ObjectId(roomId),
            new mongoose.Types.ObjectId(author.userId)
          );
          if (!isMem) {
            return ack?.({ ok: false, error: "FORBIDDEN_NOT_A_MEMBER" });
          }

          const trimmed = text?.trim();
          const hasText = !!trimmed;
          const hasFiles = Array.isArray(attachments) && attachments.length > 0;
          if (!hasText && !hasFiles) {
            return ack?.({ ok: false, error: "EMPTY_CONTENT" });
          }
          if (hasFiles && attachments.length > MAX_FILES) {
            return ack?.({ ok: false, error: "TOO_MANY_FILES" });
          }

          const uploaded: AttachmentState[] = [];
          if (hasFiles) {
            for (const a of attachments) {
              if (!a?.data || typeof a.size !== "number") {
                return ack?.({ ok: false, error: "INVALID_FILE" });
              }
              if (a.size > MAX_FILE_SIZE) {
                return ack?.({
                  ok: false,
                  error: `FILE_TOO_LARGE:${a.fileName}`,
                });
              }

              const buf = Buffer.from(a.data);
              // ❌ const sniff = await fileTypeFromBuffer(buf);
              const sniff = await fileTypeFromBufferCompat(buf); // ✅ 교체
              const mime = sniff?.mime || a.contentType || "";
              const allowed = ALLOWED.some((re) => re.test(mime));
              if (!allowed) {
                return ack?.({
                  ok: false,
                  error: `BLOCKED_MIME:${mime || "unknown"}`,
                });
              }

              // 👇 멀터 대신 버퍼 업로드
              const { fileUrl } = await uploadFromBuffer({
                buffer: buf,
                fileName: a.fileName,
                contentType: mime,
                // prefix: "chat", // 필요 시 변경
              });

              uploadedUrls.push(fileUrl);

              uploaded.push({
                fileUrl,
                fileName: a.fileName,
                contentType: mime,
                size: a.size,
                width: a.width,
                height: a.height,
              });
            }
          }

          const serverId = clientServerId?.trim() || makeId();
          const roomObjId = new mongoose.Types.ObjectId(roomId);
          const authorObjId = new mongoose.Types.ObjectId(author.userId);

          const saved = await messageService.sendMessage({
            roomId: roomObjId,
            authorId: authorObjId,
            author,
            serverId,
            text: hasText ? String(trimmed) : undefined,
            attachments: uploaded,
          });

          nsp.to(roomId).emit("message:new", {
            id: saved.id,
            serverId: saved.serverId,
            roomId: saved.roomId,
            authorId: saved.authorId,
            author: saved.author,
            text: saved.text ?? "",
            attachments: saved.attachments ?? [],
            seq: saved.seq,
            createdAt: saved.createdAtIso,
            meta: saved.meta,
          });

          // ✅ 추가: “방 단위 1개 알림” 최신 합산값을 멤버에게 전송
          try {
            const room = await Room.findById(roomId).lean();
            if (room) {
              const members = await RoomMembership.find({
                roomId: room._id,
              }).lean();
              for (const mem of members) {
                const unread = Math.max(
                  0,
                  (room.seqCounter ?? 0) - (mem.lastReadSeq ?? 0)
                );
                nsp
                  .to(socketRooms.user(String(mem.userId)))
                  .emit("notify:update", {
                    roomId: String(room._id),
                    roomName: room.roomName,
                    lastMessage: room.lastMessage,
                    lastMessageAt: room.lastMessageAt
                      ? new Date(room.lastMessageAt).toISOString()
                      : undefined,
                    unread,
                  });
              }
            }
          } catch (e) {
            console.error("[notify] broadcast error:", e);
          }

          return ack?.({
            ok: true,
            id: saved.id,
            serverId: saved.serverId,
            createdAt: saved.createdAtIso,
            seq: saved.seq, // ✅ 포함
            attachments: saved.attachments ?? uploaded,
          });
        } catch (err: any) {
          if (uploadedUrls.length) {
            try {
              await deleteImages(uploadedUrls);
            } catch (e) {
              console.error("rollback(deleteImages) error:", e);
            }
          }
          console.error("message:send error:", err);
          return ack?.({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
        }
      }
    );
  });
};
