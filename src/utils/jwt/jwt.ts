import jwt, {
  JwtPayload,
  SignOptions,
} from 'jsonwebtoken';

import {
  JWT_SECRET_KEY,
  JWT_EXP,
} from '../../config';

import { UserRole } from '../../entities/usersEntity';

export interface AuthTokenPayload extends JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

function getJwtSecret(): string {
  if (!JWT_SECRET_KEY) {
    throw new Error(
      'JWT secret key is missing in environment variables'
    );
  }

  return JWT_SECRET_KEY;
}

export const createjwt = (
  body: Omit<AuthTokenPayload, 'iat' | 'exp'>
): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXP as SignOptions['expiresIn'],
  };

  return jwt.sign(
    body,
    getJwtSecret(),
    options
  );
};

export const verifyjwt = (
  token: string
): AuthTokenPayload => {
  return jwt.verify(
    token,
    getJwtSecret()
  ) as AuthTokenPayload;
};

export const isTokenValid = (
  token: AuthTokenPayload
): boolean => {
  const currentUnixTime =
    Math.floor(Date.now() / 1000);

  if (
    token.exp !== undefined &&
    token.exp > currentUnixTime
  ) {
    return true;
  }

  return false;
};