import { Router } from "express";
import {
  deleteMeetingById,
  deleteReplyById,
  deleteUserByEmail,
  getAllInfo,
  getMeetingById,
  getReplyById,
  getUserInfoByEmail,
} from "../controllers";

export default () => {
  const router = Router();

  router.get("/admin/", getAllInfo);
  router.get("/admin/users/:email", getUserInfoByEmail);
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
