import "socket.io";
declare module "socket.io" {
  interface Socket {
    data: {
      sessionId?: import("mongoose").Types.ObjectId;
      user?: { userId: string; nickname: string; profile_image?: string };
    };
  }
}
