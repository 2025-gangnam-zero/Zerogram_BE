import { Types } from "mongoose";
import { Workout } from "../models"; // 위에서 선언한 모델

export async function aggregateWorkoutById(workoutId: Types.ObjectId | string) {
  const _id =
    typeof workoutId === "string" ? new Types.ObjectId(workoutId) : workoutId;

  const [doc] = await Workout.aggregate([
    { $match: { _id } },

    // details populate (+ 원래 순서 유지)
    {
      $lookup: {
        from: "workoutdetails",
        let: { detailIds: "$details" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$detailIds"] } } },
          {
            $addFields: { __order: { $indexOfArray: ["$$detailIds", "$_id"] } },
          },
          { $sort: { __order: 1 } },

          // fitnessDetails populate (workout_name이 fitness일 때만 배열이 있고, 순서 유지)
          {
            $lookup: {
              from: "fitnessdetails",
              let: { fdIds: "$fitnessDetails" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $isArray: "$$fdIds" },
                        { $in: ["$_id", "$$fdIds"] },
                      ],
                    },
                  },
                },
                {
                  $addFields: {
                    __order: { $indexOfArray: ["$$fdIds", "$_id"] },
                  },
                },
                { $sort: { __order: 1 } },
                { $project: { __order: 0 } },
              ],
              as: "fitnessDetails",
            },
          },

          // 표시 필드 정리
          {
            $project: {
              __order: 0,
              workoutId: 1,
              workout_name: 1,
              duration: 1,
              calories: 1,
              feedback: 1,
              avg_pace: 1,
              distance: 1,
              fitnessDetails: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        as: "details",
      },
    },

    // 최종 프로젝션
    {
      $project: {
        userId: 1,
        details: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return doc ?? null;
}

type PageOpt = { page?: number; limit?: number };

export async function aggregateWorkoutsByUserId(
  userId: Types.ObjectId | string,
  { page = 1, limit = 10 }: PageOpt = {}
) {
  const _userId =
    typeof userId === "string" ? new Types.ObjectId(userId) : userId;
  const skip = (page - 1) * limit;

  const [result] = await Workout.aggregate([
    { $match: { userId: _userId } },
    { $sort: { createdAt: -1, _id: -1 } },

    {
      $facet: {
        total: [{ $count: "count" }],
        data: [
          { $skip: skip },
          { $limit: limit },

          // details populate
          {
            $lookup: {
              from: "workoutdetails",
              let: { detailIds: "$details" },
              pipeline: [
                { $match: { $expr: { $in: ["$_id", "$$detailIds"] } } },
                {
                  $addFields: {
                    __order: { $indexOfArray: ["$$detailIds", "$_id"] },
                  },
                },
                { $sort: { __order: 1 } },

                // fitnessDetails populate
                {
                  $lookup: {
                    from: "fitnessdetails",
                    let: { fdIds: "$fitnessDetails" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $isArray: "$$fdIds" },
                              { $in: ["$_id", "$$fdIds"] },
                            ],
                          },
                        },
                      },
                      {
                        $addFields: {
                          __order: { $indexOfArray: ["$$fdIds", "$_id"] },
                        },
                      },
                      { $sort: { __order: 1 } },
                      { $project: { __order: 0 } },
                    ],
                    as: "fitnessDetails",
                  },
                },

                {
                  $project: {
                    __order: 0,
                    workoutId: 1,
                    workout_name: 1,
                    duration: 1,
                    calories: 1,
                    feedback: 1,
                    avg_pace: 1,
                    distance: 1,
                    fitnessDetails: 1,
                    createdAt: 1,
                    updatedAt: 1,
                  },
                },
              ],
              as: "details",
            },
          },

          { $project: { userId: 1, details: 1, createdAt: 1, updatedAt: 1 } },
        ],
      },
    },

    // total/count, page 메타데이터 합성
    {
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
        data: 1,
      },
    },
  ]);

  const total = result?.total ?? 0;
  const pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages,
    data: result?.data ?? [],
  };
}
