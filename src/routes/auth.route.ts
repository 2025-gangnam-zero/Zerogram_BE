import { Router } from "express";
import { resetPassword, login, logout, oauth, signup } from "../controllers";

export default () => {
  const router = Router();

  router.post("/auth/signup", signup);
  router.get("/auth/oauth", oauth);
  router.post("/auth/login", login);
  router.post("/auth/logout", logout);
  router.post("/auth/reset-password", resetPassword);

  return router;
};
