import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { BadRequestError } from "../errors";
import {
  CommentCreateRequestDto,
  MeetCreateRequestDto,
  MeetListOpts,
  MeetUpdateRequestDto,
} from "../dtos";
import { commentService, meetService } from "../services";

// 모집글 목록 조회
export const getMeetList = async (req: Request, res: Response) => {
  const { skip, limit, location, workout_type } = req.query; // 내용, 제목, 작성자로 검색

  console.log(skip, limit, location, workout_type);

  if (!skip) {
    throw new BadRequestError("skip 필수");
  }

  if (!limit) {
    throw new BadRequestError("limit 필수");
  }

  try {
    // sort 삭제함 주의할 것
    const opts = {
      match: {
        location: location?.toString(),
        workout_type: workout_type?.toString(),
      },
      skip: skip ? Number(skip.toString()) : undefined,
      limit: limit ? Number(limit.toString()) : undefined,
    } as MeetListOpts;

    const meets = await meetService.getMeetList(opts);

    res.status(200).json({
      success: true,
      message: "모집글 목록 조회",
      code: "GET_MEET_LIST_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meets,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 모집글 생성
export const createMeet = async (req: Request, res: Response) => {
  const userId = req.user._id as Types.ObjectId;
  const { title, description, workout_type, location } = req.body;

  // files 안전 처리
  const files = (req.files as Express.MulterS3.File[]) ?? [];
  const imageUrls = files.map((f) => (f as any).location as string); // S3 퍼블릭 URL
  // 필요 시 key를 함께 저장하세요: const keys = files.map(f => (f as any).key);

  if (!title) throw new BadRequestError("제목 필수");
  if (!description) throw new BadRequestError("내용 필수"); // ← 오타 수정
  if (!workout_type) throw new BadRequestError("운동 타입 필수");
  if (!location) throw new BadRequestError("장소 필수");

  try {
    // 작성자를 crews에 자동 포함 → DB 일관성↑
    const newMeet: MeetCreateRequestDto = {
      userId,
      title,
      description,
      images: imageUrls.length ? imageUrls : undefined,
      workout_type,
      location,
    };

    const meet = await meetService.createMeet(newMeet);

    res.status(201).json({
      success: true,
      message: "모집글 생성 성공",
      code: "MEET_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: { meet },
    });
  } catch (error) {
    throw error;
  }
};

// 모집글 상세 조회
export const getMeet = async (req: Request, res: Response) => {
  const { meetid } = req.params;

  if (!meetid) {
    throw new BadRequestError("모집글 아이디 필수");
  }
  try {
    const meetId = new mongoose.Types.ObjectId(meetid);

    console.log(meetId);

    res.status(200).json({
      success: true,
      message: "모집글 상세 조회 성공",
      code: "GET_MEET_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meet: {},
      },
    });
  } catch (error) {
    throw error;
  }
};

// 모집글 수정
export const updateMeet = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { meetid } = req.params;
  const meetUpdate = req.body as MeetUpdateRequestDto;

  console.log(meetUpdate);

  if (!Object.values(meetUpdate).every(Boolean)) {
    throw new BadRequestError("적어도 하나 이상의 수정 필드 필수");
  }

  try {
    const meetId = new mongoose.Types.ObjectId(meetid);

    const meet = await meetService.updateMeetWithAuth(
      meetId,
      meetUpdate,
      userId
    );

    res.status(200).json({
      success: true,
      message: "모집글 생성 성공",
      code: "MEET_UPDATE_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meet,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 모집글 삭제
export const deleteMeet = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { meetid } = req.params;

  if (!meetid) {
    throw new BadRequestError("meetid 필수");
  }
  try {
    const meetId = new mongoose.Types.ObjectId(meetid);

    console.log(userId, meetId);

    await meetService.deleteMeetWithAuthorization(meetId, userId);

    res.status(200).json({
      success: true,
      message: "모집글 삭제 성공",
      code: "MEET_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 댓글 생성
export const createComment = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { meetid } = req.params;
  const { content } = req.body;
  console.log(meetid, userId, content);

  if (!meetid) {
    throw new BadRequestError("meetid 필수");
  }
  if (!content) {
    throw new BadRequestError("content 필수");
  }
  try {
    const meetId = new mongoose.Types.ObjectId(meetid);

    const newComment = {
      userId,
      content,
    } as CommentCreateRequestDto;

    const comment = await commentService.createComment(meetId, newComment);

    res.status(201).json({
      success: true,
      message: "댓글 생성 성공",
      code: "COMMENT_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        comment,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 댓글 수정
export const updateComment = async (req: Request, res: Response) => {
  const user = req.user;
  const { commentid } = req.params;
  const { content } = req.body;
  console.log(commentid, user, content);

  if (!commentid) {
    throw new BadRequestError("meetid 필수");
  }
  if (!content) {
    throw new BadRequestError("content 필수");
  }
  try {
    const commentId = new mongoose.Types.ObjectId(commentid);

    const comment = await commentService.updateCommentById(commentId, {
      content,
    });

    res.status(200).json({
      success: true,
      message: "댓글 수정 성공",
      code: "COMMENT_UPDATE_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        comment: {
          ...comment,
          nickname: user.nickname,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

// 댓글 삭제
export const deleteComment = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { commentid } = req.params;
  console.log(commentid, userId);
  if (!commentid) {
    throw new BadRequestError("meetid 필수");
  }
  try {
    const commentId = new mongoose.Types.ObjectId(commentid);

    await commentService.deleteCommentById(commentId);

    res.status(200).json({
      success: true,
      message: "댓글 삭제 성공",
      code: "COMMENT_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 참여자 추가/삭제
export const toggleCrew = async (req: Request, res: Response) => {
  const user = req.user;
  const { meetid } = req.params;
  console.log(meetid, user);
  if (!meetid) {
    throw new BadRequestError("meetid 필수");
  }
  try {
    const meetId = new mongoose.Types.ObjectId(meetid);

    const isNew = await meetService.toggleCrew(meetId, user._id);

    res.status(200).json({
      success: true,
      message: "참여자 추가/삭제 성공",
      code: "CREW_UPDATE_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: isNew
        ? {
            userId: user._id,
            nickname: user.nickname,
          }
        : undefined,
    });
  } catch (error) {
    throw error;
  }
};
