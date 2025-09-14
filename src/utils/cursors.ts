import { Types } from "mongoose";
import { Buffer } from "node:buffer";

export type RoomsCursorPayload = {
  lastMessageAt: string | null; // ISO string or null
  id: Types.ObjectId;
};

export function encodeCursor(payload: RoomsCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): RoomsCursorPayload {
  const json = Buffer.from(cursor, "base64url").toString("utf8");
  return JSON.parse(json) as RoomsCursorPayload;
}
