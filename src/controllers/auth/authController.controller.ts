import express from 'express';

import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';

import validationFDMiddleware from '../../middlewares/validationFormData.middleware';

import {
  LoginDto,
} from '../../database/repository/auth/auth.dto';

import AuthService from '../../services/auth/authService.services';

import {
  ApiError,
  InternalError,
} from '../../core/ApiError';

import {
  SuccessResponse,
} from '../../core/ApiResponse';

export class AuthController extends BaseController {
  constructor(
    protected path: APP_ROUTES = APP_ROUTES.AUTH,
    public router = express.Router(),
    public service: AuthService = new AuthService()
  ) {
    super(path, router, service);
  }

  public _initialiseRoutes(): void {
    this.router.post(
      `${this.path}/register`,
      validationFDMiddleware(this.dto),
      this.register.bind(this)
    );

    this.router.post(
      `${this.path}/login`,
      validationFDMiddleware(LoginDto),
      this.login.bind(this)
    );
  }

  protected async register(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const model = this.service.getModel();

      Object.assign(
        model,
        req.body
      );

      const data =
        await this.service.register(model);

      new SuccessResponse(
        'Registration successful',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  protected async login(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const model = this.service.getModel();

      Object.assign(
        model,
        req.body
      );

      const data =
        await this.service.login(model);

      new SuccessResponse(
        'Login successful',
        data
      ).send(res);
    } catch (error: unknown) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private handleControllerError(
    error: unknown,
    res: express.Response
  ): void {
    if (error instanceof ApiError) {
      ApiError.handle(
        error,
        res
      );

      return;
    }

    console.error(
      'Unexpected authentication error:',
      error
    );

    ApiError.handle(
      new InternalError(),
      res
    );
  }
}