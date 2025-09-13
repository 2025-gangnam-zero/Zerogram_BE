import { Router } from "express";
import {
  resetPassword,
  login,
  logout,
  oauth,
  signup,
  verifyPassword,
} from "../controllers";
import { authChecker } from "../middlewares";

export default () => {
  const router = Router();

  router.post("/auth/signup", signup);
  router.get("/auth/oauth", oauth);
  router.post("/auth/login", login);
  router.post("/auth/logout", authChecker, logout);
  router.post("/auth/verify-password", verifyPassword);
  router.post("/auth/reset-password", resetPassword);

  return router;
};
