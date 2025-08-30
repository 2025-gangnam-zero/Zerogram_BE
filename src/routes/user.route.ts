import { Router } from "express";
import {
  createDiet,
  createWorkout,
  deleteDietById,
  deleteMe,
  deleteWorkoutById,
  getDietById,
  getMeetingByEmail,
  getUserInfo,
  getWorkoutById,
  getWorkoutListById,
  updateDietById,
  updateMe,
  updateWorkoutById,
} from "../controllers";

export default () => {
  const router = Router();

  router.get("/users/me", getUserInfo);
  router.patch("/users/me", updateMe);
  router.delete("/users/me", deleteMe);
  router.get("/users/me/workouts", getWorkoutListById);
  router.post("/users/me/workouts", createWorkout);
  router.get("/users/me/workouts/:workoutid", getWorkoutById);
  router.patch("/users/me/workouts/:workoutid", updateWorkoutById);
  router.delete("/users/me/workouts/:workoutid", deleteWorkoutById);
  router.get("/users/me/diets", getDietById);
  router.post("/users/me/diets", createDiet);
  router.get("/users/me/diets/:dietid", getDietById);
  router.patch("/users/me/diets/:dietid", updateDietById);
  router.delete("/users/me/diets/:dietid", deleteDietById);
  router.get("/users/me/meetings", getMeetingByEmail);

  return router;
};
