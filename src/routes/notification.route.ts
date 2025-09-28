import { getNotifications } from "../controllers";
import { Router } from "express";
import { authChecker } from "../middlewares";

export default () => {
  const router = Router();

  router.get("/notifications", authChecker, getNotifications);

  return router;
};
