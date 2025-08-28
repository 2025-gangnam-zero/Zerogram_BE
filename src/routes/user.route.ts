import { Router } from "express";
import {
  createDiet,
  createWorkout,
  deleteDietByEmail,
  deleteMe,
  deleteWorkoutByEmail,
  getDietByEmail,
  getMeetingByEmail,
  getUserInfo,
  getWorkoutByEmail,
  getWorkoutsByEmail,
  updateDietByEmail,
  updateMe,
  updateWorkoutByEmail,
} from "../controllers";

export default () => {
  const router = Router();

  router.get("/users/me", getUserInfo);
  router.patch("/users/me", updateMe);
  router.delete("/users/me", deleteMe);
  router.get("/users/me/workouts", getWorkoutsByEmail);
  router.post("/users/me/workouts", createWorkout);
  router.get("/users/me/workouts/:workoutid", getWorkoutByEmail);
  router.patch("/users/me/workouts/:workoutid", updateWorkoutByEmail);
  router.delete("/users/me/workouts/:workoutid", deleteWorkoutByEmail);
  router.get("/users/me/diets", getDietByEmail);
  router.post("/users/me/diets", createDiet);
  router.get("/users/me/diets/:dietid", getDietByEmail);
  router.patch("/users/me/diets/:dietid", updateDietByEmail);
  router.delete("/users/me/diets/:dietid", deleteDietByEmail);
  router.get("/users/me/meetings", getMeetingByEmail);

  return router;
};
