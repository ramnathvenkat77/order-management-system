import bcrypt from 'bcrypt';

import { BaseServices } from '../baseService.services';

import { AuthModel } from '../../database/repository/auth/auth.model';
import { RegisterDto } from '../../database/repository/auth/auth.dto';

import {
  UsersEntity,
  UserRole,
  UserStatus,
} from '../../entities/usersEntity';

import {
  AuthFailureError,
  BadRequestError,
} from '../../core/ApiError';

import { createjwt } from '../../utils/jwt/jwt';

export interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthResponse {
  user: AuthUserResponse;
  token: string;
}

class AuthService extends BaseServices<
  AuthModel,
  RegisterDto
> {
  public getModel(): AuthModel {
    return new AuthModel();
  }

  public getDTO(): new () => RegisterDto {
    return RegisterDto;
  }

  public getModuleName(): string {
    return 'Authentication';
  }

  public async register(
    model: AuthModel
  ): Promise<AuthResponse> {
    const normalizedEmail =
      model.email.trim().toLowerCase();

    const existingUser =
      await UsersEntity.findOne({
        where: {
          email: normalizedEmail,
          is_delete: 0,
        },
      });

    if (existingUser) {
      throw new BadRequestError(
        'Email is already registered'
      );
    }

    const passwordHash =
      await bcrypt.hash(model.password, 12);

    const user = UsersEntity.create({
      name: model.name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await user.save();

    const token = createjwt({
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    });

    return {
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      },
      token,
    };
  }

  public async login(
    model: AuthModel
  ): Promise<AuthResponse> {
    const normalizedEmail =
      model.email.trim().toLowerCase();

    const user = await UsersEntity.findOne({
      where: {
        email: normalizedEmail,
        is_delete: 0,
      },
    });

    if (!user) {
      throw new AuthFailureError(
        'Invalid email or password'
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthFailureError(
        'User account is inactive'
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        model.password,
        user.password_hash
      );

    if (!passwordMatches) {
      throw new AuthFailureError(
        'Invalid email or password'
      );
    }

    const token = createjwt({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    };
  }
}

export default AuthService;