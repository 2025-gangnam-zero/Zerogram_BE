import { Router } from "express";
import {
  createDiet,
  createWorkout,
  deleteDietById,
  deleteMe,
  deleteWorkoutById,
  getDietById,
  getUserInfo,
  getWorkoutById,
  getWorkoutListById,
  updateDietFeedbackById,
  updateMe,
  updateWorkoutById,
  getMeetingListByUserId,
  createWorkoutDetail,
  getWorkoutDetail,
  updateWorkoutDetail,
  deleteWorkoutDetail,
} from "../controllers";
import { authChecker } from "../middlewares";
import { upload } from "../utils";

export default () => {
  const router = Router();

  router.get("/users/me", authChecker, getUserInfo);
  router.patch(
    "/users/me",
    authChecker,
    upload.single("profile_image"),
    updateMe
  );
  router.delete("/users/me", authChecker, deleteMe);
  router.get("/users/me/workouts", authChecker, getWorkoutListById);
  router.post("/users/me/workouts", createWorkout);
  router.get("/users/me/workouts/:workoutid", getWorkoutById);
  router.post("/users/me/workouts/:workoutid", createWorkoutDetail);
  router.patch("/users/me/workouts/:workoutid", updateWorkoutById);
  router.delete("/users/me/workouts/:workoutid", deleteWorkoutById);
  // 운동일지 상세 조회
  router.get(
    "/users/me/workouts/:workoutid/detail/:detailid",
    getWorkoutDetail
  );
  // 운동일지 상세 수정
  router.patch(
    "/users/me/workouts/:workoutid/detail/:detailid",
    updateWorkoutDetail
  );
  // 운동일지 상세 삭제
  router.delete(
    "/users/me/workouts/:workoutid/detail/:detailid",
    deleteWorkoutDetail
  );
  router.get("/users/me/diets", getDietById);
  router.post("/users/me/diets", createDiet);
  router.get("/users/me/diets/:dietid", getDietById);
  router.patch("/users/me/diets/:dietid", updateDietFeedbackById);
  router.delete("/users/me/diets/:dietid", deleteDietById);
  router.get("/users/me/meetings", getMeetingListByUserId);

  return router;
};
