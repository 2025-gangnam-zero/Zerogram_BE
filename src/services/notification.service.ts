import { Types } from "mongoose";
import { NotificationListResponse } from "../dtos";
import { notificationRepository } from "../repositories";

type ListArgs = {
  userId: Types.ObjectId;
  limit?: number;
  cursor?: string | null;
};

class NotificationService {
  async list({
    userId,
    limit = 50,
    cursor = null,
  }: ListArgs): Promise<NotificationListResponse> {
    const lim = Math.max(1, Math.min(200, limit));
    const items = await notificationRepository.listForUser({
      userId,
      limit: lim,
      cursor,
    });

    // nextCursor: 응답 마지막 항목의 lastMessageAt(없으면 null)
    const last = items[items.length - 1];
    const nextCursor = last?.lastMessageAt ?? null;

    return { items, nextCursor };
  }
}

export default new NotificationService();
