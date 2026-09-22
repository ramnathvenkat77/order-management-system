import { Response } from 'express';

import {
  AccessTokenErrorResponse,
  AuthFailureResponse,
  BadRequestResponse,
  FailureMsgResponse,
  ForbiddenResponse,
  InternalErrorResponse,
  MethodNotFoundResponse,
  NotFoundResponse,
} from './ApiResponse';

export enum ErrorType {
  BAD_TOKEN = 'BadTokenError',
  TOKEN_EXPIRED = 'TokenExpiredError',
  UNAUTHORIZED = 'AuthFailureError',
  ACCESS_TOKEN = 'AccessTokenError',
  INTERNAL = 'InternalError',
  NOT_FOUND = 'NotFoundError',
  METHOD_NOT_FOUND = 'MethodNotFoundError',
  NO_ENTRY = 'NoEntryError',
  NO_DATA = 'NoDataError',
  BAD_REQUEST = 'BadRequestError',
  FORBIDDEN = 'ForbiddenError',
  DB_ERROR = 'DBError',
  CORS_ERROR = 'CorsError',
}

type DatabaseError = Error & {
  code?: string;
  detail?: string;
};

export abstract class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public message: string = 'error'
  ) {
    super(message);
  }

  public static handle(
    err: ApiError,
    res: Response
  ): Response {
    switch (err.type) {
      case ErrorType.BAD_TOKEN:
      case ErrorType.TOKEN_EXPIRED:
      case ErrorType.UNAUTHORIZED:
        return new AuthFailureResponse(err.message).send(res);

      case ErrorType.ACCESS_TOKEN:
        return new AccessTokenErrorResponse(err.message).send(res);

      case ErrorType.INTERNAL:
        return new InternalErrorResponse(err.message).send(res);

      case ErrorType.NOT_FOUND:
      case ErrorType.NO_ENTRY:
      case ErrorType.NO_DATA:
        return new NotFoundResponse(err.message).send(res);

      case ErrorType.METHOD_NOT_FOUND:
        return new MethodNotFoundResponse(err.message).send(res);

      case ErrorType.BAD_REQUEST:
        return new BadRequestResponse(err.message).send(res);

      case ErrorType.FORBIDDEN:
      case ErrorType.CORS_ERROR:
        return new ForbiddenResponse(err.message).send(res);

      case ErrorType.DB_ERROR:
        return new FailureMsgResponse(err.message).send(res);

      default: {
        const error = err as DatabaseError;

        if (error.code === '23503') {
          return new FailureMsgResponse(
            `Foreign key constraint violation: ${error.detail ?? ''}`
          ).send(res);
        }

        if (error.code === '23505') {
          return new FailureMsgResponse(
            error.detail ?? 'Duplicate value'
          ).send(res);
        }

        console.error(error);

        return new InternalErrorResponse(
          err.message
        ).send(res);
      }
    }
  }
}

export class CorsError extends ApiError {
  constructor(message = 'Not Allowed By CORS') {
    super(ErrorType.CORS_ERROR, message);
  }
}

export class AuthFailureError extends ApiError {
  constructor(message = 'Invalid Credentials') {
    super(ErrorType.UNAUTHORIZED, message);
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Internal error') {
    super(ErrorType.INTERNAL, message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(ErrorType.BAD_REQUEST, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(ErrorType.NOT_FOUND, message);
  }
}

export class MethodNotFoundError extends ApiError {
  constructor(message = 'Method Not Found') {
    super(ErrorType.METHOD_NOT_FOUND, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Permission denied') {
    super(ErrorType.FORBIDDEN, message);
  }
}

export class NoEntryError extends ApiError {
  constructor(message = 'Entry does not exist') {
    super(ErrorType.NO_ENTRY, message);
  }
}

export class BadTokenError extends ApiError {
  constructor(message = 'Invalid Token') {
    super(ErrorType.BAD_TOKEN, message);
  }
}

export class TokenExpiredError extends ApiError {
  constructor(message = 'Token is expired') {
    super(ErrorType.TOKEN_EXPIRED, message);
  }
}

export class NoDataError extends ApiError {
  constructor(message = 'No data available') {
    super(ErrorType.NO_DATA, message);
  }
}

export class AccessTokenError extends ApiError {
  constructor(message = 'Invalid access token') {
    super(ErrorType.ACCESS_TOKEN, message);
  }
}

export class DBValidationError extends ApiError {
  constructor(message = 'Invalid inputs') {
    super(ErrorType.DB_ERROR, message);
  }
}