import { Router } from "express";
import { authChecker } from "../middlewares";
import {
  getMyRooms,
  getRoom,
  getRoomNotice,
  updateRoomNotice,
  leaveRoom,
  listRoomMembers,
  commitRead,
  getUnreadCount,
  getMessages,
  deleteMessage,
  deleteRoomNotice,
} from "../controllers";

export default () => {
  const router = Router();

  // 내 방 목록
  router.get("/rooms/mine", authChecker, getMyRooms);

  // 방 상세
  router.get("/rooms/:roomid", authChecker, getRoom);

  // 공지
  router.get("/rooms/:roomid/notice", authChecker, getRoomNotice);
  router.put("/rooms/:roomid/notice", authChecker, updateRoomNotice);
  router.delete("/rooms/:roomid/notice", authChecker, deleteRoomNotice);

  // 멤버
  router.get("/rooms/:roomid/members", authChecker, listRoomMembers);

  // 읽음/미읽음
  router.post("/rooms/:roomid/read", authChecker, commitRead);
  router.get("/rooms/:roomid/unread-count", authChecker, getUnreadCount);

  // 메시지
  router.get("/rooms/:roomid/messages", authChecker, getMessages);
  router.delete(
    "/rooms/:roomid/messages/:messageid",
    authChecker,
    deleteMessage
  );

  // 나가기
  router.post("/rooms/:roomid/leave", authChecker, leaveRoom);

  return router;
};
