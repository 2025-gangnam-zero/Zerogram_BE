export type NotificationItemDto = {
  roomId: string;
  roomName?: string;
  lastMessage?: string;
  lastMessageAt?: string; // ISO
  unread: number;
};

export type NotificationListResponse = {
  items: NotificationItemDto[];
  nextCursor: string | null; // ISO (마지막 항목의 lastMessageAt)
};
