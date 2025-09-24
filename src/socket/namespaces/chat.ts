import type { Namespace, Socket } from "socket.io";
import mongoose from "mongoose";
import { AttachmentState, ChatUser, SendAck, SendPayload } from "../../types";
import { messageService } from "../../services";
import { deleteImages, uploadFromBuffer } from "../../utils";
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
          if (!roomId) return ack?.({ ok: false, error: "INVALID_ROOM_ID" });

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
