import { ClientSession, Types } from "mongoose";
import { Diet, Meal, Workout } from "../models";
import {
  DietCreateResponseDto,
  MealResponseDto,
  WorkoutResponseDto,
} from "../dtos";

// 존재하지 않을 수 있으니 | null 반환을 권장합니다.
export async function aggregateGetWorkoutById(
  workoutId: Types.ObjectId
): Promise<WorkoutResponseDto | null> {
  const result = await Workout.aggregate([
    { $match: { _id: workoutId } },

    // date 필드 보강: 저장돼 있으면 그대로, 없으면 createdAt(KST)로 계산
    {
      $addFields: {
        date: {
          $ifNull: [
            "$date",
            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Seoul",
              },
            },
          ],
        },
      },
    },

    {
      $lookup: {
        from: "workoutdetails",
        localField: "details",
        foreignField: "_id",
        as: "details",
        pipeline: [
          {
            $lookup: {
              from: "fitnessdetails",
              localField: "fitnessDetails",
              foreignField: "_id",
              as: "fitnessDetails",
            },
          },
          {
            $project: {
              _id: 1,
              workoutId: 1,
              workout_name: 1,
              duration: 1,
              calories: 1,
              feedback: 1,
              avg_pace: 1,
              distance: 1,
              createdAt: 1,
              updatedAt: 1,
              fitnessDetails: {
                $map: {
                  input: "$fitnessDetails",
                  as: "f",
                  in: {
                    _id: "$$f._id",
                    body_part: "$$f.body_part",
                    fitness_type: "$$f.fitness_type",
                    sets: "$$f.sets",
                    reps: "$$f.reps",
                    weight: "$$f.weight",
                    createdAt: "$$f.createdAt",
                    updatedAt: "$$f.updatedAt",
                  },
                },
              },
            },
          },
        ],
      },
    },

    // 최종 형태 정리 (WorkoutResponseDto)
    {
      $project: {
        _id: 1,
        userId: 1,
        createdAt: 1,
        updatedAt: 1,
        date: 1, // 👈 추가됨
        details: 1,
      },
    },
    { $limit: 1 },
  ]);

  return (result[0] as WorkoutResponseDto) || null;
}

/** "YYYY-MM-01" ~ "다음달-01" 범위를 문자열로 생성 */
function getMonthStringRange(year: number, month1to12: number) {
  const yyyy = String(year);
  const mm = String(month1to12).padStart(2, "0");

  const start = `${yyyy}-${mm}-01`;
  const nextY = month1to12 === 12 ? year + 1 : year;
  const nextM = month1to12 === 12 ? 1 : month1to12 + 1;
  const end = `${String(nextY)}-${String(nextM).padStart(2, "0")}-01`;

  return { start, end };
}

/**
 * 특정 "년/월"의 Workout 목록을 date(YYYY-MM-DD 문자열)로 조회
 * - 반환: WorkoutResponseDto[]
 * - 호환: date 누락 문서는 createdAt(KST)로 계산해 매칭
 */
export async function aggregateGetWorkoutsByUserIdForMonth(
  userId: Types.ObjectId,
  year: number,
  month1to12: number
): Promise<WorkoutResponseDto[]> {
  const { start, end } = getMonthStringRange(year, month1to12);

  const result = await Workout.aggregate([
    { $match: { userId } },

    // 1) _date 계산: date 있으면 그대로, 없으면 createdAt을 KST 기준 YYYY-MM-DD로 변환
    {
      $addFields: {
        _date: {
          $ifNull: [
            "$date",
            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Seoul",
              },
            },
          ],
        },
      },
    },

    // 2) 문자열 범위 매칭: "YYYY-MM-DD"는 사전식 정렬이 날짜 순과 동일
    { $match: { _date: { $gte: start, $lt: end } } },

    // 3) details → WorkoutDetail, fitnessDetails → FitnessDetail 조인
    {
      $lookup: {
        from: "workoutdetails",
        localField: "details",
        foreignField: "_id",
        as: "details",
        pipeline: [
          {
            $lookup: {
              from: "fitnessdetails",
              localField: "fitnessDetails",
              foreignField: "_id",
              as: "fitnessDetails",
            },
          },
          // WorkoutDetailDto 모양으로 정리
          {
            $project: {
              _id: 1,
              workoutId: 1,
              workout_name: 1,
              duration: 1,
              calories: 1,
              feedback: 1,
              avg_pace: 1,
              distance: 1,
              createdAt: 1,
              updatedAt: 1,
              fitnessDetails: {
                $map: {
                  input: "$fitnessDetails",
                  as: "f",
                  in: {
                    _id: "$$f._id",
                    body_part: "$$f.body_part",
                    fitness_type: "$$f.fitness_type",
                    sets: "$$f.sets",
                    reps: "$$f.reps",
                    weight: "$$f.weight",
                    createdAt: "$$f.createdAt",
                    updatedAt: "$$f.updatedAt",
                  },
                },
              },
            },
          },
        ],
      },
    },

    // 4) 최종 응답 형태(WorkoutResponseDto)로 정리
    {
      $project: {
        _id: 1,
        userId: 1,
        createdAt: 1,
        updatedAt: 1,
        date: "$_date", // ← date 문자열로 반환
        details: 1,
      },
    },

    // 5) 최신순 정렬 (date → createdAt 보조)
    { $sort: { date: -1, createdAt: -1 } },
  ]);

  return result as WorkoutResponseDto[];
}

