import { NextFunction, Request, Response } from "express";
import { CustomAPIError } from "../errors";

export const errorHandler = (
  err: { error: CustomAPIError | any; failureMessage: string } | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = err.error ?? err ?? {};
  const statusCode = err.statusCode || error.statusCode || 500;
  const errorCode = err.errorCode ?? error.code ?? "ERROR";
  const message = error.message ?? err.message ?? "에러 발생";

  // 에러 로그 기록
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Error] ${message}`, {
      statusCode,
      stack: error.stack || err.stack,
    });
  }

  // 에러 응답
  const errorResponse = {
    success: false,
    code: errorCode,
    message,
    timestamp: new Date().toISOString(),
  };

  // 클라이언트에 에러 응답
  res.status(statusCode).json(errorResponse);
};
