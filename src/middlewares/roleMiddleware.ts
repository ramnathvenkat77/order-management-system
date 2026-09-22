import express from 'express';

import {
  ApiError,
  AuthFailureError,
  ForbiddenError,
} from '../core/ApiError';

import { UserRole } from '../entities/usersEntity';
import { AuthTokenPayload } from '../utils/jwt/jwt';

type AuthenticatedRequest =
  express.Request & {
    authUser?: AuthTokenPayload;
  };

export const authorizeRoles = (
  ...allowedRoles: UserRole[]
): express.RequestHandler => {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    const authenticatedRequest =
      req as AuthenticatedRequest;

    const authUser =
      authenticatedRequest.authUser;

    if (!authUser) {
      ApiError.handle(
        new AuthFailureError(
          'Authentication required'
        ),
        res
      );

      return;
    }

    if (!allowedRoles.includes(authUser.role)) {
      ApiError.handle(
        new ForbiddenError(
          'You do not have permission to perform this action'
        ),
        res
      );

      return;
    }

    next();
  };
};