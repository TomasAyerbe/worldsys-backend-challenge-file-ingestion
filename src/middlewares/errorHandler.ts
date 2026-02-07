import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { HttpStatusCodes } from '../enums/HttpStatusCodes';
import { HttpError } from '../errors/HttpError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error(err, 'Unhandled error');
  res
    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
    .json({ error: 'Internal server error' });
}
