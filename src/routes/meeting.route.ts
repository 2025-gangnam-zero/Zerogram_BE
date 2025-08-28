import { Router } from "express";
import {
  addParticipant,
  createMeeting,
  createReply,
  deleteMeetingByEmail,
  deleteParticipant,
  deleteReply,
  getMeetingByEmail,
  getMeetings,
  updateMeetingByEmail,
  updateReply,
} from "../controllers";

export default () => {
  const router = Router();

  router.get("/meetings", getMeetings);
  router.post("/meetings", createMeeting);
  router.get("/meetings/:meetingid", getMeetingByEmail);
  router.patch("/meetings/:meetingid", updateMeetingByEmail);
  router.delete("/meetings/:meetingid", deleteMeetingByEmail);
  router.post("/meetings/:meetingid/replies", createReply);
  router.patch("/meetings/:meetingid/replies/:replyid", updateReply);
  router.delete("/meetings/:meetingid/replies/:replyid", deleteReply);
  router.patch("/meetings/:meetingid/participants", addParticipant);
  router.delete("/meetings/:meetingid/participants", deleteParticipant);

  return router;
};
