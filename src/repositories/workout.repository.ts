import { mongoDBErrorHandler } from "../utils";
import {
  WorkoutDetailCreateDto,
  WorkoutDetailState,
  WorkoutState,
} from "../types";
import { Workout, WorkoutDetail } from "../models";
import { Types } from "mongoose";

class WorkoutRepository {
  // 운동일지 아이디를 이용한 운동일지 조회
  async getWorkoutById(workoutId: Types.ObjectId) {
    try {
      const workout = await Workout.findById({ _id: workoutId }).lean();

      return workout;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutById", error);
    }
  }

  // 사용자 운동일지 조회
  async getWoroutListByUserId(userId: Types.ObjectId) {
    try {
      const workouts = await Workout.aggregate([
        // 1. 사용자 필터
        { $match: { userId } },

        // 2. WorkoutDetail 조인
        {
          $lookup: {
            from: "workoutdetails", // 실제 컬렉션 이름 (모델명 X)
            localField: "details",
            foreignField: "_id",
            as: "details",
          },
        },

        // 3. 정렬 (원하는 기준)
        { $sort: { createdAt: -1 } },

        // 4. 필요한 필드만 선택
        {
          $project: {
            _id: 1,
            userId: 1,
            createdAt: 1,
            details: {
              _id: 1,
              workout_name: 1,
              duration: 1,
              calories: 1,
              feedback: 1,
              body_part: 1,
              fitness_type: 1,
              sets: 1,
              reps: 1,
              weight: 1,
              avg_pace: 1,
              distance: 1,
            },
          },
        },
      ]);

      return workouts;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutListByUserId", error);
    }
  }

  // 운동일지 생성
  async createWorkout(userId: Types.ObjectId): Promise<WorkoutState> {
    try {
      const newWorkout = await Workout.create({ userId });

      return newWorkout;
    } catch (error) {
      throw mongoDBErrorHandler("createWorkout", error);
    }
  }

  // 운동 일지 상세 생성
  async createWorkoutDetail(workoutDetail: WorkoutDetailCreateDto) {
    try {
      const newDetail = await WorkoutDetail.create(workoutDetail);

      return newDetail;
    } catch (error) {
      throw mongoDBErrorHandler("createWorkoutDetail", error);
    }
  }

  // 운동 일지 상세 추가
  async addWorkoutDetail(
    workoutId: Types.ObjectId,
    details: WorkoutDetailState[]
  ) {
    try {
      const workoutDetail = await Workout.findOneAndUpdate(
        { _id: workoutId },
        {
          $addToSet: {
            details,
          },
        },
        {
          new: true,
        }
      );

      return workoutDetail;
    } catch (error) {
      throw mongoDBErrorHandler("addWorkoutDetail", error);
    }
  }

  // 운동일지 상세 조회
  async getWorkoutDetailById(workoutDetailId: Types.ObjectId) {
    try {
      const workoutDetail = await WorkoutDetail.findById({
        _id: workoutDetailId,
      }).lean();

      return workoutDetail;
    } catch (error) {
      throw mongoDBErrorHandler("getWorkoutDetailById", error);
    }
  }

  // 운동일지 상셍 수정
  async updateWorkoutDetail(workoutDetail: WorkoutDetailState) {
    try {
      const detail = await Workout.findOneAndUpdate(
        {
          _id: workoutDetail._id,
        },
        {
          $set: {
            ...workoutDetail,
          },
        },
        {
          new: true,
        }
      );

      return detail;
    } catch (error) {
      throw mongoDBErrorHandler("updateWorkoutDetail", error);
    }
  }

  // 운동일지 삭제
  async deleteWorkout(workoutId: Types.ObjectId) {
    try {
      const result = await Workout.deleteOne({ _id: workoutId });

      return result;
    } catch (error) {
      throw mongoDBErrorHandler("deleteWorkout", error);
    }
  }
}

export default new WorkoutRepository();
