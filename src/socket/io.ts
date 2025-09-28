import type { Server } from "socket.io";
let _io: Server | null = null;

export const setIo = (io: Server) => {
  _io = io;
};
export const getIo = (): Server => {
  if (!_io) throw new Error("Socket.IO is not initialized");
  return _io!;
};
