import { Request, Response } from "express";
import mongoose from "mongoose";
import { notificationService } from "../services";

export const getNotifications = async (req: Request, res: Response) => {
  // 인증 미들웨어에서 req.user._id를 주고 있다고 가정(#62 컨텍스트)
  const userId = (req as any).user?._id as mongoose.Types.ObjectId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { limit, cursor } = req.query as { limit?: string; cursor?: string };

  try {
    const data = await notificationService.list({
      userId,
      limit: limit ? Number(limit) : undefined,
      cursor: cursor ?? null,
    });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error("[notifications] list error:", e);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};
