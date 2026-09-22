import express from 'express';

import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';

import authMiddleware from '../../middlewares/authMiddleware';

import UserManagementService from '../../services/usermanagement/userManagementService.services';

import {
  ApiError,
  InternalError,
} from '../../core/ApiError';

import {
  SuccessResponse,
} from '../../core/ApiResponse';

import {
  AuthTokenPayload,
} from '../../utils/jwt/jwt';

type AuthenticatedRequest =
  express.Request & {
    authUser?: AuthTokenPayload;
  };

export class UserManagementController extends BaseController {
  constructor(
    protected path: APP_ROUTES = APP_ROUTES.USERS,
    public router = express.Router(),
    public service: UserManagementService =
      new UserManagementService()
  ) {
    super(path, router, service);
  }

  public _initialiseRoutes(): void {
    this.router.get(
      `${this.path}/me`,
      authMiddleware,
      this.getCurrentUser.bind(this)
    );
  }

  private async getCurrentUser(
    req: AuthenticatedRequest,
    res: express.Response
  ): Promise<void> {
    try {
      const authUser = req.authUser;

      if (!authUser) {
        throw new Error(
          'Authenticated user missing'
        );
      }

      const data =
        await this.service.getCurrentUser(
          authUser.userId
        );

      new SuccessResponse(
        'User fetched successfully',
        data
      ).send(res);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        ApiError.handle(
          error,
          res
        );

        return;
      }

      console.error(
        'Unexpected user management error:',
        error
      );

      ApiError.handle(
        new InternalError(),
        res
      );
    }
  }
}