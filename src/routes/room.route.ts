import { Router } from "express";
import { authChecker } from "../middlewares";
import {
  createRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  listMyJoinedRooms,
  listPublicRooms,
} from "../controllers";

export default () => {
  const router = Router();

  // 내 방 목록
  router.get("/rooms", authChecker, listMyJoinedRooms);

  // 공개 방 목록 (테스트용, 나중에 제거 가능)
  router.get("/rooms/public", listPublicRooms);

  // 방 생성
  router.post("/rooms", authChecker, createRoom);

  // 방 가입 (테스트용, 나중에 제거 가능)
  router.post("/rooms/:roomId/join", authChecker, joinRoom);

  router.post("/rooms/:roomId/leave", authChecker, leaveRoom);

  // 방 삭제
  router.delete("/rooms/:roomId", authChecker, deleteRoom);

  return router;
};
