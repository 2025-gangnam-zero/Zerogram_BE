import { Router } from "express";
import {
  deleteMeetingById,
  deleteReplyById,
  deleteUserByEmail,
  getAllInfo,
  getMeetingById,
  getReplyById,
  getUserInfoByUserId,
} from "../controllers";

export default () => {
  const router = Router();

  router.get("/admin/", getAllInfo);
  router.get("/admin/users/:email", getUserInfoByUserId);
  router.get("/admin/users/:email/meetings/:meetingid", getMeetingById);
  router.get(
    "/admin/users/:email/meetings/:meetingid/replies/:replyid",
    getReplyById
  );
  router.delete("/admin/users/:email", deleteUserByEmail);
  router.delete("/admin/users/:email/meetings/:meetingid", deleteMeetingById);
  router.delete(
    "/admin/users/:email/meetings/:meetingid/replies/:replyid",
    deleteReplyById
  );

  return router;
};
