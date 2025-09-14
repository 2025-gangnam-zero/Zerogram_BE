import { Router } from "express";
import authRoute from "./auth.route";
import userRoute from "./user.route";
import adminRoute from "./admin.route";
import meetingRoute from "./meeting.route";
import roomRoute from "./room.route";

export default () => {
  const router = Router();

  router.use("/", authRoute());
  router.use("/", userRoute());
  router.use("/", meetingRoute());
  router.use("/", adminRoute());
  router.use("/", roomRoute());

  return router;
};
