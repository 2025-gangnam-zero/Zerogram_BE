import { Router } from "express";
import authRoute from "./auth.route";
import userRoute from "./user.route";
import adminRoute from "./admin.route";
import meetingRoute from "./meeting.route";
import meetRoute from "./meet.route";
import roomRoute from "./room.route";
import notificationRoute from "./notification.route";

export default () => {
  const router = Router();

  router.use("/", authRoute());
  router.use("/", userRoute());
  router.use("/", meetingRoute());
  router.use("/", adminRoute());
  router.use("/", meetRoute());
  router.use("/", roomRoute());

  router.use("/", notificationRoute());
  return router;
};
