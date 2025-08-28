import { Types } from "mongoose";
import { IUser } from "../types";

declare global {
  namespace Express {
    interface Request {
      user: IUser;
      sessionId: Types.ObjectId;
    }
  }
}

export {};
