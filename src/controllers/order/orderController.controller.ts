import express from 'express';

import { BaseController } from '../baseController.controller';
import { APP_ROUTES } from '../../core/AppRoutes';

import OrderService from '../../services/order/orderService.services';

import { UserRole } from '../../entities/usersEntity';

import {
  CheckoutOrderDto,
  UpdateOrderStatusDto,
} from '../../database/repository/order/order.dto';

import authMiddleware from '../../middlewares/authMiddleware';

import {
  authorizeRoles,
} from '../../middlewares/roleMiddleware';

import validationFDMiddleware from '../../middlewares/validationFormData.middleware';

import {
  ApiError,
  AuthFailureError,
  BadRequestError,
  InternalError,
} from '../../core/ApiError';

import {
  SuccessResponse,
} from '../../core/ApiResponse';

export class OrderController extends BaseController {
  constructor(
    protected path: APP_ROUTES.ORDERS =
      APP_ROUTES.ORDERS,

    public router =
      express.Router(),

    public service: OrderService =
      new OrderService()
  ) {
    super(
      path,
      router,
      service
    );
  }

  public _initialiseRoutes(): void {
    // CUSTOMER: create order / checkout
    this.router.post(
      this.path,
      authMiddleware,
      authorizeRoles(
        UserRole.CUSTOMER
      ),
      validationFDMiddleware(
        CheckoutOrderDto
      ),
      this.checkout.bind(this)
    );

    // CUSTOMER: get own orders
    this.router.get(
      this.path,
      authMiddleware,
      authorizeRoles(
        UserRole.CUSTOMER
      ),
      this.getOrders.bind(this)
    );

    // ADMIN / OPERATIONS: update order status
    this.router.patch(
      `${this.path}/:id/status`,
      authMiddleware,
      authorizeRoles(
        UserRole.ADMIN,
        UserRole.OPERATIONS
      ),
      validationFDMiddleware(
        UpdateOrderStatusDto
      ),
      this.updateOrderStatus.bind(this)
    );

    // CUSTOMER: get one own order
    this.router.get(
      `${this.path}/:id`,
      authMiddleware,
      authorizeRoles(
        UserRole.CUSTOMER
      ),
      this.getOrderById.bind(this)
    );
  }

  private async checkout(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId =
        this.getUserId(req);

      const dto =
        req.body as CheckoutOrderDto;

      const order =
        await this.service.checkout(
          userId,
          dto
        );

      new SuccessResponse(
        'Order created successfully',
        order
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async getOrders(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId =
        this.getUserId(req);

      const orders =
        await this.service
          .getOrdersForUser(
            userId
          );

      new SuccessResponse(
        'Orders fetched successfully',
        orders
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async getOrderById(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const userId =
        this.getUserId(req);

      const orderId =
        this.validateId(
          req.params.id
        );

      const order =
        await this.service
          .getOrderByIdForUser(
            userId,
            orderId
          );

      new SuccessResponse(
        'Order fetched successfully',
        order
      ).send(res);
    } catch (error) {
      this.handleControllerError(
        error,
        res
      );
    }
  }

  private async updateOrderStatus(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const orderId =
        this.validateId(
          req.params.id
        );

      const dto =
        req.body as UpdateOrderStatusDto;

      const order =
        await this.service
          .updateOrderStatus(
            orderId,
            dto.status
          );

      new SuccessResponse(
        'Order status updated successfully',
        order
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