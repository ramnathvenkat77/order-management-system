import { Response } from 'express';
import { ResponseStatus, StatusCode } from '../config';

abstract class ApiResponse {
  constructor(
    protected statusCode: StatusCode,
    protected status: ResponseStatus,
    protected message: string
  ) {}

  protected prepare<T extends ApiResponse>(
    res: Response,
    response: T
  ): Response {
    const clientResponse = ApiResponse.sanitize(response);

    return res.status(this.status).json(clientResponse);
  }

  public send(res: Response): Response {
    return this.prepare<ApiResponse>(res, this);
  }

 private static sanitize(
  response: ApiResponse
): Record<string, unknown> {
  const clone = { ...response } as Record<string, unknown>;

  delete clone.status;

  return clone;
}
}

export class AuthFailureResponse extends ApiResponse {
  constructor(message = 'Authentication Failure') {
    super(
      StatusCode.FAILURE,
      ResponseStatus.UNAUTHORIZED,
      message
    );
  }
}

export class NotFoundResponse extends ApiResponse {
  private url: string | undefined;

  constructor(message = 'Not Found') {
    super(
      StatusCode.FAILURE,
      ResponseStatus.NOT_FOUND,
      message
    );
  }

  public send(res: Response): Response {
    this.url = res.req.originalUrl;

    return super.prepare<NotFoundResponse>(res, this);
  }
}

export class MethodNotFoundResponse extends ApiResponse {
  private url: string | undefined;

  constructor(message = 'Method Not Found') {
    super(
      StatusCode.FAILURE,
      ResponseStatus.METHOD_NOT_FOUND,
      message
    );
  }

  public send(res: Response): Response {
    this.url = res.req.originalUrl;

    return super.prepare<MethodNotFoundResponse>(res, this);
  }
}

export class ForbiddenResponse extends ApiResponse {
  constructor(message = 'Forbidden') {
    super(
      StatusCode.FAILURE,
      ResponseStatus.FORBIDDEN,
      message
    );
  }
}

export class BadRequestResponse extends ApiResponse {
  constructor(message = 'Bad Request') {
    super(
      StatusCode.FAILURE,
      ResponseStatus.BAD_REQUEST,
      message
    );
  }
}

export class InternalErrorResponse extends ApiResponse {
  constructor(message = 'Internal Error') {
    super(
      StatusCode.FAILURE,
      ResponseStatus.INTERNAL_ERROR,
      message
    );
  }
}
export class AccessTokenErrorResponse extends ApiResponse {
  constructor(message = 'Invalid access token') {
    super(
      StatusCode.INVALID_ACCESS_TOKEN,
      ResponseStatus.UNAUTHORIZED,
      message
    );
  }
}

export class SuccessMsgResponse extends ApiResponse {
  constructor(message: string) {
    super(
      StatusCode.SUCCESS,
      ResponseStatus.SUCCESS,
      message
    );
  }
}

export class FailureMsgResponse extends ApiResponse {
  constructor(message: string) {
    super(
      StatusCode.FAILURE,
      ResponseStatus.BAD_REQUEST,
      message
    );
  }
}

export class SuccessResponse<T> extends ApiResponse {
  constructor(
    message: string,
    private data: T
  ) {
    super(
      StatusCode.SUCCESS,
      ResponseStatus.SUCCESS,
      message
    );
  }

  public send(res: Response): Response {
    return super.prepare<SuccessResponse<T>>(res, this);
  }
}