export async function aggregateGetDietById(
  dietId: Types.ObjectId,
  session?: ClientSession
): Promise<DietCreateResponseDto | null> {
  const [doc] = await Diet.aggregate(
    [
      { $match: { _id: dietId } },

      // date 필드 보강: 저장돼 있으면 그대로, 없으면 createdAt(KST)로 계산
      {
        $addFields: {
          date: {
            $ifNull: [
              "$date",
              {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Seoul",
                },
              },
            ],
          },
        },
      },

      // meals 조인 (Diet.meals 순서 유지)
      {
        $lookup: {
          from: "meals",
          let: { mealIds: "$meals" }, // Diet.meals: ObjectId[]
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$mealIds"] } } },
            // Diet.meals 배열의 원래 순서 보존을 위한 인덱스 부여
            {
              $addFields: {
                __order: { $indexOfArray: ["$$mealIds", "$_id"] },
              },
            },
            { $sort: { __order: 1, createdAt: 1 } },

            // foods 조인 + 정렬
            {
              $lookup: {
                from: "foods",
                localField: "foods",
                foreignField: "_id",
                as: "foods",
                pipeline: [
                  { $sort: { createdAt: 1, _id: 1 } }, // 필요 시 정렬
                  {
                    $project: {
                      _id: 1,
                      mealId: 1,
                      food_name: 1,
                      food_amount: 1,
                      createdAt: 1,
                      updatedAt: 1,
                    },
                  },
                ],
              },
            },

            // meal 필드 정리
            {
              $project: {
                _id: 1,
                dietId: 1,
                meal_type: 1,
                createdAt: 1,
                updatedAt: 1,
                foods: 1,
              },
            },
          ],
          as: "meals",
        },
      },

      // 최종 형태 정리
      {
        $project: {
          _id: 1,
          userId: 1,
          total_calories: 1,
          feedback: 1,
          createdAt: 1,
          updatedAt: 1,
          date: "$date", // <-- 여기 수정 (원래는 "$_date"였음)
          meals: 1,
        },
      },

      { $limit: 1 },
    ],
    { session }
  );

  return (doc as DietCreateResponseDto) ?? null;
}

export async function aggregateGetDietListByUserIdForMonth(
  userId: Types.ObjectId,
  year: number,
  month1to12: number,
  session?: ClientSession
): Promise<DietCreateResponseDto[]> {
  const { start, end } = getMonthStringRange(year, month1to12);

  const result = await Diet.aggregate(
    [
      { $match: { userId } },

      // 1) _date 계산: date 있으면 그대로, 없으면 createdAt을 KST 기준 YYYY-MM-DD로 변환
      {
        $addFields: {
          _date: {
            $ifNull: [
              "$date",
              {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Seoul",
                },
              },
            ],
          },
        },
      },

      // 2) 문자열 범위 매칭: "YYYY-MM-DD"는 사전식 정렬이 날짜 순과 동일
      { $match: { _date: { $gte: start, $lt: end } } },

      // 3) details → WorkoutDetail, fitnessDetails → FitnessDetail 조인
      {
        $lookup: {
          from: "meals",
          localField: "meals",
          foreignField: "_id",
          as: "meals",
          pipeline: [
            {
              $lookup: {
                from: "foods",
                localField: "foods",
                foreignField: "_id",
                as: "foods",
              },
            },
            // meals 모양으로 정리
            {
              $project: {
                _id: 1,
                dietId: 1,
                workout_name: 1,
                meal_type: 1,
                createdAt: 1,
                updatedAt: 1,
                foods: {
                  $map: {
                    input: "$foods",
                    as: "f",
                    in: {
                      _id: "$$f._id",
                      mealId: "$$f.mealId",
                      food_name: "$$f.food_name",
                      food_amount: "$$f.food_amount",
                      createdAt: "$$f.createdAt",
                      updatedAt: "$$f.updatedAt",
                    },
                  },
                },
              },
            },
          ],
        },
      },

      // 4) 최종 응답 형태(WorkoutResponseDto)로 정리
      {
        $project: {
          _id: 1,
          userId: 1,
          createdAt: 1,
          updatedAt: 1,
          date: "$_date", // ← date 문자열로 반환
          total_calories: 1,
          feedback: 1,
          meals: 1,
        },
      },

      // 5) 최신순 정렬 (date → createdAt 보조)
      { $sort: { date: -1, createdAt: -1 } },
    ],
    { session }
  );

  return result as DietCreateResponseDto[];
}

export async function aggregateGetMealById(
  mealId: Types.ObjectId,
  session?: ClientSession
): Promise<MealResponseDto | null> {
  const [doc] = await Meal.aggregate(
    [
      { $match: { _id: mealId } },

      // foods 조인 + 정렬 + 필요한 필드만 노출
      {
        $lookup: {
          from: "foods",
          localField: "foods",
          foreignField: "_id",
          as: "foods",
          pipeline: [
            { $sort: { createdAt: 1, _id: 1 } },
            {
              $project: {
                _id: 1,
                mealId: 1,
                food_name: 1,
                food_amount: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },

      // Meal 자체 필드 정리
      {
        $project: {
          _id: 1,
          dietId: 1,
          meal_type: 1,
          createdAt: 1,
          updatedAt: 1,
          foods: 1,
        },
      },

      { $limit: 1 },
    ],
    { session }
  );

  return (doc as MealResponseDto) ?? null;
}
