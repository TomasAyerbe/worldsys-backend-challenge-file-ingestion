import { HttpStatusCodes } from '../enums/HttpStatusCodes';

export class HttpError extends Error {
  public readonly statusCode: HttpStatusCodes;

  constructor(statusCode: HttpStatusCodes, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
