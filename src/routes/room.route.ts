import { Router } from "express";
import { authChecker } from "../middlewares";
import { getRoomsByUserId } from "../controllers";

export default () => {
  const router = Router();

  router.get("/rooms", authChecker, getRoomsByUserId);

  return router;
};
