import { Types } from "mongoose";
import { Workout } from "../models";
import { WorkoutResponseDto } from "../dtos";

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
