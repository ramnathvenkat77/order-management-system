import express from 'express';

import {
  ApiError,
  BadTokenError,
} from '../core/ApiError';

import {
  AuthTokenPayload,
  isTokenValid,
  verifyjwt,
} from '../utils/jwt/jwt';

type AuthenticatedRequest =
  express.Request & {
    authUser?: AuthTokenPayload;
  };

const authMiddleware = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
): void => {
  try {
    const authorizationHeader =
      req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith('Bearer ')
    ) {
      ApiError.handle(
        new BadTokenError(),
        res
      );

      return;
    }

    const token =
      authorizationHeader.split(' ')[1];

    if (!token) {
      ApiError.handle(
        new BadTokenError(),
        res
      );

      return;
    }

    const decodedToken = verifyjwt(token);

    if (!isTokenValid(decodedToken)) {
      ApiError.handle(
        new BadTokenError('Token is expired'),
        res
      );

      return;
    }

    req.authUser = decodedToken;

    next();
  } catch {
    ApiError.handle(
      new BadTokenError(),
      res
    );
  }
};

export default authMiddleware;