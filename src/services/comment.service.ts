import mongoose, { ClientSession, Types } from "mongoose";
import { commentRepository } from "../repositories";
import { InternalServerError, NotFoundError } from "../errors";
import {
  CommentCreateRequestDto,
  CommentResponseDto,
  CommentUpdateRequestDto,
} from "../dtos";
import meetService from "./meet.service";
import { CommentState } from "types";

class CommentService {
  // 댓글 일괄 삭제
  async deleteAllComments(
    commentIds: Types.ObjectId[],
    session?: ClientSession
  ): Promise<void> {
    try {
      const result = await commentRepository.deleteAllComments(
        commentIds,
        session
      );

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

  // 댓글 조회
  async getCommentById(commentId: Types.ObjectId, session?: ClientSession) {
    try {
      const comment = await commentRepository.getCommentById(
        commentId,
        session
      );

      if (!comment) {
        throw new NotFoundError("댓글 조회 실패");
      }

      return comment;
    } catch (error) {
      throw error;
    }
  }

  // 댓글 생성
  async createComment(
    meetId: Types.ObjectId,
    comment: CommentCreateRequestDto
  ): Promise<CommentResponseDto> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 댓글 생성
      const newComment = await commentRepository.createComment(
        comment,
        session
      );

      // 댓글을 모집글에 추가
      await meetService.addCommentToMeet(meetId, newComment._id, session);

      // 생성된 댓글 반환
      const result = await this.getCommentById(newComment._id, session);

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // 댓글 수정
  async updateCommentById(
    commentId: Types.ObjectId,
    commentUpdate: CommentUpdateRequestDto
  ): Promise<CommentState> {
    try {
      const comment = await commentRepository.updateComment(
        commentId,
        commentUpdate
      );

      if (!comment) {
        throw new InternalServerError("댓글 수정 실패");
      }

      return comment;
    } catch (error) {
      throw error;
    }
  }

  // 댓글 삭제
  async deleteCommentById(commentId: Types.ObjectId): Promise<void> {
    try {
      const result = await commentRepository.deleteComment(commentId);

      if (!result.acknowledged) {
        throw new InternalServerError("댓글 삭제 승인 실패");
      }

      if (!result.deletedCount) {
        throw new InternalServerError("댓글 삭제 실패");
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new CommentService();
