import { Router } from "express";
import {
  addParticipant,
  createMeeting,
  createReply,
  deleteMeetingById,
  deleteParticipant,
  deleteReply,
  getMeetingById,
  getMeetingList,
  updateMeetingById,
  updateReply,
} from "../controllers";

export default () => {
  const router = Router();

  router.get("/meetings", getMeetingList);
  router.post("/meetings", createMeeting);
  router.get("/meetings/:meetingid", getMeetingById);
  router.patch("/meetings/:meetingid", updateMeetingById);
  router.delete("/meetings/:meetingid", deleteMeetingById);
  router.post("/meetings/:meetingid/replies", createReply);
  router.patch("/meetings/:meetingid/replies/:replyid", updateReply);
  router.delete("/meetings/:meetingid/replies/:replyid", deleteReply);
  router.patch("/meetings/:meetingid/participants", addParticipant);
  router.delete("/meetings/:meetingid/participants", deleteParticipant);

  return router;
};
