import { Types } from "mongoose";
import { UserState } from "../types";

declare global {
  namespace Express {
    interface Request {
      user: UserState;
      sessionId: Types.ObjectId;
    }

    namespace MulterS3 {
      interface File extends Multer.File {
        bucket: string;
        key: string;
        acl: string;
        contentType: string;
        storageClass: string;
        serverSideEncryption: string;
        metadata: any;
        location: string;
        etag: string;
      }
    }
  }
}

export {};
