// 개인 알림 채널 / 방 채널 네이밍
export const socketRooms = {
  user: (userId: string) => `user:${userId}`,
  room: (roomId: string) => `${roomId}`, // 현재 구현은 roomId 그대로 조인/브로드캐스트
};
