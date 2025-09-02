import { Types } from "mongoose";
import { UserState } from "../types";

declare global {
  namespace Express {
    interface Request {
      user: UserState;
      sessionId: Types.ObjectId;
    }
  }
}

export {};
