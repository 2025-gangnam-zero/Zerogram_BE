import { ForbiddenError } from "errors";
import { NextFunction, Request, Response } from "express";

export const adminChecker = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user || user.role !== "ADMIN") {
    throw new ForbiddenError("관리자 페이지 권한 없음");
  }

  next();
};
