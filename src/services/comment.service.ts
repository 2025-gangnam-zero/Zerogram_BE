import { Types } from "mongoose";
import { commentRepository } from "../repositories";
import { InternalServerError } from "../errors";

class CommentService {
  // 댓글 일괄 삭제
  async deleteAllComments(commentIds: Types.ObjectId[]): Promise<void> {
    try {
      const result = await commentRepository.deleteAllComments(commentIds);

      if (!result.acknowledged) {
        throw new InternalServerError("댓글 일괄 삭제 승인 실패");
      }

      if (result.deletedCount === 0) {
        throw new InternalServerError("댓글 일괄 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new CommentService();
