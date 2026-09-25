import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error | unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
  console.error('[Error Middleware]:', errorMessage);

  // Distinguish known bad request / conflict / not found errors
  let statusCode = 500;
  if (
    errorMessage.includes('not found') ||
    errorMessage.includes('Not found')
  ) {
    statusCode = 404;
  } else if (
    errorMessage.includes('already exists') ||
    errorMessage.includes('already registered') ||
    errorMessage.includes('already taken') ||
    errorMessage.includes('conflict') ||
    errorMessage.includes('already enrolled') ||
    errorMessage.includes('already been encoded') ||
    errorMessage.includes('already scheduled') ||
    errorMessage.includes('already booked') ||
    errorMessage.includes('already been claimed')
  ) {
    statusCode = 409;
  } else if (
    errorMessage.includes('Invalid') ||
    errorMessage.includes('required') ||
    errorMessage.includes('must') ||
    errorMessage.includes('format') ||
    errorMessage.includes('before end time')
  ) {
    statusCode = 400;
  } else if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('expired')
  ) {
    statusCode = 401;
  } else if (errorMessage.includes('Forbidden')) {
    statusCode = 403;
  }

  res.status(statusCode).json({
    error: errorMessage,
  });
}
