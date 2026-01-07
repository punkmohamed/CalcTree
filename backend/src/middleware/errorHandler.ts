import { Request, Response, NextFunction } from "express";

// نوع مخصص للخطأ يحتوي على رسالة وحالة (اختياري)
interface CustomError extends Error {
  statusCode?: number;
  message: string;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Internal Server Error";
  const stack = process.env.NODE_ENV === "development" ? err.stack : undefined;

  res.status(statusCode).json({
    success: false,
    statusCode,
    code,
    message,
    stack,
  });
};
