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
  updateDietById,
  updateMe,
  getMeetingListByUserId,
  createWorkoutDetail,
  getWorkoutDetail,
  updateWorkoutDetail,
  deleteWorkoutDetail,
  deleteFitnessDetail,
  addFitnessDetail,
  updateFitnessDetail,
  updateWorkout,
  getDietListById,
  createMeal,
  createFood,
  deleteProfileImage,
  deleteMealById,
  deleteFoodById,
  updateMeal,
  updateFood,
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
  router.delete("/users/me/profile-image", authChecker, deleteProfileImage);
  // --------------------------------------------------------------------------
  // 운동일지 목록 조회
  router.get("/users/me/workouts", authChecker, getWorkoutListById);

  // 운동일지 생성
  router.post("/users/me/workouts", authChecker, createWorkout);

  // 운동일지 조회
  router.get("/users/me/workouts/:workoutid", authChecker, getWorkoutById);

  // 운동일지 상세 생성
  router.post(
    "/users/me/workouts/:workoutid",
    authChecker,
    createWorkoutDetail
  );

  // 운동일지 피트니스 상세 생성
  router.post(
    "/users/me/workouts/:workoutid/details/:detailid",
    addFitnessDetail
  );

  // 운동일지 상세 조회
  router.get(
    "/users/me/workouts/:workoutid/details/:workoutdetailid",
    authChecker,
    getWorkoutDetail
  );

  // 운동일지 수정
  router.patch("/users/me/workouts/:workoutid", authChecker, updateWorkout);

  // 운동일지 상세 수정
  router.patch(
    "/users/me/workouts/:workoutid/details/:workoutdetailid",
    authChecker,
    updateWorkoutDetail
  );

  // 피트니스 상세 수정
  router.patch(
    "/users/me/workouts/:workoutid/details/:detailid/fitnessdetails/:fitnessid",
    authChecker,
    updateFitnessDetail
  );

  // 운동일지 삭제
  router.delete(
    "/users/me/workouts/:workoutid",
    authChecker,
    deleteWorkoutById
  );

  // 운동일지 상세 삭제
  router.delete(
    "/users/me/details/:detailid",
    authChecker,
    deleteWorkoutDetail
  );
  // 운동일지 피트니스 상세 삭제
  router.delete(
    "/users/me/fitnessdetails/:fitnessdetailid",
    authChecker,
    deleteFitnessDetail
  );

  // --------------------------------------------------------------------------
  // 사용자의 한 달간 식단 일지 조회
  router.get("/users/me/diets", authChecker, getDietListById);

  // 식단 일지 생성
  router.post("/users/me/diets", authChecker, createDiet);

  // 식단 일지 meal 생성 + 추가
  router.post("/users/me/diets/:dietid", authChecker, createMeal);

  // 식단 일지 food 생성 + 추가
  router.post("/users/me/diets/:dietid/meals/:mealid", authChecker, createFood);

  // 개별 식단 일지 조회 => 사용 안함
  router.get("/users/me/diets/:dietid", authChecker, getDietById);

  // 식단 수정
  router.patch("/users/me/diets/:dietid", authChecker, updateDietById);

  // meal 수정
  router.patch(
    "/users/me/diets/:dietid/meals/:mealid",
    authChecker,
    updateMeal
  );

  // food 수정
  router.patch(
    "/users/me/diets/:dietid/meals/:mealid/foods/:foodid",
    authChecker,
    updateFood
  );

  // 식단 삭제
  router.delete("/users/me/diets/:dietid", authChecker, deleteDietById);

  // meal 삭제
  router.delete(
    "/users/me/diets/:dietid/meals/:mealid",
    authChecker,
    deleteMealById
  );

  // food 삭제
  router.delete(
    "/users/me/diets/:dietid/meals/:mealid/foods/:foodid",
    authChecker,
    deleteFoodById
  );

  // --------------------------------------------------------------------
  router.get("/users/me/meetings", authChecker, getMeetingListByUserId);

  return router;
};
