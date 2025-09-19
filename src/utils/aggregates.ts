import { ClientSession, PipelineStage, Types } from "mongoose";
import { Comment, Diet, Meal, Meet, Workout } from "../models";
import {
  CommentResponseDto,
  DietCreateResponseDto,
  MealResponseDto,
  MeetListOpts,
  MeetResponseDto,
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

export const aggregateGetMeetList = async ({
  match = {},
  skip = 0,
  limit = 20,
  sort = { createdAt: -1, _id: -1 },
}: MeetListOpts = {}) => {
  return await Meet.aggregate<MeetResponseDto>([
    { $match: match },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },

    // 작성자 닉네임, 프로필 사진
    {
      $lookup: {
        from: "users",
        let: { uid: "$userId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
          { $project: { _id: 0, nickname: 1, profile_image: 1 } },
        ],
        as: "authorInfo",
      },
    },
    {
      $addFields: {
        nickname: {
          $ifNull: [{ $arrayElemAt: ["$authorInfo.nickname", 0] }, ""],
        },
        profile_image: {
          $ifNull: [{ $arrayElemAt: ["$authorInfo.profile_image", 0] }],
        },
      },
    },
    { $project: { authorInfo: 0 } },

    // crews 순서 보존
    { $addFields: { crewIds: { $ifNull: ["$crews", []] } } },
    {
      $lookup: {
        from: "users",
        let: { crewIds: "$crewIds" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$crewIds"] } } },
          {
            $project: { _id: 0, userId: "$_id", nickname: 1, profile_image: 1 },
          },
        ],
        as: "crewDocs",
      },
    },
    {
      $addFields: {
        crews: {
          $map: {
            input: "$crewIds",
            as: "cid",
            in: {
              $first: {
                $filter: {
                  input: "$crewDocs",
                  as: "c",
                  cond: { $eq: ["$$c.userId", "$$cid"] },
                },
              },
            },
          },
        },
      },
    },
    // ⚠️ null 제거
    {
      $addFields: {
        crews: {
          $filter: { input: "$crews", as: "x", cond: { $ne: ["$$x", null] } },
        },
      },
    },
    { $project: { crewDocs: 0, crewIds: 0 } },

    // comments 순서 보존
    { $addFields: { commentIds: { $ifNull: ["$comments", []] } } },
    {
      $lookup: {
        from: "comments",
        let: { cids: "$commentIds" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$cids"] } } },
          {
            $lookup: {
              from: "users",
              let: { uid: "$userId" },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
                { $project: { _id: 0, nickname: 1, profile_image: 1 } },
              ],
              as: "u",
            },
          },
          {
            $addFields: {
              nickname: { $ifNull: [{ $arrayElemAt: ["$u.nickname", 0] }, ""] },
              profile_image: {
                $ifNull: [{ $arrayElemAt: ["$u.profile_image", 0] }],
              },
            },
          },
          {
            $project: {
              u: 0,
              _id: 1,
              userId: 1,
              nickname: 1,
              profile_image: 1,
              content: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: "commentDocs",
      },
    },
    {
      $addFields: {
        comments: {
          $map: {
            input: "$commentIds",
            as: "cid",
            in: {
              $first: {
                $filter: {
                  input: "$commentDocs",
                  as: "c",
                  cond: { $eq: ["$$c._id", "$$cid"] },
                },
              },
            },
          },
        },
      },
    },
    // ⚠️ null 제거
    {
      $addFields: {
        comments: {
          $filter: {
            input: "$comments",
            as: "x",
            cond: { $ne: ["$$x", null] },
          },
        },
      },
    },
    { $project: { commentDocs: 0, commentIds: 0 } },

    // 최종 형태
    {
      $project: {
        _id: 1,
        userId: 1,
        nickname: 1,
        profile_image: 1,
        title: 1,
        description: 1,
        images: 1,
        workout_type: 1,
        location: 1,
        crews: 1,
        comments: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);
};

/**
 * 단건 상세 조회: MeetResponseDto | null
 * - 작성자 닉네임 조인
 * - crews: ObjectId[] → [{ userId, nickname }] + 원래 순서 보존
 * - comments: ObjectId[] → [{ _id, userId, nickname, content, createdAt, updatedAt }] + 원래 순서 보존
 */
export async function aggregateGetMeetById(
  meetId: Types.ObjectId
): Promise<MeetResponseDto | null> {
  const [doc] = await Meet.aggregate<MeetResponseDto>([
    { $match: { _id: meetId } },
    { $limit: 1 },

    // --- 작성자 닉네임 ---
    {
      $lookup: {
        from: "users",
        let: { uid: "$userId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
          { $project: { _id: 0, nickname: 1 } },
        ],
        as: "authorInfo",
      },
    },
    {
      $addFields: {
        nickname: {
          $ifNull: [{ $arrayElemAt: ["$authorInfo.nickname", 0] }, ""],
        },
      },
    },
    { $project: { authorInfo: 0 } },

    // --- crews 순서 보존 ---
    { $addFields: { crewIds: { $ifNull: ["$crews", []] } } },
    {
      $lookup: {
        from: "users",
        let: { crewIds: "$crewIds" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$crewIds"] } } },
          { $project: { _id: 0, userId: "$_id", nickname: 1 } },
        ],
        as: "crewDocs",
      },
    },
    {
      $addFields: {
        crews: {
          $map: {
            input: "$crewIds",
            as: "cid",
            in: {
              $first: {
                $filter: {
                  input: "$crewDocs",
                  as: "c",
                  cond: { $eq: ["$$c.userId", "$$cid"] },
                },
              },
            },
          },
        },
      },
    },
    // 조인 누락 방지용 null 제거 + 임시 필드 정리
    {
      $addFields: {
        crews: {
          $filter: { input: "$crews", as: "x", cond: { $ne: ["$$x", null] } },
        },
      },
    },
    { $project: { crewDocs: 0, crewIds: 0 } },

    // --- comments 순서 보존 ---
    { $addFields: { commentIds: { $ifNull: ["$comments", []] } } },
    {
      $lookup: {
        from: "comments",
        let: { cids: "$commentIds" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$cids"] } } },
          {
            $lookup: {
              from: "users",
              let: { uid: "$userId" },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
                { $project: { _id: 0, nickname: 1 } },
              ],
              as: "u",
            },
          },
          {
            $addFields: {
              nickname: { $ifNull: [{ $arrayElemAt: ["$u.nickname", 0] }, ""] },
            },
          },
          {
            $project: {
              u: 0,
              _id: 1,
              userId: 1,
              nickname: 1,
              content: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: "commentDocs",
      },
    },
    {
      $addFields: {
        comments: {
          $map: {
            input: "$commentIds",
            as: "cid",
            in: {
              $first: {
                $filter: {
                  input: "$commentDocs",
                  as: "c",
                  cond: { $eq: ["$$c._id", "$$cid"] },
                },
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        comments: {
          $filter: {
            input: "$comments",
            as: "x",
            cond: { $ne: ["$$x", null] },
          },
        },
      },
    },
    { $project: { commentDocs: 0, commentIds: 0 } },

    // --- 최종 형태 ---
    {
      $project: {
        _id: 1,
        userId: 1,
        nickname: 1,
        title: 1,
        description: 1,
        images: 1,
        workout_type: 1,
        location: 1,
        crews: 1,
        comments: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]).exec();

  return doc ?? null;
}

export async function aggregateGetCommentById(
  commentId: Types.ObjectId,
  session?: ClientSession
): Promise<CommentResponseDto | null> {
  const pipeline: PipelineStage[] = [
    // 1) 대상 댓글 매치
    { $match: { _id: commentId } },
    { $limit: 1 },

    // 2) 작성자 닉네임 조인
    {
      $lookup: {
        from: "users",
        let: { uid: "$userId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
          { $project: { _id: 0, nickname: 1 } },
        ],
        as: "authorInfo",
      },
    },
    {
      $addFields: {
        nickname: {
          $ifNull: [{ $arrayElemAt: ["$authorInfo.nickname", 0] }, ""],
        },
      },
    },
    { $project: { authorInfo: 0 } },

    // 3) 최종 필드 (DTO 스펙에 맞춤)
    {
      $project: {
        _id: 1,
        userId: 1,
        nickname: 1,
        content: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const agg = Comment.aggregate<CommentResponseDto>(pipeline);
  if (session) agg.option({ session });

  const [doc] = await agg.exec();
  return doc ?? null;
}
