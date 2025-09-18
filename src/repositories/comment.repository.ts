import { ClientSession, DeleteResult, Types } from "mongoose";
import { mongoDBErrorHandler } from "../utils";
import { Comment } from "../models";

class CommentRepository {
  // 댓글 일괄 삭제
  async deleteAllComments(
    commentIds: Types.ObjectId[],
    session?: ClientSession
  ): Promise<DeleteResult> {
    try {
      return await Comment.deleteMany(
        {
          _id: { $in: commentIds },
        },
        {
          session,
        }
      );
    } catch (error) {
      throw mongoDBErrorHandler("deletAllComments", error);
    }
  }
}

export default new CommentRepository();
