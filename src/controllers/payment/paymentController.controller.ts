import express from 'express';
import { UserRole } from '../../entities/usersEntity';
import {
  BaseController,
} from '../baseController.controller';

import {
  APP_ROUTES,
} from '../../core/AppRoutes';

import PaymentService from '../../services/payment/paymentService.services';

import {
  SimulatePaymentDto,
} from '../../database/repository/payment/payment.dto';

import authMiddleware from '../../middlewares/authMiddleware';

import {
  authorizeRoles,
} from '../../middlewares/roleMiddleware';

import validationFDMiddleware from '../../middlewares/validationFormData.middleware';

// PASTE THE EXACT UserRole IMPORT FROM CartController HERE

import {
  ApiError,
  AuthFailureError,
  BadRequestError,
  InternalError,
} from '../../core/ApiError';

import {
  SuccessResponse,
} from '../../core/ApiResponse';

export class PaymentController extends BaseController {
  constructor(
    protected path: APP_ROUTES.PAYMENTS =
      APP_ROUTES.PAYMENTS,

    public router =
      express.Router(),

    public service: PaymentService =
      new PaymentService()
  ) {
    super(
      path,
      router,
      service
    );
  }

  public _initialiseRoutes(): void {
    this.router.post(
      `${this.path}/:orderId/pay`,
      authMiddleware,
      authorizeRoles(
        UserRole.CUSTOMER
      ),
      validationFDMiddleware(
        SimulatePaymentDto
      ),
      this.payForOrder.bind(this)
    );
  }

  private async payForOrder(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId =
        this.getUserId(req);

      const orderId =
        this.validateId(
          req.params.orderId
        );

      const dto =
        req.body as SimulatePaymentDto;

      const payment =
        await this.service.payForOrder(
          userId,
          orderId,
          dto
        );

      new SuccessResponse(
        'Payment processed successfully',
        payment
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private getUserId(
    req: express.Request
  ): number {
    const authenticatedRequest =
      req as express.Request & {
        authUser?: {
          userId: number;
          email: string;
          role: string;
        };
      };

    const userId =
      authenticatedRequest
        .authUser?.userId;

    if (!userId) {
      throw new AuthFailureError(
        'Authenticated user not found'
      );
    }

    return userId;
  }

  private validateId(
    value: string | string[]
  ): number {
    if (Array.isArray(value)) {
      throw new BadRequestError(
        'Invalid order id'
      );
    }

    const id =
      Number(value);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new BadRequestError(
        'Invalid order id'
      );
    }

    return id;
  }

  private handleControllerError(
    error: unknown,
    res: express.Response
  ): void {
    if (
      error instanceof ApiError
    ) {
      ApiError.handle(
        error,
        res
      );

      return;
    }

    console.error(error);

    ApiError.handle(
      new InternalError(
        'Something went wrong'
      ),
      res
    );
  }
}