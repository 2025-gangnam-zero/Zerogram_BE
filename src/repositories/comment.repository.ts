import { ClientSession, DeleteResult, Types } from "mongoose";
import { aggregateGetCommentById, mongoDBErrorHandler } from "../utils";
import { Comment } from "../models";
import { CommentCreateRequestDto, CommentResponseDto } from "../dtos";
import { CommentState } from "../types";

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

  // 댓글 조회
  async getCommentById(
    commentId: Types.ObjectId,
    session?: ClientSession
  ): Promise<CommentResponseDto | null> {
    try {
      return await aggregateGetCommentById(commentId, session);
    } catch (error) {
      throw mongoDBErrorHandler("getCommentById", error);
    }
  }

  // 댓글 생성
  async createComment(
    comment: CommentCreateRequestDto,
    session?: ClientSession
  ): Promise<CommentState> {
    try {
      const doc = new Comment(comment);
      return await doc.save({ session });
    } catch (error) {
      throw mongoDBErrorHandler("createComment", error);
    }
  }
}

export default new CommentRepository();
