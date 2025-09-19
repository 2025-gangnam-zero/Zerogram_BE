import { Router } from "express";
import {
  createComment,
  createMeet,
  deleteComment,
  deleteMeet,
  getMeet,
  getMeetList,
  toggleCrew,
  updateComment,
  updateMeet,
} from "../controllers";
import { authChecker } from "../middlewares";
import { upload } from "../utils";
import { IMAGE_MAX_COUNT } from "../constants";

export default () => {
  const router = Router();

  // 모집글 목록 조회
  router.get("/meets", authChecker, getMeetList);

  // 모집글 생성
  router.post(
    "/meets",
    authChecker,
    upload.array("images", IMAGE_MAX_COUNT),
    createMeet
  );

  // 모집글 상세 조회
  router.get("/meets/:meetid", authChecker, getMeet);

  // 모집글 수정
  router.patch(
    "/meets/:meetid",
    authChecker,
    upload.array("newImages", IMAGE_MAX_COUNT),
    updateMeet
  );

  // 모집글 삭제
  router.delete("/meets/:meetid", authChecker, deleteMeet);

  // 댓글 생성
  router.post("/meets/:meetid/comments", authChecker, createComment);

  // 댓글 수정
  router.patch(
    "/meets/:meetid/comments/:commentid",
    authChecker,
    updateComment
  );

  // 댓글 삭제
  router.delete(
    "/meets/:meetid/comments/:commentid",
    authChecker,
    deleteComment
  );

  // 참여자 추가/삭제
  router.post("/meets/:meetid/crews", authChecker, toggleCrew);

  return router;
};
