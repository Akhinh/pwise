// ============================================================
// PrepWise — Middleware: Global Error Handler
// ============================================================

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
    });
    return;
  }

  // Unexpected errors — don't leak stack traces in production
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    statusCode: 500,
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
}
