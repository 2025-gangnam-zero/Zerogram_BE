import { Request, Response } from "express";
import mongoose from "mongoose";
import { BadRequestError } from "../errors";
import { meetingService } from "../services";
import { ReplyState } from "../types";

// 모임 목록
export const getMeetingList = async (req: Request, res: Response) => {
  try {
    const meetings = await meetingService.getMeetingList();

    res.status(200).json({
      success: true,
      message: "모임 목록 조회 성공",
      code: "MEETING_LIST_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meetings,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 모임 생성
export const createMeeting = async (req: Request, res: Response) => {
  const meetingRequest = req.body;
  // 모임 생성 요소 유효성 검사
  try {
    const meeting = await meetingService.createMeeting(meetingRequest);

    res.status(201).json({
      success: true,
      message: "모임 생성 성공",
      code: "MEETING_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meeting,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 모임 상세
export const getMeetingById = async (req: Request, res: Response) => {
  const { meetingId } = req.body;

  if (!meetingId) {
    throw new BadRequestError("모임 아이디 필수");
  }

  const _id = new mongoose.Types.ObjectId(meetingId);

  try {
    const meeting = await meetingService.getMeetingById(_id);

    res.status(200).json({
      success: true,
      message: "모임 조회 성공",
      code: "GET_MEETING_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        meeting,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 모임 수정
export const updateMeetingById = async (req: Request, res: Response) => {
  const user = req.user;
  const { meetingId, meetingUpdate } = req.body;

  if (!meetingId) {
    throw new BadRequestError("모임 아이디 필수");
  }

  // meeting update에 대한 유효성 검사 추가 필요

  const _id = new mongoose.Types.ObjectId(meetingId);
  try {
    await meetingService.updateMeetingById(user, _id, meetingUpdate);

    res.status(200).json({
      success: true,
      message: "모임 수정 성공",
      code: "MEETING_UPDATE_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 모임 삭제
export const deleteMeetingById = async (req: Request, res: Response) => {
  const user = req.user;
  const { meetingId } = req.body;

  if (!meetingId) {
    throw new BadRequestError("모임 아이디");
  }

  try {
    await meetingService.deleteMeetingById(user, meetingId);

    res.status(200).json({
      success: true,
      message: "모임 삭제 성공",
      code: "MEETING_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 댓글 생성
export const createReply = async (req: Request, res: Response) => {
  const user = req.user;
  const { meetingId, text } = req.body;

  if (!meetingId) {
    throw new BadRequestError("모임 아이디 필수");
  }

  if (!text) {
    throw new BadRequestError("댓글 텍스트 필수");
  }

  try {
    const replyDto = {
      userId: user._id,
      meetingId,
      text,
    } as ReplyState;

    const reply = await meetingService.createReply(replyDto);

    res.status(201).json({
      success: true,
      message: "댓글 생성 성공",
      code: "REPLY_CREATION_SUCCEEDED",
      timestamp: new Date().toISOString(),
      data: {
        reply,
      },
    });
  } catch (error) {
    throw error;
  }
};

// 댓글 수정
export const updateReply = async (req: Request, res: Response) => {
  const user = req.user;
  const { replyId, text } = req.body;

  if (!replyId) {
    throw new BadRequestError("댓글 아이디 필수");
  }

  if (!text) {
    throw new BadRequestError("댓글 텍스트 필수");
  }
  try {
    await meetingService.updateReply(user, replyId, text);

    res.status(200).json({
      success: true,
      message: "댓글 수정 성공",
      code: "UPDATE_REPLY_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 댓글 삭제
export const deleteReply = async (req: Request, res: Response) => {
  const user = req.user;
  const { replyId } = req.body;

  if (!replyId) {
    throw new BadRequestError("댓글 아이디 필수");
  }

  try {
    await meetingService.deleteReply(user, replyId);

    res.status(200).json({
      success: true,
      message: "댓글 삭제 성공",
      code: "UPDATE_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 참여자 추가
export const addParticipant = async (req: Request, res: Response) => {
  const user = req.user;
  const { meetingId } = req.body;

  if (!meetingId) {
    throw new BadRequestError("모임 아이디 필수");
  }

  const _id = new mongoose.Types.ObjectId(meetingId);
  try {
    await meetingService.addParticipant(user._id, _id);

    res.status(200).json({
      success: true,
      message: "참여자 추가 성공",
      code: "PARTICIPANT_ADDITION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};

// 참여자 삭제
export const deleteParticipant = async (req: Request, res: Response) => {
  const user = req.user;
  const { meetingId } = req.body;

  if (!meetingId) {
    throw new BadRequestError("모임 아이디 필수");
  }

  const _id = new mongoose.Types.ObjectId(meetingId);
  try {
    await meetingService.removeParticipant(user._id, _id);

    res.status(200).json({
      success: true,
      message: "참여자 삭제 성공",
      code: "PARTICIPANT_DELETION_SUCCEEDED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
};
